import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { isErrorResponse, requireAdmin } from "@/server/auth/authorization";
import { storeImage } from "@/server/storage/local-storage";
import { mediaMetadataSchema } from "@/shared/validation/media";

export async function GET() {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  return NextResponse.json(await db.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { _count: { select: { promptQuestions: true, optionQuestions: true } } } }));
}
export async function POST(request: Request) {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  const form = await request.formData(); const candidate = form.get("file");
  if (!(candidate instanceof File)) return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  const parsed = mediaMetadataSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return NextResponse.json({ error: "Некорректные метаданные", details: parsed.error.flatten() }, { status: 400 });
  try {
    const stored = await storeImage(candidate);
    const media = await db.mediaAsset.create({ data: { ...parsed.data, storageKey: stored.storageKey, status: "DRAFT" } });
    return NextResponse.json({ ...media, publicUrl: stored.publicUrl }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось загрузить файл" }, { status: 400 }); }
}
