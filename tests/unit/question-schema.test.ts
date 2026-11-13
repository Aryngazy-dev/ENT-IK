import { describe, expect, it } from "vitest";
import { questionInputSchema } from "@/shared/validation/question";

const base = { topicId: "clx1234567890123456789012", type: "SINGLE_CHOICE", difficulty: "EASY", textRu: "В каком году образовалось Казахское ханство?", explanationRu: "В школьной хронологии принято указывать 1465–1466 годы.", payload: { kind: "SINGLE_CHOICE", options: [{ id: "a", contentRu: "1465 год", isCorrect: true }, { id: "b", contentRu: "1219 год", isCorrect: false }, { id: "c", contentRu: "1731 год", isCorrect: false }, { id: "d", contentRu: "1991 год", isCorrect: false }] } };

describe("question validation", () => {
  it("accepts a structurally correct question", () => expect(questionInputSchema.safeParse(base).success).toBe(true));
  it("rejects two correct answers for a single-choice question", () => { const invalid = structuredClone(base); invalid.payload.options[1].isCorrect = true; expect(questionInputSchema.safeParse(invalid).success).toBe(false); });
});
