import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { isErrorResponse, requireAdmin } from "@/server/auth/authorization";
import { personInputSchema } from "@/shared/validation/catalog";

export async function GET() {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  return NextResponse.json(await db.person.findMany({ orderBy: { nameRu: "asc" }, include: { category: { select: { titleRu: true } } } }));
}
export async function POST(request: Request) {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  const parsed = personInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Некорректные данные", details: parsed.error.flatten() }, { status: 400 });
  try { return NextResponse.json(await db.person.create({ data: parsed.data }), { status: 201 }); }
  catch { return NextResponse.json({ error: "Личность с таким slug уже существует" }, { status: 409 }); }
}
