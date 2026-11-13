import { NextResponse } from "next/server";
import { z } from "zod";
import { isErrorResponse, requireUser } from "@/server/auth/authorization";
import { db } from "@/server/db/client";
const input = z.object({ scope: z.enum(["topic", "all"]), topicId: z.string().cuid().optional(), confirmation: z.literal("RESET_PROGRESS") }).superRefine((value, context) => { if (value.scope === "topic" && !value.topicId) context.addIssue({ code: "custom", path: ["topicId"], message: "Укажите тему" }); });
export async function POST(request: Request) { const access = await requireUser(); if (isErrorResponse(access)) return access; const parsed = input.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Подтвердите сброс вводом RESET_PROGRESS" }, { status: 400 }); const where = parsed.data.scope === "all" ? { userId: access.userId } : { userId: access.userId, topicId: parsed.data.topicId! }; const result = await db.userProgress.deleteMany({ where }); return NextResponse.json({ removed: result.count }); }
