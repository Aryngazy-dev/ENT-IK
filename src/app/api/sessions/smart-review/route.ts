import { NextResponse } from "next/server";
import { isErrorResponse, requireUser } from "@/server/auth/authorization";
import { createSmartReviewSession, getSafeSession } from "@/server/services/test-sessions";
export async function POST() { const access = await requireUser(); if (isErrorResponse(access)) return access; try { const session = await createSmartReviewSession(access.userId); return NextResponse.json(await getSafeSession(access.userId, session.id), { status: 201 }); } catch { return NextResponse.json({ error: "Сначала пройдите хотя бы одну тренировку" }, { status: 409 }); } }
