import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { authSecret, signAuthValue } from "@/server/auth/session";
type GoogleState = { verifier: string; expiresAt: number };
export function publicAppUrl(requestOrigin: string) {
  const configured = process.env.APP_URL?.replace(/\/$/, "");
  if (configured) { new URL(configured); return configured; }
  if (process.env.NODE_ENV === "production") throw new Error("APP_URL is required in production");
  return requestOrigin;
}
export function googleRedirectUri(origin: string) { return `${publicAppUrl(origin)}/api/auth/google/callback`; }
export function createGoogleState() { const payload: GoogleState = { verifier: randomBytes(48).toString("base64url"), expiresAt: Math.floor(Date.now() / 1000) + 600 }; const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url"); return { state: `${encoded}.${signAuthValue(encoded)}`, verifier: payload.verifier }; }
export function verifyGoogleState(value?: string): GoogleState | null { if (!value) return null; const [encoded, signature] = value.split("."); const expected = encoded ? signAuthValue(encoded) : ""; if (!encoded || !signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null; try { const data = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as GoogleState; return data.expiresAt > Math.floor(Date.now() / 1000) ? data : null; } catch { return null; } }
export function googleConfig() { const clientId = process.env.GOOGLE_CLIENT_ID; const clientSecret = process.env.GOOGLE_CLIENT_SECRET; if (!clientId || !clientSecret || authSecret().length < 32) throw new Error("Google OAuth is not configured"); return { clientId, clientSecret }; }
export function challenge(verifier: string) { return createHash("sha256").update(verifier).digest("base64url"); }
