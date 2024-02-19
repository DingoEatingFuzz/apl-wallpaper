// Returns vertices for an N-sided polygon where x,y is the center
export const poly = (x, y, s, sides, a = -Math.PI / 2) => {
  // Derive points from s. Apply translation with x, y
  const points = [];
  for (let i = 0; i < 6; i++) {
    const ang = (2 * Math.PI / sides) * i + a;
    points.push({ x: Math.cos(ang) * s, y: Math.sin(ang) * s });
  }
  return points.map(p => ({ x: p.x + x, y: p.y + y  }));
}

// A regular hexagon where x,y is the center
export const hex = (x, y, s, a = -Math.PI / 2) => {
  return poly(x, y, s, 6, a);
}

// A regular triangle where x,y is the center
export const tri = (x, y, s, a = -Math.PI / 2) => {
  return poly(x, y, s, 3, a);
}

// Given a regular hexagon, return the inner six equilateral triangles
export const trisFromHex = (pts) => {
  const cen = { x: pts[0].x, y: pts[0].y + (pts[3].y - pts[0].y) / 2 };
  return pts.map((pt, i) => {
    return [
      { ...pt },
      { ...cen },
      { ...pts[(i+1)%pts.length]},
    ]
  })
}

export const hexTri = (pts, idx) => {
  // Could be more efficient, we'll see if it matters
  return trisFromHex(pts)[(idx+1)%6];
}

class HexGrid {
  grid = {};

  at(q, r) {
    return this.grid[`${q},${r}`];
  }

  // q + r + s = 0
  atSR(s, r) {
    return this.at(-s - r, r);
  }

  atSQ(s, q) {
    return this.at(q, -s - q);
  }

  put(q, r, v) {
    this.grid[`${q},${r}`] = v;
    return this.grid;
  }

  rm(q, r) {
    delete this.grid[`${q},${r}`];
    return this.grid;
  }

  rmSR(s, r) {
    return this.rm(-s - r, r);
  }

  rmSQ(s, q) {
    return this.at(q, -s - q);
  }

  allCoords() {
    return Object.keys(this.grid).map(k => k.split(','));
  }
}

class TriGrid {
  grid = new Array(6).fill(false);

  at(i) {
    return this.grid[i];
  }

  put(i, v = true) {
    this.grid[i] = v;
    return this.grid;
  }

  rm(i) {
    this.grid[i] = false;
    return this.grid;
  }
}

const hexDir = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1]
];

export const hexAdd = (q, r, [dq, dr]) => [q+dq, r+dr];
export const hexNeighbor = ([q, r], dir) => hexAdd(q, r, hexDir[dir]);
export const hexScale = ([q, r], factor) => [q*factor, r*factor];

export const triNeighbors = ([q, r], t) => {
  // Two neighbors are in the hex, one is outside
  return [
    // Clockwise
    [[q,r], (t+1)%6],
    // Counter-clockwise
    [[q,r], t-1 === -1 ? 5 : t-1],
    // Neighbor hex + reflect (also hexes and tris have different winding orders, rip)
    [hexNeighbor([q,r], 3-t < 0 ? 6+3-t : 3-t), (t+3)%6],
  ];
}

export const triHexes = ([q, r], t) => {
  // A triangle has three hexagones, rotating clockwise from each side
  // Yeah, I don't know what I was thinking, but it works.
  // 0 -> 0 -> 0 -> 0 -> 0 -> 0
  // 1 -> 2 -> 1 -> 2 -> 1 -> 2
  // 2 -> 1 -> 2 -> 1 -> 2 -> 1
  return [
    [ [[q,r], t], ...[0,0,0,0,0].reduce((p, n) => p.concat([triNeighbors(...p[p.length-1])[n]]), [[[q,r], t]]) ],
    [ [[q,r], t], ...[1,2,1,2,1].reduce((p, n) => p.concat([triNeighbors(...p[p.length-1])[n]]), [[[q,r], t]]) ],
    [ [[q,r], t], ...[2,1,2,1,2].reduce((p, n) => p.concat([triNeighbors(...p[p.length-1])[n]]), [[[q,r], t]]) ],
  ]
}

const triEq = (a, b) => {
  return a[0][0] === b[0][0] && a[0][1] === b[0][1] && a[1] === b[1];
}

export const triHalves = ([q,r], t) => {
  const neighbors = triNeighbors([q,r], t);
  console.log('neigh', neighbors);
  return neighbors.map(n => {
    const [a, b] = triNeighbors(...n).filter(tri => !triEq(tri, [[q,r], t]));
    return [
      [ [[q,r], t], n, a ],
      [ [[q,r], t], n, b ],
    ]
  }).flat();
}

// Given a width, a height, and a hex size, return a hash of axial coordinates
export const hexGrid = (w, h, s) => {
  // Calculate ring size 
  const rings = Math.floor(Math.min(w, h) / 2 / (s*1.5));

  // Hash map of coordinates
  const grid = new HexGrid();

  for (let i = 0; i < rings; i++) {
    if (i === 0) {
      grid.put(0,0, new TriGrid());
      continue;
    }

    let [q, r] = hexAdd(0, 0, hexScale(hexDir[4], i));

    for (let j = 0; j < 6; j++) {
      for (let k = 0; k < i; k++) {
        grid.put(q, r, new TriGrid());
        [q, r] = hexNeighbor([q, r], j);
      }
    }
  }

  return grid;
}
