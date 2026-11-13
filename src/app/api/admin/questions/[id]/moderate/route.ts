import { NextResponse } from "next/server";
import { z } from "zod";
import { isErrorResponse, requireAdmin } from "@/server/auth/authorization";
import { approveQuestion, rejectQuestion } from "@/server/services/question-moderation";
type Context = { params: Promise<{ id: string }> };
const schema = z.object({ action: z.enum(["approve", "reject"]) });
export async function POST(request: Request, { params }: Context) { const access = await requireAdmin(); if (isErrorResponse(access)) return access; const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Некорректное действие" }, { status: 400 }); try { const question = parsed.data.action === "approve" ? await approveQuestion((await params).id) : await rejectQuestion((await params).id); return NextResponse.json(question); } catch (error) { const reason = error instanceof Error ? error.message : "UNKNOWN"; return NextResponse.json({ error: reason.startsWith("LIKELY_DUPLICATE") ? "Похожий опубликованный вопрос уже существует; проверьте формулировку и факт" : "Черновик не найден" }, { status: 409 }); } }
