import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/server/db/client";
import { setSession } from "@/server/auth/session";
import { credentialsSchema } from "@/shared/validation/auth";

export async function POST(request: Request) {
  const parsed = credentialsSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Некорректные данные", details: parsed.error.flatten() }, { status: 400 });
  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return NextResponse.json({ error: "Этот email уже зарегистрирован" }, { status: 409 });
  const user = await db.user.create({ data: { email: parsed.data.email, passwordHash: await hash(parsed.data.password, 12) } });
  await setSession({ userId: user.id, role: user.role });
  return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 });
}
