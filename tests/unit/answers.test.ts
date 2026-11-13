import { describe, expect, it } from "vitest";
import { scoreAnswer, shuffledOptions } from "@/shared/scoring/answers";

const payload = { kind: "SINGLE_CHOICE" as const, options: [
  { id: "a", contentRu: "A", isCorrect: false }, { id: "b", contentRu: "B", isCorrect: true },
  { id: "c", contentRu: "C", isCorrect: false }, { id: "d", contentRu: "D", isCorrect: false },
] };

describe("answer scoring", () => {
  it("accepts only the exact set of answers", () => {
    expect(scoreAnswer(payload, { optionIds: ["b"] })).toBe(true);
    expect(scoreAnswer(payload, { optionIds: ["a"] })).toBe(false);
    expect(scoreAnswer(payload, { optionIds: ["a", "b"] })).toBe(false);
  });
  it("shuffles without losing options", () => {
    expect(shuffledOptions([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
  });
  it("scores chronology only in the exact order", () => {
    const chronology = { kind: "CHRONOLOGY" as const, items: [{ id: "a", contentRu: "Первое", correctOrder: 1 }, { id: "b", contentRu: "Второе", correctOrder: 2 }, { id: "c", contentRu: "Третье", correctOrder: 3 }] };
    expect(scoreAnswer(chronology, { orderedIds: ["a", "b", "c"] })).toBe(true);
    expect(scoreAnswer(chronology, { orderedIds: ["b", "a", "c"] })).toBe(false);
  });
  it("scores matching and true/false sets on the server", () => {
    const matching = { kind: "MATCHING" as const, pairs: [{ leftId: "a", leftRu: "Керей", rightId: "x", rightRu: "хан" }, { leftId: "b", leftRu: "Жанибек", rightId: "y", rightRu: "султан" }, { leftId: "c", leftRu: "Абылай", rightId: "z", rightRu: "правитель" }] };
    expect(scoreAnswer(matching, { matches: [{ leftId: "a", rightId: "x" }, { leftId: "b", rightId: "y" }, { leftId: "c", rightId: "z" }] })).toBe(true);
    const truth = { kind: "TRUE_FALSE" as const, statements: [{ id: "a", contentRu: "Утверждение A", isTrue: true }, { id: "b", contentRu: "Утверждение B", isTrue: false }] };
    expect(scoreAnswer(truth, { truths: [{ id: "a", value: true }, { id: "b", value: false }] })).toBe(true);
  });
});
