import { NextResponse } from "next/server";
import { isErrorResponse, requireAdmin } from "@/server/auth/authorization";
import { generationRequestSchema } from "@/shared/validation/generation";
import { enqueueGeneration } from "@/server/services/generation-queue";
export async function POST(request: Request) { const access = await requireAdmin(); if (isErrorResponse(access)) return access; const parsed = generationRequestSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Некорректные параметры генерации" }, { status: 400 }); try { const job = await enqueueGeneration(parsed.data.sourceMaterialId, access.userId, parsed.data.maximumQuestions); return NextResponse.json({ id: job.id, status: job.status }, { status: 202 }); } catch { return NextResponse.json({ error: "Не удалось поставить генерацию в очередь" }, { status: 409 }); } }
