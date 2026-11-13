import { NextResponse } from "next/server";
import { z } from "zod";
import { isErrorResponse, requireAdmin } from "@/server/auth/authorization";
import { validateQuestionCsv, validateQuestionRecords } from "@/server/services/question-import";
import { db } from "@/server/db/client";
import { parseXlsxFirstSheet } from "@/server/services/xlsx-import";

const bodySchema = z.object({ format: z.enum(["CSV", "JSON"]).default("CSV"), content: z.string().min(1).max(5_000_000), mapping: z.record(z.string(), z.string()).default({}) });
export async function POST(request: Request) {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  const multipart = request.headers.get("content-type")?.includes("multipart/form-data");
  if (multipart) {
    const form = await request.formData(); const file = form.get("file"); let rawMapping: unknown = {}; try { rawMapping = JSON.parse(String(form.get("mapping") ?? "{}")); } catch { return NextResponse.json({ error: "Некорректный маппинг столбцов" }, { status: 400 }); } const mapping = z.record(z.string(), z.string()).safeParse(rawMapping).data ?? {};
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx")) return NextResponse.json({ error: "Выберите XLSX-файл" }, { status: 400 });
    try { const records = parseXlsxFirstSheet(new Uint8Array(await file.arrayBuffer())); const preview = validateQuestionRecords(records, mapping); const job = await db.importJob.create({ data: { createdById: access.userId, sourceKey: "xlsx", status: preview.errors.length ? "MAPPED" : "VALIDATED", mapping: { format: "XLSX", records, mapping }, preview: { headers: preview.headers, rows: preview.rows.length, errors: preview.errors } } }); return NextResponse.json({ jobId: job.id, ...preview }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось прочитать XLSX" }, { status: 400 }); }
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  let preview;
  let records: unknown[] | null = null;
  if (parsed.data.format === "JSON") {
    try { records = JSON.parse(parsed.data.content) as unknown[]; } catch { return NextResponse.json({ error: "JSON не удалось разобрать" }, { status: 400 }); }
    if (!Array.isArray(records)) return NextResponse.json({ error: "JSON должен быть массивом объектов" }, { status: 400 });
    preview = validateQuestionRecords(records, parsed.data.mapping);
  } else preview = validateQuestionCsv(parsed.data.content, parsed.data.mapping);
  const job = await db.importJob.create({ data: { createdById: access.userId, sourceKey: `inline-${parsed.data.format.toLowerCase()}`, status: preview.errors.length ? "MAPPED" : "VALIDATED", mapping: { format: parsed.data.format, content: parsed.data.content, mapping: parsed.data.mapping }, preview: { headers: preview.headers, rows: preview.rows.length, errors: preview.errors } } });
  return NextResponse.json({ jobId: job.id, ...preview });
}
