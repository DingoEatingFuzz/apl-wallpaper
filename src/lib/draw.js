import { hexTri, hex } from '$lib/geom';

export const drawPts = (ctx, pts, fill = true, stroke = true) => {
  console.log('wat', pts.length);
  ctx.font = "42px sans-serif";
  pts.forEach((p,i) => {
    //ctx.beginPath();
    //ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
    //ctx.fill();
    ctx.fillText(i, p.x, p.y);
  });
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

const lrBounds = (pts) => {
  const left = pts.reduce((c, pt) => {
    let ret = pt.x < c.x ? pt : c
    if (pt.x === c.x) ret = pt.y < c.y ? pt : c;
    return ret;
  }, pts[0]);

  const right = pts.reduce((c, pt) => {
    let ret = pt.x > c.x ? pt : c
    if (pt.x === c.x) ret = pt.y > c.y ? pt : c;
    return ret;
  }, pts[0]);

  return [left, right];
}

// const lineDist = (pt, [a, b]) => {
//   let dy = b.y - a.y;
//   let dx = a.x - b.x;
//   return dx * (pt.y - a.y) + dy * (pt.x - a.x);
// }

// const lineDist = (pt, [a, b]) => {
//   return (a.x - pt.x) * (b.y - pt.y) - (b.x - pt.x) * (a.y - pt.y);
// }

// let d = (line.pt1.x - pt.x) * (line.pt2.y - pt.y) - (line.pt2.x - pt.x) * (line.pt1.y - pt.y)

const dist2 = (v, w) => {
  if (v.x === w.x && v.y === w.y) return 0;
  return Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
}

const distToSegment = (p, v, w) => {
  var l2 = dist2(v, w);

  if (l2 == 0) {
    return dist2(p, v);
  }

  var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;

  t = Math.max(0, Math.min(1, t));

  return dist2(p, {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y)
  });
}

function distancePointLine(pt, [a, b]) {
  return distToSegment(pt, a, b)
}

const distPoints = ([a, b], pts) => {
  let maxDist = 0;
  let max;

  const [up, down] = pts.reduce((agg, pt) => {
    const d = distancePointLine(pt, [a, b]);
    console.log('d', d);
    if (d > 0) {
      agg[0].push(d);
      // Side-effect for one pass
      if (d > maxDist) {
        maxDist = d;
        max = pt;
      }
    } else if (d < 0) {
      agg[1].push(d);
    }
    return agg;
  }, [[],[]]);

  return [max, up, down];
}

const _hull = (h, [a, b], pts) => {
  const [max, sub] = distPoints([a, b], pts);
  if (!sub.length) return;


  if (max) h.push(max);

  _hull(h, [a, max], sub);
  _hull(h, [max, b], sub);
}

const hull = (pts) => {
  if (pts.length <= 3) return pts;

  const [l, r] = lrBounds(pts);
  const [,up, down] = distPoints([l, r], pts);

  const h = [l];
  _hull(h, [l, r], up);
  h.push(r);
  _hull(h, [r, l], down);

  console.log('done', h);
  return h;
}

export const drawShape = (ctx, scale, shapes) => {
  const pts = shapes.map(([h, t]) => {
    const [x,y] = localToGlobal(h, scale);
    return hexTri(hex(x, y, scale), t);
  })
  drawPts(ctx, hull(pts.flat()));
};
