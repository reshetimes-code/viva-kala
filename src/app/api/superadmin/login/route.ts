import { NextRequest, NextResponse } from "next/server";
import {
  isSuperadminConfigured,
  isRateLimited,
  recordFailedAttempt,
  clearAttempts,
  verifySuperadminPassword,
  setSuperadminCookie,
} from "@/lib/superadmin";
import { getServerLocale } from "@/lib/i18n/server";

const MESSAGES = {
  he: {
    notConfigured: "כניסת סופר-אדמין לא מוגדרת",
    rateLimited: "יותר מדי נסיונות - נסה שוב בעוד כמה דקות",
    wrongPassword: "סיסמה שגויה",
  },
  en: {
    notConfigured: "Super-admin login is not configured",
    rateLimited: "Too many attempts - please try again in a few minutes",
    wrongPassword: "Incorrect password",
  },
};

function clientIp(req: NextRequest): string {
  // Cloud Run sits behind Google's front end, which sets this - falls back
  // to a constant bucket locally (dev never needs real per-IP throttling).
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(req: NextRequest) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  if (!isSuperadminConfigured()) {
    return NextResponse.json({ error: t.notConfigured }, { status: 503 });
  }

  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: t.rateLimited }, { status: 429 });
  }

  const { password } = await req.json();
  if (!password || !verifySuperadminPassword(String(password))) {
    recordFailedAttempt(ip);
    return NextResponse.json({ error: t.wrongPassword }, { status: 401 });
  }

  clearAttempts(ip);
  await setSuperadminCookie();
  return NextResponse.json({ success: true });
}
