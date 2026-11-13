import { describe, expect, it } from "vitest";
import { isPointInPolygon, isWithinMarkerRadius } from "@/server/services/map-geometry";

describe("map geometry", () => {
  const square = [{ x: 10, y: 10 }, { x: 30, y: 10 }, { x: 30, y: 30 }, { x: 10, y: 30 }];
  it("recognises polygon hits including a boundary", () => {
    expect(isPointInPolygon({ x: 20, y: 20 }, square)).toBe(true);
    expect(isPointInPolygon({ x: 10, y: 20 }, square)).toBe(true);
    expect(isPointInPolygon({ x: 31, y: 20 }, square)).toBe(false);
  });
  it("checks marker radius", () => {
    expect(isWithinMarkerRadius({ x: 12, y: 10 }, { x: 10, y: 10 }, 2)).toBe(true);
    expect(isWithinMarkerRadius({ x: 13, y: 10 }, { x: 10, y: 10 }, 2)).toBe(false);
  });
});
