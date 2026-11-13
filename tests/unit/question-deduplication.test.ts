import { describe, expect, it } from "vitest";
import { isLikelyDuplicate, tokenSimilarity } from "@/server/services/question-deduplication";

describe("question deduplication", () => {
  it("detects wording with the same core terms", () => {
    expect(
      isLikelyDuplicate(
        "В каком году образовалось Казахское ханство",
        "Когда образовалось Казахское ханство"
      )
    ).toBe(true);
  });

  it("does not conflate unrelated facts", () => {
    expect(
      tokenSimilarity("Казахское ханство", "Независимость Республики Казахстан")
    ).toBeLessThan(0.5);
  });
});
