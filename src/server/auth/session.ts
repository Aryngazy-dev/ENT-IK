import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "ent_session";
const maxAgeSeconds = 60 * 60 * 24 * 14;

export type SessionIdentity = { userId: string; role: "STUDENT" | "ADMIN"; expiresAt: number };

export function authSecret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters");
  return value;
}
export function signAuthValue(value: string): string { return createHmac("sha256", authSecret()).update(value).digest("base64url"); }

export function encodeSession(identity: Omit<SessionIdentity, "expiresAt">): string {
  const payload: SessionIdentity = { ...identity, expiresAt: Math.floor(Date.now() / 1000) + maxAgeSeconds };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signAuthValue(encoded)}`;
}
export function decodeSession(token?: string): SessionIdentity | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = signAuthValue(encoded);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionIdentity;
    return payload.expiresAt > Math.floor(Date.now() / 1000) ? payload : null;
  } catch { return null; }
}
export async function currentIdentity(): Promise<SessionIdentity | null> {
  return decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
}
export async function setSession(identity: Omit<SessionIdentity, "expiresAt">): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, encodeSession(identity), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: maxAgeSeconds, path: "/" });
}
export async function clearSession(): Promise<void> { (await cookies()).delete(SESSION_COOKIE); }
