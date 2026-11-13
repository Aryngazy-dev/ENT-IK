import { NextResponse } from "next/server";
import { isErrorResponse, requireUser } from "@/server/auth/authorization";
import { getDashboardStatistics } from "@/server/services/statistics";
export async function GET() { const access = await requireUser(); if (isErrorResponse(access)) return access; return NextResponse.json(await getDashboardStatistics(access.userId)); }
