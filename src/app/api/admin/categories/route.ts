import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { isErrorResponse, requireAdmin } from "@/server/auth/authorization";
import { categoryInputSchema } from "@/shared/validation/catalog";

export async function GET() {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  return NextResponse.json(await db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { topics: true } } } }));
}
export async function POST(request: Request) {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  const parsed = categoryInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Некорректные данные", details: parsed.error.flatten() }, { status: 400 });
  try { return NextResponse.json(await db.category.create({ data: parsed.data }), { status: 201 }); }
  catch { return NextResponse.json({ error: "Категория с таким slug уже существует" }, { status: 409 }); }
}
