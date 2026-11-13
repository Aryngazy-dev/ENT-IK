import { NextResponse } from "next/server";
import { currentIdentity, type SessionIdentity } from "@/server/auth/session";

export async function requireUser(): Promise<SessionIdentity | NextResponse> {
  const identity = await currentIdentity();
  return identity ?? NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
}
export async function requireAdmin(): Promise<SessionIdentity | NextResponse> {
  const identity = await currentIdentity();
  if (!identity) return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  if (identity.role !== "ADMIN") return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  return identity;
}
export function isErrorResponse(value: SessionIdentity | NextResponse): value is NextResponse { return value instanceof NextResponse; }
