import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { isErrorResponse, requireAdmin } from "@/server/auth/authorization";
import { mapMarkerSchema } from "@/shared/validation/maps";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) { const access = await requireAdmin(); if (isErrorResponse(access)) return access; const parsed = mapMarkerSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Некорректный маркер" }, { status: 400 }); try { const marker = await db.mapMarker.create({ data: { mapAssetId: (await params).id, ...parsed.data } }); return NextResponse.json(marker, { status: 201 }); } catch { return NextResponse.json({ error: "Карта не найдена" }, { status: 404 }); } }
