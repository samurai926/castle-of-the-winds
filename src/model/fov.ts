import { TileMap } from "./TileMap";

/**
 * Reveal tiles within `radius` of (px,py), respecting line-of-sight.
 * Once seen, tiles stay seen on map.seen[][].
 */
export function computeFOV(map: TileMap, px: number, py: number, radius: number): void {
  map.resetVisible();
  map.markSeen(px, py);
  if (!map.fogOfWar) return;

  for (let oy = -radius; oy <= radius; oy++) {
    for (let ox = -radius; ox <= radius; ox++) {
      if (ox * ox + oy * oy > radius * radius) continue;
      const tx = px + ox;
      const ty = py + oy;
      castRay(map, px, py, tx, ty);
    }
  }
}

function castRay(map: TileMap, x0: number, y0: number, x1: number, y1: number): void {
  // Bresenham line; mark each tile seen, stop after first opaque tile (still mark it).
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    map.markSeen(x, y);
    if (map.isOpaque(x, y) && (x !== x0 || y !== y0)) return;
    if (x === x1 && y === y1) return;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx)  { err += dx; y += sy; }
  }
}
