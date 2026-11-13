import { NextResponse } from "next/server";
import { isErrorResponse, requireUser } from "@/server/auth/authorization";
import { completeSession } from "@/server/services/test-sessions";
type Context = { params: Promise<{ id: string }> };
export async function POST(_: Request, { params }: Context) { const access = await requireUser(); if (isErrorResponse(access)) return access; try { const session = await completeSession(access.userId, (await params).id); return NextResponse.json({ id: session.id, status: session.status }); } catch { return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 }); } }
