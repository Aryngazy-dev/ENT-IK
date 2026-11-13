import { NextResponse } from "next/server";
import { isErrorResponse, requireUser } from "@/server/auth/authorization";
import { createTrainingSessionSchema } from "@/shared/validation/session";
import { createTrainingSession, getSafeSession } from "@/server/services/test-sessions";

export async function POST(request: Request) {
  const access = await requireUser(); if (isErrorResponse(access)) return access;
  const parsed = createTrainingSessionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Некорректные параметры тренировки" }, { status: 400 });
  try { const session = await createTrainingSession(access.userId, parsed.data); return NextResponse.json(await getSafeSession(access.userId, session.id), { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "NOT_ENOUGH_QUESTIONS" ? "Недостаточно одобренных вопросов для этой тренировки" : "Не удалось создать сессию" }, { status: 409 }); }
}
