import { describe, expect, it } from "vitest";
import { hasExpectedImageSignature } from "@/server/storage/local-storage";

describe("media signature policy", () => {
  it("accepts a PNG signature and rejects arbitrary bytes", () => {
    expect(hasExpectedImageSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), "image/png")).toBe(true);
    expect(hasExpectedImageSignature(new Uint8Array([1, 2, 3, 4]), "image/png")).toBe(false);
  });
});
