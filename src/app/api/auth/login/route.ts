import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/server/db/client";
import { setSession } from "@/server/auth/session";
import { credentialsSchema } from "@/shared/validation/auth";

export async function POST(request: Request) {
  const parsed = credentialsSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await compare(parsed.data.password, user.passwordHash))) return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  await setSession({ userId: user.id, role: user.role });
  return NextResponse.json({ id: user.id, email: user.email, role: user.role });
}
