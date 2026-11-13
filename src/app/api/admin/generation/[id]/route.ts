import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { isErrorResponse, requireAdmin } from "@/server/auth/authorization";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) { const access = await requireAdmin(); if (isErrorResponse(access)) return access; const job = await db.generationJob.findFirst({ where: { id: (await params).id, requestedById: access.userId } }); return job ? NextResponse.json(job) : NextResponse.json({ error: "Задача не найдена" }, { status: 404 }); }
