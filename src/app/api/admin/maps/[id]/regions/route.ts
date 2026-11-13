import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { isErrorResponse, requireAdmin } from "@/server/auth/authorization";
import { mapRegionSchema } from "@/shared/validation/maps";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) { const access = await requireAdmin(); if (isErrorResponse(access)) return access; const parsed = mapRegionSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Контур должен состоять минимум из трёх точек" }, { status: 400 }); try { return NextResponse.json(await db.mapRegion.create({ data: { mapAssetId: (await params).id, ...parsed.data } }), { status: 201 }); } catch { return NextResponse.json({ error: "Карта не найдена" }, { status: 404 }); } }
