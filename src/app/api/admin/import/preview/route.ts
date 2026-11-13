import { NextResponse } from "next/server";
import { isErrorResponse, requireAdmin } from "@/server/auth/authorization";
import { previewCsv } from "@/server/services/csv-import";

export async function POST(request: Request) {
  const access = await requireAdmin(); if (isErrorResponse(access)) return access;
  const body = await request.json().catch(() => null) as { csv?: unknown } | null;
  if (!body || typeof body.csv !== "string" || body.csv.length > 5_000_000) return NextResponse.json({ error: "Передайте CSV-текст до 5 МБ" }, { status: 400 });
  return NextResponse.json(previewCsv(body.csv));
}
