import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { currentIdentity } from "@/server/auth/session";
import { db } from "@/server/db/client";
const schema = z.object({ language: z.enum(["RU", "KK"]) });
export async function POST(request: Request) { const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Некорректный язык" }, { status: 400 }); const identity = await currentIdentity(); if (identity) await db.user.update({ where: { id: identity.userId }, data: { language: parsed.data.language } }); (await cookies()).set("ent_language", parsed.data.language.toLowerCase(), { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 }); return NextResponse.json({ language: parsed.data.language }); }
