import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db/client";
import { isErrorResponse, requireAdmin } from "@/server/auth/authorization";
const input = z.object({ topicId: z.string().cuid(), title: z.string().trim().min(3).max(300), rawText: z.string().trim().min(100).max(200_000), sourceUrl: z.string().url().optional(), mimeType: z.string().max(100).optional() });
export async function GET() { const access = await requireAdmin(); if (isErrorResponse(access)) return access; return NextResponse.json(await db.sourceMaterial.findMany({ orderBy: { createdAt: "desc" }, include: { topic: { select: { titleRu: true } } } })); }
export async function POST(request: Request) {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  let body: unknown;
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File) || file.size === 0 || file.size > 2_000_000 || !file.name.toLowerCase().endsWith(".txt")) return NextResponse.json({ error: "Можно загрузить только TXT-файл размером до 2 МБ" }, { status: 400 });
    body = { topicId: form.get("topicId"), title: form.get("title") || file.name.replace(/\.txt$/i, ""), rawText: await file.text(), sourceUrl: form.get("sourceUrl") || undefined, mimeType: "text/plain" };
  } else body = await request.json().catch(() => null);
  const parsed = input.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Материал должен содержать не менее 100 символов" }, { status: 400 });
  return NextResponse.json(await db.sourceMaterial.create({ data: parsed.data }), { status: 201 });
}
