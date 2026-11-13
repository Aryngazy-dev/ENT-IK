import { describe, expect, it } from "vitest";
import { validateQuestionCsv, validateQuestionRecords } from "@/server/services/question-import";

const mapping = { textRu: "text", correctAnswer: "correct", wrongAnswers: "wrong", explanationRu: "explanation" };
describe("question import validation", () => {
  it("creates a validated preview", () => {
    const result = validateQuestionCsv("text,correct,wrong,explanation\nКогда образовалось Казахское ханство?,1465,1219|1731|1991,Период образования — 1465–1466 годы.", mapping);
    expect(result.errors).toEqual([]); expect(result.rows).toHaveLength(1);
  });
  it("does not accept a preview without mandatory mappings", () => expect(validateQuestionCsv("text\nВопрос достаточной длины", {}).errors).not.toEqual([]));

  it("validates JSON records using canonical field names", () => {
    const result = validateQuestionRecords([{ textRu: "Когда образовалось Казахское ханство?", correctAnswer: "1465", wrongAnswers: "1219|1731|1991", explanationRu: "Период образования — 1465–1466 годы." }]);
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(1);
  });
});
