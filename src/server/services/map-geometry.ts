export type Point = { x: number; y: number };

/** Boundary-inclusive ray-casting in image-relative percentage coordinates. */
export function isPointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const a = polygon[current];
    const b = polygon[previous];
    const onEdge = (point.y - a.y) * (b.x - a.x) === (point.x - a.x) * (b.y - a.y)
      && point.x >= Math.min(a.x, b.x) && point.x <= Math.max(a.x, b.x)
      && point.y >= Math.min(a.y, b.y) && point.y <= Math.max(a.y, b.y);
    if (onEdge) return true;
    const crosses = (a.y > point.y) !== (b.y > point.y)
      && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function isWithinMarkerRadius(point: Point, marker: Point, radiusPercent: number): boolean {
  return Math.hypot(point.x - marker.x, point.y - marker.y) <= radiusPercent;
}
