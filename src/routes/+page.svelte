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
  import * as g from '$lib/geom.js';
  import * as d from '$lib/draw.js';

  let canvas;
  let gridSize = 50;

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
      console.log('Tri?', tri, grid.at(q, r), grid.at(q, r)?.at(t));
      if (!grid.at(q, r) || grid.at(q, r).at(t)) return false;
    }
    return true;
  }

  $: {
    const ctx = canvas?.getContext('2d', { colorSpace: 'display-p3' });

    if (ctx) {
      ctx.fillStyle="#333344";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const grid = g.hexGrid(3940, 2160, gridSize);
      grid.allCoords().forEach(hex => {
        const [x, y] = localToGlobal(hex, gridSize);
        const h = g.hex(x, y, gridSize);

        d.style(ctx, 'red', 'rgba(255,255,255,0.1)', 3);
        d.drawPts(ctx, h);

        d.style(ctx, 'pink');
        g.trisFromHex(h).forEach(t => d.drawPts(ctx, t));
      });

      // try coloring some triangles
      const ti = 0;

      // d.style(ctx, 'white', 'teal', 2);
      // g.triNeighbors([0,0], ti).forEach(t => {
      //   const [x,y] = localToGlobal(t[0], gridSize);
      //   const pts = g.hexTri(g.hex(x, y, gridSize), t[1]);
      //   d.drawPts(ctx, pts);
      // })

      // d.style(ctx, 'white', 'brown', 2);
      // const [x,y] = localToGlobal([0,0], gridSize);
      // const pts = g.hexTri(g.hex(x, y, gridSize), ti);
      // d.drawPts(ctx, pts);

      const hexes = g.triHexes([0,0], ti);
      const colors = ['rgba(255,0,0,0.4)', 'rgba(0,255,0,0.4)', 'rgba(0,0,255,0.4)'];
      hexes.forEach((h, i) => {
        d.style(ctx, 'white', colors[i], 2);
        h.forEach(([hex, t]) => {
          const [x,y] = localToGlobal(hex, gridSize);
          const pts = g.hexTri(g.hex(x, y, gridSize), t);
          d.drawPts(ctx, pts);
        })
      });

      const halves = g.triHalves([2,0], ti);
      const hcolors = ['pink', 'orange', 'purple', 'cyan', 'green', 'maroon'];
      halves.slice(0,6).forEach((h, i) => {
        d.style(ctx, 'white', hcolors[i], 2);
        console.log('haytch', h);
        h.forEach(([hex, t]) => {
          const [x,y] = localToGlobal(hex, gridSize);
          const pts = g.hexTri(g.hex(x, y, gridSize), t);
          d.drawPts(ctx, pts);
        });
      })
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
