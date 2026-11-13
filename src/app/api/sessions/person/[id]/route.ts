import { NextResponse } from "next/server";
import { isErrorResponse, requireUser } from "@/server/auth/authorization";
import { createPersonSession, getSafeSession } from "@/server/services/test-sessions";
type Context = { params: Promise<{ id: string }> };
export async function POST(_: Request, { params }: Context) { const access = await requireUser(); if (isErrorResponse(access)) return access; try { const session = await createPersonSession(access.userId, (await params).id); return NextResponse.json(await getSafeSession(access.userId, session.id), { status: 201 }); } catch { return NextResponse.json({ error: "Для этой личности пока нет одобренных вопросов" }, { status: 409 }); } }
