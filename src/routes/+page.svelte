<svelte:head>
  <style>
    * {
      box-sizing: border-box;
    }

    html, body, .app-wrapper {
      padding: 0;
      margin: 0;
      height: 100vh;
      width: 100%;
      background: oklch(0.15 0.03 225.59);
      font-family: sans-serif;
      color: oklch(0.75 0.03 225.59 / 1);
    }
  </style>
</svelte:head>

<style>
  main, canvas {
    max-width: 100%;
  }

  canvas {
    max-height: 100%;
  }
  
  main {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  aside {
    position: fixed;
    right: 30px;
    top: 30px;
    background: oklch(0.32 0.05 225.14);
    padding: 20px;
    border: 1px solid oklch(0.45 0.03 225.59 / 1);
    width: 300px;
  }

  h1 {
    color: white;
    margin-top: 0;
  }
</style>

<script>
  import { onMount } from "svelte";

  import * as g from '$lib/geom.js';
  import * as d from '$lib/draw.js';

  let canvas;
  let gridSize = 100;
  let showHexGrid = false;
  let showTriGrid = false;

  let img = new Image();
  let ready = false;

  onMount(() => {
    img.onload = () => {
      ready = true;
    };
    img.src = "logo.png";
  });

  // In-place shuffle
  const shuffle = (arr) => {
    let len = arr.length;
    while (len) {
      len--;
      const idx = Math.floor(Math.random() * len);

      const dest = arr[len];
      arr[len] = arr[idx];
      arr[idx] = dest;
    }
    return arr;
  }

  const validate = (grid, tris) => {
    for (let tri of tris) {
      const [[q, r], t] = tri;
      if (!grid.at(q, r) || grid.at(q, r).at(t)) return false;
    }
    return true;
  }

  $: {
    const ctx = canvas?.getContext('2d', { colorSpace: 'display-p3' });

    if (ctx && ready) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, canvas.width / 2 - canvas.height / 2, 0, canvas.height, canvas.height);
      const dimg = ctx.getImageData(canvas.width / 2 - canvas.height / 2, 0, canvas.height, canvas.height);

      ctx.fillStyle="#0d0e12";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Make a big ol' hexagon shaped hex grid
      const grid = g.hexGrid(3940, 2160, gridSize);

      // Drop hexagons outside of the logo
      // Get the color of the texture pixel proportionally under the target point
      // Just the red channel, since the texture is white on transparent.
      grid.allCoords().forEach((hex) => {
        const [x, y] = d.localToGlobal(hex, gridSize).map(v => Math.round(v));
        const xoff = Math.floor(canvas.width / 2 - dimg.width / 2);
        let color = dimg.data[(y * dimg.width + x - xoff) * 4];
        console.log(y, xoff, x - xoff, y * dimg.width + x - xoff, color);
        if (color !== 255) grid.rm(...hex);
      });


      const colVagrant = '#2E71E5';
      const colNomad = '#60DEA9';
      const colWaypoint = '#62D4DC';

      // Try filling out the grid with nomads and waypoints and vagrants
      const totalTris = grid.allCoords().length * 6;
      const goalPct = 0.75
      const nomadPct = 0.33;
      const waypointPct = 0.33;
      const vagrantPct = 0.33;

      const nomads = Math.round(totalTris * goalPct * nomadPct / 6);
      const waypoints = Math.round(totalTris * goalPct * waypointPct / 3);
      const vagrants = Math.round(totalTris * goalPct * vagrantPct);

      const hexIds = grid.allCoords();

      for (let i = 0; i < nomads; i++) {
        let hexLoc = hexIds[Math.floor(Math.random() * hexIds.length)];
        let triLoc = Math.floor(Math.random() * 6);
        let hex;

        let retries = 20;
        let bail = true;

        for (let j = 0; j < retries; j++) {
          const hexes = shuffle(g.triHexes(hexLoc, triLoc));
          hex = hexes.find(h => validate(grid, h));
          if (hex) {
            // Populate the grid
            hex.forEach(t => {
              grid.at(t[0][0], t[0][1]).put(t[1]);
            })
            bail = false;
            break;
          }
          hexLoc = hexIds[Math.floor(Math.random() * hexIds.length)];
          triLoc = Math.floor(Math.random() * 6);
        }

        if (bail) break;

        d.style(ctx, 'transparent', colNomad, 2);
        d.drawShape(ctx, gridSize, hex);
      }

      for (let i = 0; i < waypoints; i++) {
        let hexLoc = hexIds[Math.floor(Math.random() * hexIds.length)];
        let triLoc = Math.floor(Math.random() * 6);
        let half;

        let retries = 20;
        let bail = true;

        for (let j = 0; j < retries; j++) {
          const halves = shuffle(g.triHalves(hexLoc, triLoc));
          half = halves.find(h => validate(grid, h));
          if (half) {
            // Populate the grid
            half.forEach(t => {
              grid.at(t[0][0], t[0][1]).put(t[1]);
            })
            bail = false;
            break;
          }
          hexLoc = hexIds[Math.floor(Math.random() * hexIds.length)];
          triLoc = Math.floor(Math.random() * 6);
        }

        if (bail) break;

        d.style(ctx, 'transparent', colWaypoint, 2);
        d.drawShape(ctx, gridSize, half);
      }

      for (let i = 0; i < vagrants; i++) {
        let hexLoc = hexIds[Math.floor(Math.random() * hexIds.length)];
        let triLoc = Math.floor(Math.random() * 6);

        let tri;

        let retries = 20;
        let bail = true;

        for (let j = 0; j < retries; j++) {
          tri = [hexLoc, triLoc];
          if (validate(grid, [tri])) {
            // Populate the grid
            grid.at(tri[0][0], tri[0][1]).put(tri[1]);
            bail = false;
            break;
          }
          hexLoc = hexIds[Math.floor(Math.random() * hexIds.length)];
          triLoc = Math.floor(Math.random() * 6);
        }

        if (bail) break;

        d.style(ctx, 'transparent', colVagrant, 2);
        d.drawShape(ctx, gridSize, [tri]);
      }

      if (showHexGrid || showTriGrid) {
        grid.allCoords().forEach(hex => {
          const [x, y] = d.localToGlobal(hex, gridSize);
          const h = g.hex(x, y, gridSize);

          if (showHexGrid) {
            d.style(ctx, 'rgba(255, 255, 255, 0.3)', 'transparent', 3);
            d.drawPts(ctx, h);
          }

          if (showTriGrid) {
            d.style(ctx, 'steelgrey', 'transparent', 1);
            g.trisFromHex(h).forEach(t => d.drawPts(ctx, t));
          }
        });
      }
    }
  }
</script>

<main>
  <canvas bind:this={canvas} width="3840" height="2160"></canvas>
</main>
<aside>
  <h1>Applications Product Line</h1>
  <p>Play with sliders to your liking and export your own 5k wallpaper.</p>
  <form>
    <ul>
      <li>% filled</li>
      <li>Hex size</li>
      <li>Vagrant</li>
      <li>Nomad</li>
      <li>Waypoint</li>
      <li>Color variation</li>
      <li>Scale</li>
      <li>Ultrawide?</li>
    </ul>
    <button>Save Image</button>
  </form>
</aside>
