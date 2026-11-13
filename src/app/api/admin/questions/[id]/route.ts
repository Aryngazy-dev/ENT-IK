import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { isErrorResponse, requireAdmin } from "@/server/auth/authorization";
import { questionInputSchema } from "@/shared/validation/question";
import { updateQuestion } from "@/server/services/questions";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  const parsed = questionInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Некорректный вопрос", details: parsed.error.flatten() }, { status: 400 });
  try { return NextResponse.json(await updateQuestion((await params).id, parsed.data)); }
  catch { return NextResponse.json({ error: "Вопрос или связанная запись не найдены" }, { status: 404 }); }
}
export async function DELETE(_: Request, { params }: Context) {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  try { await db.question.delete({ where: { id: (await params).id } }); return new NextResponse(null, { status: 204 }); }
  catch { return NextResponse.json({ error: "Вопрос не найден" }, { status: 404 }); }
}
