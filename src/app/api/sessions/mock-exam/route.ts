import { NextResponse } from "next/server";
import { isErrorResponse, requireUser } from "@/server/auth/authorization";
import { createMockExamSession, getSafeSession } from "@/server/services/test-sessions";
export async function POST() { const access = await requireUser(); if (isErrorResponse(access)) return access; try { const session = await createMockExamSession(access.userId); return NextResponse.json(await getSafeSession(access.userId, session.id), { status: 201 }); } catch { return NextResponse.json({ error: "Недостаточно одобренных вопросов для пробного ЕНТ" }, { status: 409 }); } }
