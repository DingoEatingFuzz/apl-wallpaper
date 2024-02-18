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
  // There are two grids:
  // 1. Hexagons, defines the overall structure
  // 2. Triangles, six within each hexagon, defines shape placement

  let canvas;

  const hex = (x, y, s) => {
    // Derive points from s. Apply translation with x, y
    const points = [];
    for (let i = 0; i < 6; i++) {
      const ang = (2 * Math.PI / 6) * i - Math.PI / 2;
      points.push({ x: Math.cos(ang) * s, y: Math.sin(ang) * s });
    }
    return points.map(p => ({ x: p.x + x, y: p.y + y  }));
  }

  const drawPts = (ctx, pts, fill = true, stroke = true) => {
    console.log('pts', pts);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  $: {
    const ctx = canvas?.getContext('2d', { colorSpace: 'display-p3' });
    console.log('check?', ctx);

    if (ctx) {
      ctx.fillStyle="#333344";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'red';
      drawPts(ctx, hex(100, 100, 20));
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
