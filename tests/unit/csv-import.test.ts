import { describe, expect, it } from "vitest";
import { previewCsv } from "@/server/services/csv-import";

describe("CSV preview", () => {
  it("parses quoted commas and produces a mapping preview", () => {
    const preview = previewCsv('question,answer\n"Когда, по источнику?",1465');
    expect(preview.headers).toEqual(["question", "answer"]);
    expect(preview.rows[0]).toEqual({ question: "Когда, по источнику?", answer: "1465" });
    expect(preview.errors).toEqual([]);
  });
  it("reports malformed rows", () => {
    expect(previewCsv("one,two\nvalue").errors[0]).toContain("Строка 2");
  });
});
