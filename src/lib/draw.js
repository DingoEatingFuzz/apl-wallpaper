import { hexTri, hex } from '$lib/geom';

export const drawPts = (ctx, pts, fill = true, stroke = true) => {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.lineTo(pts[0].x, pts[0].y);
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

export const style = (ctx, stroke = 'black', fill = 'transparent', width = 1) => {
  ctx.lineWidth = width;
  ctx.strokeStyle = width ? stroke : 'transparent';
  ctx.fillStyle = fill;
}

export const localToGlobal = ([q, r], scale) => {
  const w = 3840;
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

export const drawShape = (ctx, scale, shapes) => {
  shapes.forEach(([h, t]) => {
    const [x,y] = localToGlobal(h, scale);
    const pts = hexTri(hex(x, y, scale), t);
    drawPts(ctx, pts);
  })
};
