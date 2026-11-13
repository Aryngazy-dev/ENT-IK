import { NextResponse } from "next/server";
import { isErrorResponse, requireUser } from "@/server/auth/authorization";
import { getSessionResults } from "@/server/services/test-sessions";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) { const access = await requireUser(); if (isErrorResponse(access)) return access; const result = await getSessionResults(access.userId, (await params).id); return result ? NextResponse.json(result) : NextResponse.json({ error: "Итоги пока недоступны" }, { status: 404 }); }
