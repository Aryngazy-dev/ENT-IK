import { z } from "zod";
import { previewCsv } from "@/server/services/csv-import";

const fields = ["textRu", "textKk", "correctAnswer", "wrongAnswers", "explanationRu", "difficulty", "type", "tags"] as const;
export type ImportField = (typeof fields)[number];
export type ColumnMapping = Partial<Record<ImportField, string>>;

const importRowSchema = z.object({
  textRu: z.string().trim().min(10).max(4000), textKk: z.string().trim().min(10).max(4000).optional(), correctAnswer: z.string().trim().min(1).max(1000),
  wrongAnswers: z.string().trim().min(1).max(4000).refine((value) => value.split("|").map((item) => item.trim()).filter(Boolean).length >= 3, "Нужно минимум три неверных варианта, разделённых символом |"), explanationRu: z.string().trim().min(10).max(10000),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"), type: z.literal("SINGLE_CHOICE").default("SINGLE_CHOICE"), tags: z.string().optional(),
});
export type ValidImportRow = z.infer<typeof importRowSchema>;
export type ImportPreview = { headers: string[]; rows: ValidImportRow[]; errors: { row: number; message: string }[] };

export function validateQuestionRecords(records: unknown[], mapping: ColumnMapping = {}): ImportPreview {
  const headers = [...new Set(records.flatMap((record) => record && typeof record === "object" && !Array.isArray(record) ? Object.keys(record as Record<string, unknown>) : []))];
  const errors: ImportPreview["errors"] = [];
  const rows: ValidImportRow[] = [];
  const mandatory: ImportField[] = ["textRu", "correctAnswer", "wrongAnswers", "explanationRu"];
  const effectiveMapping = Object.fromEntries(fields.map((field) => [field, mapping[field] || field])) as ColumnMapping;
  for (const field of mandatory) if (!effectiveMapping[field] || !headers.includes(effectiveMapping[field]!)) errors.push({ row: 0, message: `Не найден обязательный ключ: ${field}` });
  records.forEach((record, index) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) { errors.push({ row: index + 1, message: "Строка JSON должна быть объектом" }); return; }
    const source = record as Record<string, unknown>;
    const normalized = Object.fromEntries(fields.map((field) => [field, effectiveMapping[field] ? source[effectiveMapping[field]!] : undefined]));
    const parsed = importRowSchema.safeParse(normalized);
    if (parsed.success) rows.push(parsed.data); else errors.push({ row: index + 1, message: parsed.error.issues.map((issue) => issue.message).join("; ") });
  });
  return { headers, rows, errors };
}

export function validateQuestionCsv(csv: string, mapping: ColumnMapping): ImportPreview {
  const preview = previewCsv(csv); const errors = preview.errors.map((message) => ({ row: 0, message }));
  const mandatory: ImportField[] = ["textRu", "correctAnswer", "wrongAnswers", "explanationRu"];
  for (const field of mandatory) if (!mapping[field] || !preview.headers.includes(mapping[field]!)) errors.push({ row: 0, message: `Не сопоставлен обязательный столбец: ${field}` });
  const rows: ValidImportRow[] = [];
  preview.rows.forEach((row, index) => {
    const normalized = Object.fromEntries(fields.map((field) => [field, mapping[field] ? row[mapping[field]!] : undefined]));
    const parsed = importRowSchema.safeParse(normalized);
    if (parsed.success) rows.push(parsed.data); else errors.push({ row: index + 2, message: parsed.error.issues.map((issue) => issue.message).join("; ") });
  });
  return { headers: preview.headers, rows, errors };
}
