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

const localToGlobal = (w, h, [q, r], scale) => {
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

export const localToGlobalator = (w, h) => (hex, scale) => localToGlobal(w, h, hex, scale);

const det3 = (l, m, r) => (m.x - l.x) * (r.y - l.y) - (r.x - l.x) * (m.y - l.y);

const upperHull = (pts) => {
  const up = [];

  // While we're "going right"
  for (let pt of pts) {
    while (up.length >= 2 && det3(up[up.length - 2], up[up.length - 1], pt) <= 0) {
      up.pop();
    }
    up.push(pt);
  }

  return up;
}

const lowerHull = (pts) => {
  const b = pts.slice().reverse();
  const low = [];
  for (let pt of b) {
    while (low.length >= 2 && det3(low[low.length - 2], low[low.length - 1], pt) <= 0) {
      low.pop();
    }
    low.push(pt);
  }
  low.shift();
  return low;
}

// Graham scan https://observablehq.com/@timhau/convex-hull
const hull = (pts) => {
  if (pts.length <= 3) return pts;

  pts.sort((a, b) => {
    if (a.x < b.x) return -1;
    if (a.x === b.x) {
      if (a.y < b.y) return -1;
    }
    return 1;
  });

  return [...upperHull(pts), ...lowerHull(pts)];
}

export const drawShape = (ctx, ltg, scale, shapes) => {
  const pts = shapes.map(([h, t]) => {
    const [x,y] = ltg(h, scale);
    return hexTri(hex(x, y, scale), t);
  })
  drawPts(ctx, hull(pts.flat()));
};
