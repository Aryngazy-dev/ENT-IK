import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const limits = [{ path: "/api/auth/", max: 10 }, { path: "/api/admin/generation", max: 5 }, { path: "/api/admin/media", max: 20 }];

function clientKey(request: NextRequest) { return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous"; }
function allowedOrigin(request: NextRequest) { const origin = request.headers.get("origin"); if (!origin) return true; return origin === request.nextUrl.origin; }
export function proxy(request: NextRequest) {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && !allowedOrigin(request)) return NextResponse.json({ error: "Cross-site request rejected" }, { status: 403 });
  const rule = limits.find((item) => request.nextUrl.pathname.startsWith(item.path)); if (!rule) return NextResponse.next();
  const now = Date.now(); const key = `${rule.path}:${clientKey(request)}`; const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + 60_000 }); return NextResponse.next(); }
  if (bucket.count >= rule.max) return NextResponse.json({ error: "Слишком много запросов. Повторите через минуту." }, { status: 429, headers: { "retry-after": String(Math.ceil((bucket.resetAt - now) / 1000)) } });
  bucket.count += 1; return NextResponse.next();
}
export const config = { matcher: ["/api/:path*"] };
