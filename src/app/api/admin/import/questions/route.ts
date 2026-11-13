import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db/client";
import { isErrorResponse, requireAdmin } from "@/server/auth/authorization";
import { validateQuestionCsv, validateQuestionRecords, type ColumnMapping } from "@/server/services/question-import";

const confirmSchema = z.object({ jobId: z.string().cuid(), topicId: z.string().cuid() });
const storedMappingSchema = z.object({ format: z.enum(["CSV", "JSON", "XLSX"]).default("CSV"), content: z.string().optional(), csv: z.string().optional(), records: z.array(z.record(z.string(), z.unknown())).optional(), mapping: z.record(z.string(), z.string()) });
export async function POST(request: Request) {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  const parsed = confirmSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  const job = await db.importJob.findFirst({ where: { id: parsed.data.jobId, createdById: access.userId } });
  if (!job) return NextResponse.json({ error: "Импорт не найден" }, { status: 404 });
  if (job.status === "COMPLETED") return NextResponse.json({ error: "Импорт уже выполнен" }, { status: 409 });
  const stored = storedMappingSchema.safeParse(job.mapping); if (!stored.success) return NextResponse.json({ error: "Данные предпросмотра повреждены" }, { status: 409 });
  const content = stored.data.content ?? stored.data.csv;
  let preview;
  if (stored.data.format === "XLSX") { if (!stored.data.records) return NextResponse.json({ error: "Данные XLSX-импорта повреждены" }, { status: 409 }); preview = validateQuestionRecords(stored.data.records, stored.data.mapping as ColumnMapping); }
  else if (stored.data.format === "JSON") { if (!content) return NextResponse.json({ error: "Данные JSON-импорта повреждены" }, { status: 409 }); try { const records = JSON.parse(content) as unknown; if (!Array.isArray(records)) throw new Error(); preview = validateQuestionRecords(records, stored.data.mapping as ColumnMapping); } catch { return NextResponse.json({ error: "Данные JSON-импорта повреждены" }, { status: 409 }); } }
  else { if (!content) return NextResponse.json({ error: "Данные CSV-импорта повреждены" }, { status: 409 }); preview = validateQuestionCsv(content, stored.data.mapping as ColumnMapping); }
  if (preview.errors.length) return NextResponse.json({ error: "Исправьте ошибки предпросмотра", errors: preview.errors }, { status: 422 });
  try {
    const result = await db.$transaction(async (transaction: Omit<typeof db, "$transaction">) => {
      const topic = await transaction.topic.findUnique({ where: { id: parsed.data.topicId } }); if (!topic) throw new Error("TOPIC_NOT_FOUND");
      await transaction.importJob.update({ where: { id: job.id }, data: { status: "IMPORTING" } });
      const created = await Promise.all(preview.rows.map((row, index) => {
        const wrong = row.wrongAnswers.split("|").map((item) => item.trim()).filter(Boolean).slice(0, 4);
        const options = [row.correctAnswer, ...wrong];
        return transaction.question.create({ data: { topicId: topic.id, type: "SINGLE_CHOICE", difficulty: row.difficulty, status: "DRAFT", origin: "IMPORTED", textRu: row.textRu, textKk: row.textKk, explanationRu: row.explanationRu, payload: { kind: "SINGLE_CHOICE", options: options.map((contentRu, optionIndex) => ({ id: `${index}-${optionIndex}`, contentRu, isCorrect: optionIndex === 0 })) }, tags: ["import", job.id, ...(row.tags?.split("|").map((tag) => tag.trim()).filter(Boolean) ?? [])], options: { create: options.map((contentRu, optionIndex) => ({ contentRu, isCorrect: optionIndex === 0, sortOrder: optionIndex })) } } });
      }));
      await transaction.importJob.update({ where: { id: job.id }, data: { status: "COMPLETED" } }); return created.length;
    });
    return NextResponse.json({ created: result, status: "COMPLETED" }, { status: 201 });
  } catch (error) { await db.importJob.update({ where: { id: job.id }, data: { status: "FAILED", error: error instanceof Error ? error.message : "Неизвестная ошибка" } }); return NextResponse.json({ error: "Не удалось выполнить импорт" }, { status: 409 }); }
}
