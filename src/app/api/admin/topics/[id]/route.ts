import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { isErrorResponse, requireAdmin } from "@/server/auth/authorization";
import { topicInputSchema } from "@/shared/validation/catalog";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  const parsed = topicInputSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  try { return NextResponse.json(await db.topic.update({ where: { id: (await params).id }, data: parsed.data })); } catch { return NextResponse.json({ error: "Тема не найдена, категория не существует или slug занят" }, { status: 404 }); }
}
export async function DELETE(_: Request, { params }: Context) {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  try { await db.topic.delete({ where: { id: (await params).id } }); return new NextResponse(null, { status: 204 }); } catch { return NextResponse.json({ error: "Тему нельзя удалить, пока есть связанные записи" }, { status: 409 }); }
}
