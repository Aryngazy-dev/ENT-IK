import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { isErrorResponse, requireAdmin } from "@/server/auth/authorization";
import { questionInputSchema } from "@/shared/validation/question";
import { createQuestion } from "@/server/services/questions";
export async function GET() { const access = await requireAdmin(); if (isErrorResponse(access)) return access; return NextResponse.json(await db.question.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { topic: { select: { titleRu: true } }, options: { orderBy: { sortOrder: "asc" } } } })); }
export async function POST(request: Request) { const access = await requireAdmin(); if (isErrorResponse(access)) return access; const parsed = questionInputSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Некорректный вопрос", details: parsed.error.flatten() }, { status: 400 }); try { return NextResponse.json(await createQuestion(parsed.data), { status: 201 }); } catch { return NextResponse.json({ error: "Не найдена связанная тема или ресурс" }, { status: 409 }); } }
