import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/server/db/client";
import { googleConfig, googleRedirectUri, publicAppUrl, verifyGoogleState } from "@/server/auth/google";
import { setSession } from "@/server/auth/session";

export async function GET(request: Request) {
  const url = new URL(request.url); const appUrl = publicAppUrl(url.origin); const state = verifyGoogleState(url.searchParams.get("state")); const stored = (await cookies()).get("google_oauth_state")?.value;
  if (!state || stored !== url.searchParams.get("state") || !url.searchParams.get("code")) return NextResponse.redirect(new URL("/login?error=google_state", appUrl));
  try {
    const { clientId, clientSecret } = googleConfig();
    const token = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code: url.searchParams.get("code")!, client_id: clientId, client_secret: clientSecret, redirect_uri: googleRedirectUri(url.origin), grant_type: "authorization_code", code_verifier: state.verifier }) });
    const tokenData = await token.json() as { access_token?: string }; if (!token.ok || !tokenData.access_token) throw new Error("token exchange failed");
    const profile = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${tokenData.access_token}` } }); const identity = await profile.json() as { sub?: string; email?: string; email_verified?: boolean };
    if (!profile.ok || !identity.sub || !identity.email || !identity.email_verified) throw new Error("invalid Google profile");
    let account = await db.oAuthAccount.findUnique({ where: { provider_providerAccountId: { provider: "google", providerAccountId: identity.sub } }, include: { user: true } });
    if (!account) { const email = identity.email.toLowerCase(); const user = await db.user.findUnique({ where: { email } }) ?? await db.user.create({ data: { email, passwordHash: randomBytes(48).toString("base64url") } }); account = await db.oAuthAccount.create({ data: { provider: "google", providerAccountId: identity.sub, email, userId: user.id }, include: { user: true } }); }
    await setSession({ userId: account.user.id, role: account.user.role }); (await cookies()).delete("google_oauth_state"); return NextResponse.redirect(new URL(account.user.role === "ADMIN" ? "/admin" : "/dashboard", appUrl));
  } catch { return NextResponse.redirect(new URL("/login?error=google", appUrl)); }
}
