import { NextResponse } from "next/server";
import { isErrorResponse, requireUser } from "@/server/auth/authorization";
import { db } from "@/server/db/client";

export async function GET() {
  const access = await requireUser(); if (isErrorResponse(access)) return access;
  const session = await db.testSession.findFirst({ where: { userId: access.userId, status: "ACTIVE", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { questions: true, attempts: true } } } });
  return NextResponse.json(session ? { id: session.id, mode: session.mode, title: session.title, expiresAt: session.expiresAt, total: session._count.questions, answered: session._count.attempts } : null);
}
