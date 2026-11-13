import { NextResponse } from "next/server";
import { isErrorResponse, requireUser } from "@/server/auth/authorization";
import { db } from "@/server/db/client";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) { const access = await requireUser(); if (isErrorResponse(access)) return access; const bookmark = await db.bookmark.findUnique({ where: { userId_questionId: { userId: access.userId, questionId: (await params).id } } }); return NextResponse.json({ bookmarked: Boolean(bookmark) }); }
export async function POST(_: Request, { params }: Context) { const access = await requireUser(); if (isErrorResponse(access)) return access; const questionId = (await params).id; await db.bookmark.upsert({ where: { userId_questionId: { userId: access.userId, questionId } }, create: { userId: access.userId, questionId }, update: {} }); return NextResponse.json({ bookmarked: true }); }
export async function DELETE(_: Request, { params }: Context) { const access = await requireUser(); if (isErrorResponse(access)) return access; try { await db.bookmark.delete({ where: { userId_questionId: { userId: access.userId, questionId: (await params).id } } }); } catch { /* deletion remains idempotent */ } return new NextResponse(null, { status: 204 }); }
