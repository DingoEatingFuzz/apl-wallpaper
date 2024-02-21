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
      background: oklch(0.35 0.03 225.59);
      font-family: sans-serif;
      color: oklch(0.95 0.03 225.59 / 1);
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
    line-height: 1.5;
  }

  h1 {
    color: white;
    margin-top: 0;
  }

  .tri-align {
    margin-bottom: 1em;
  }

  button {
    margin-top: 1em;
  }

  .tri-align .label {
    display: flex;
    justify-content: space-around;
    color: oklch(0.75 0.03 225.59 / 1);
  }

  .inputs div {
    display: flex;
    justify-content: center;
  }
</style>

<script>
  import { onMount, tick } from "svelte";

  import * as g from '$lib/geom.js';
  import * as d from '$lib/draw.js';

  let canvas;
  let gridSize = 50;
  let showHexGrid = true;
  let showTriGrid = true;
  let isUltrawide = false;
  let transparentBg = false;

  // 5120 x 2160
  // 3840 x 2160

  let cWidth = isUltrawide ? 5120 : 3840;
  let cHeight = 2160;

  let mixReso = 7;
  $: mixes = Array(mixReso).fill(null).map((_, row) => {
    let v = mixReso - row - 1;
    return Array(row + 1).fill(null).map((_, col) => {
      let n = row - col;
      let w = col;
      let sum = v + n + w;
      console.log(v, n, w, v + n + w);
      return [n, v, w].map(p => Math.round((p / sum) * 100)).join('-');
    });
  });

  let mix = '33-33-33';
  let goalPct = 50;
  $: nomadPct = parseInt(mix.split('-')[0], 10);
  $: vagrantPct = parseInt(mix.split('-')[1], 10);
  $: waypointPct = parseInt(mix.split('-')[2], 10);

  let img = new Image();
  let ready = false;

  async function setUltrawide(ev) {
    // Unfortunately we must wait for the html element to repaint to have proper dimensions in reactive handler
    cWidth = ev.target.checked ? 5120 : 3840;
    await tick();
    isUltrawide = ev.target.checked;
  }

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

  function saveImage() {
    const dataURL = canvas.toDataURL();
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'apl-wallpaper.png';
    a.click();
  }

  const validate = (grid, tris) => {
    for (let tri of tris) {
      const [[q, r], t] = tri;
      if (!grid.at(q, r) || grid.at(q, r).at(t)) return false;
    }
    return true;
  }

  $: {
    let ultra = isUltrawide;
    const ctx = canvas?.getContext('2d', { colorSpace: 'display-p3' });

    if (ctx && ready) {
      console.log('Ready?', ctx, ready, ultra, canvas.width, canvas.height);
      let localToGlobal = d.localToGlobalator(canvas.width, canvas.height);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, canvas.width / 2 - canvas.height / 2, 0, canvas.height, canvas.height);
      const dimg = ctx.getImageData(canvas.width / 2 - canvas.height / 2, 0, canvas.height, canvas.height);

      if (transparentBg) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle="#0d0e12";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Make a big ol' hexagon shaped hex grid
      const grid = g.hexGrid(canvas.width, canvas.height, gridSize);

      // Drop hexagons outside of the logo
      // Get the color of the texture pixel proportionally under the target point
      // Just the red channel, since the texture is white on transparent.
      const xoff = Math.floor(canvas.width / 2 - dimg.width / 2);
      console.log('Wat', isUltrawide, canvas.width, dimg.width, xoff);
      grid.allCoords().forEach((hex) => {
        const [x, y] = localToGlobal(hex, gridSize).map(v => Math.round(v));
        let color = dimg.data[(y * dimg.width + x - xoff) * 4];
        if (color !== 255) grid.rm(...hex);
      });


      const colVagrant = '#2E71E5';
      const colNomad = '#60DEA9';
      const colWaypoint = '#62D4DC';

      // Try filling out the grid with nomads and waypoints and vagrants
      const totalTris = grid.allCoords().length * 6;

      const goal = goalPct / 100;
      const nomads = Math.round(totalTris * goal * nomadPct / 100 / 6);
      const waypoints = Math.round(totalTris * goal * waypointPct / 100 / 3);
      const vagrants = Math.round(totalTris * goal * vagrantPct / 100);

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
        d.drawShape(ctx, localToGlobal, gridSize, hex);
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
        d.drawShape(ctx, localToGlobal, gridSize, half);
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
        d.drawShape(ctx, localToGlobal, gridSize, [tri]);
      }

      if (showHexGrid || showTriGrid) {
        grid.allCoords().forEach(hex => {
          const [x, y] = localToGlobal(hex, gridSize);
          const h = g.hex(x, y, gridSize);

          if (showHexGrid) {
            d.style(ctx, 'oklch(0.8, 0.05, 225.59)', 'transparent', 3);
            d.drawPts(ctx, h);
          }

          if (showTriGrid) {
            d.style(ctx, 'oklch(0.7, 0.05, 225.59)', 'transparent', 1);
            g.trisFromHex(h).forEach(t => d.drawPts(ctx, t));
          }
        });
      }
    }
  }
</script>

<main>
  <canvas bind:this={canvas} width={cWidth} height={cHeight}></canvas>
</main>
<aside>
  <h1>Applications Products</h1>
  <p>Play with sliders to your liking and export your own 5k wallpaper.</p>
  <form>
      <label>
        % filled
        <div><input type="range" min="0" max="100" step="1" bind:value={goalPct} /> {goalPct}%</div>
      </label>
      <label>
        Hex size
        <div><input type="range" min="10" max="100" step="1" bind:value={gridSize} /> {gridSize}</div>
      </label>
      <label>
        Extended hex sizes
        <div><input type="range" min="100" max="400" step="1" bind:value={gridSize} /> {gridSize}</div>
      </label>
      <div class='tri-align'>
        <p>Product alignment</p>
        <div class='label'><span>Vagrant</span></div>
        <div class='inputs'>
          {#each mixes as row}
            <div>
              {#each row as m}
                <input type='radio' bind:group={mix} value={m} />
              {/each}
            </div>
          {/each}
        </div>
        <div class='label'>
          <span>Nomad</span>
          <span>Waypoint</span>
        </div>
      </div>
      <label>
        <div><input type="checkbox" bind:checked={showHexGrid} /> Show hex grid</div>
      </label>
      <label>
        <div><input type="checkbox" bind:checked={showTriGrid} /> Show triangle grid</div>
      </label>
      <label>
        <div><input type="checkbox" on:input={setUltrawide} /> Ultrawide</div>
      </label>
      <label>
        <div><input type="checkbox" bind:checked={transparentBg} /> Transparent BG</div>
      </label>
    <button on:click={saveImage}>Save Image</button>
  </form>
</aside>
