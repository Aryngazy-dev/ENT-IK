import { NextResponse } from "next/server";
import { isErrorResponse, requireUser } from "@/server/auth/authorization";
import { createMistakesSession, getSafeSession } from "@/server/services/test-sessions";
export async function POST() { const access = await requireUser(); if (isErrorResponse(access)) return access; try { const session = await createMistakesSession(access.userId); return NextResponse.json(await getSafeSession(access.userId, session.id), { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "NO_MISTAKES" ? "Ошибок для повторения пока нет" : "Не удалось создать сессию" }, { status: 409 }); } }
