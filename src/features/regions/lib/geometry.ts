import type { Crop, Rect } from "../../../shared/document";
export const MIN_REGION = 0.01;
export function clamp(v: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, v));
}
export function normalizeRect(rect: Rect): Rect {
  const x = clamp(rect.x);
  const y = clamp(rect.y);
  const width = clamp(rect.width, MIN_REGION, 1 - x);
  const height = clamp(rect.height, MIN_REGION, 1 - y);
  return { x, y, width, height };
}
export function rectFromPoints(
  x: number,
  y: number,
  ex: number,
  ey: number,
): Rect {
  return normalizeRect({
    x: Math.min(x, ex),
    y: Math.min(y, ey),
    width: Math.abs(ex - x),
    height: Math.abs(ey - y),
  });
}
/** Half-open containment keeps a boundary cell's owner deterministic. */
export function containsPoint(rect: Rect, x: number, y: number) {
  return (
    x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height
  );
}
/** Centre of a grid cell expressed in original-image coordinates. */
export function cellCenter(
  crop: Crop,
  columns: number,
  rows: number,
  column: number,
  row: number,
) {
  return {
    x: crop.x + ((column + 0.5) / columns) * crop.width,
    y: crop.y + ((row + 0.5) / rows) * crop.height,
  };
}
