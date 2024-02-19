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
    width: 100%;
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

  const localToGlobal = ([q, r], scale) => {
    const w = 3940;
    const h = 2160;
    const s = -q-r;

    // These are used for rendering the grid, not necessary here?
    const hs = Math.sqrt(3) * scale;
    const vs = 3 / 2 * scale;
    let x = w/2
    let y = h/2;

    // q, r, and s represent magnitude vectors, hs and vs represent the x and y components
    x += s * hs/2 + q * -hs/2;
    y += s * vs + q * vs;

    return [x, y];
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
    }
  }
</script>

<main>
  <canvas bind:this={canvas} width="3940" height="2160"></canvas>
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
