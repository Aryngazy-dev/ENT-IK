import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { isErrorResponse, requireAdmin } from "@/server/auth/authorization";
import { categoryInputSchema } from "@/shared/validation/catalog";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  const parsed = categoryInputSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  try { return NextResponse.json(await db.category.update({ where: { id: (await params).id }, data: parsed.data })); } catch { return NextResponse.json({ error: "Категория не найдена или slug занят" }, { status: 404 }); }
}
export async function DELETE(_: Request, { params }: Context) {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  try { await db.category.delete({ where: { id: (await params).id } }); return new NextResponse(null, { status: 204 }); } catch { return NextResponse.json({ error: "Категорию нельзя удалить, пока в ней есть темы" }, { status: 409 }); }
}
