import { NextResponse } from "next/server";
import { isErrorResponse, requireUser } from "@/server/auth/authorization";
import { answerSubmissionSchema } from "@/shared/validation/progress";
import { persistAnswer } from "@/server/services/progress";

export async function POST(request: Request) {
  const access = await requireUser(); if (isErrorResponse(access)) return access;
  const parsed = answerSubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Некорректный ответ", details: parsed.error.flatten() }, { status: 400 });
  try { const result = await persistAnswer(access.userId, parsed.data); return NextResponse.json({ duplicate: result.duplicate, ...(result.revealCorrectness ? { isCorrect: result.isCorrect } : { saved: true }) }); }
  catch (error) { const reason = error instanceof Error ? error.message : "UNKNOWN"; return NextResponse.json({ error: reason === "SESSION_UNAVAILABLE" ? "Сессия недоступна или время истекло" : reason === "QUESTION_NOT_ASSIGNED" ? "Вопрос не принадлежит этой сессии" : "Вопрос не найден" }, { status: 409 }); }
}
