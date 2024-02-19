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
  ctx.strokeStyle = stroke;
  ctx.fillStyle = fill;
}
