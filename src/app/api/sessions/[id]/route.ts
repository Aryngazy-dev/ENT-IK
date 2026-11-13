import { NextResponse } from "next/server";
import { isErrorResponse, requireUser } from "@/server/auth/authorization";
import { getSafeSession } from "@/server/services/test-sessions";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) { const access = await requireUser(); if (isErrorResponse(access)) return access; const session = await getSafeSession(access.userId, (await params).id); return session ? NextResponse.json(session) : NextResponse.json({ error: "Сессия не найдена" }, { status: 404 }); }
