import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
export async function GET() { return NextResponse.json(await db.topic.findMany({ orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }], select: { id: true, titleRu: true, titleKk: true, category: { select: { titleRu: true } }, _count: { select: { questions: { where: { status: "APPROVED" } } } } } })); }
