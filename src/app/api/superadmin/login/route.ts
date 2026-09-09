import { NextRequest, NextResponse } from "next/server";
import {
  isSuperadminConfigured,
  isRateLimited,
  recordFailedAttempt,
  clearAttempts,
  verifySuperadminPassword,
  setSuperadminCookie,
} from "@/lib/superadmin";

function clientIp(req: NextRequest): string {
  // Cloud Run sits behind Google's front end, which sets this - falls back
  // to a constant bucket locally (dev never needs real per-IP throttling).
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(req: NextRequest) {
  if (!isSuperadminConfigured()) {
    return NextResponse.json({ error: "כניסת סופר-אדמין לא מוגדרת" }, { status: 503 });
  }

  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "יותר מדי נסיונות - נסה שוב בעוד כמה דקות" }, { status: 429 });
  }

  const { password } = await req.json();
  if (!password || !verifySuperadminPassword(String(password))) {
    recordFailedAttempt(ip);
    return NextResponse.json({ error: "סיסמה שגויה" }, { status: 401 });
  }

  clearAttempts(ip);
  await setSuperadminCookie();
  return NextResponse.json({ success: true });
}
