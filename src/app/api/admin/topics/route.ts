import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { isErrorResponse, requireAdmin } from "@/server/auth/authorization";
import { topicInputSchema } from "@/shared/validation/catalog";

export async function GET() {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  return NextResponse.json(await db.topic.findMany({ orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }], include: { category: { select: { titleRu: true, titleKk: true } } } }));
}
export async function POST(request: Request) {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  const parsed = topicInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Некорректные данные", details: parsed.error.flatten() }, { status: 400 });
  try { return NextResponse.json(await db.topic.create({ data: parsed.data }), { status: 201 }); }
  catch { return NextResponse.json({ error: "Не найдена категория или slug уже занят" }, { status: 409 }); }
}
