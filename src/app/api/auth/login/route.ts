import { NextRequest, NextResponse } from "next/server";
import { verifyUser, createSessionToken, setSessionCookie } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n/server";
import { createRateLimiter, clientIp } from "@/lib/rateLimit";

const MESSAGES = {
  he: {
    missing: "נא למלא שם משתמש וסיסמה",
    invalidCredentials: "שם משתמש או סיסמה שגויים",
    rateLimited: "יותר מדי נסיונות - נסה שוב בעוד כמה דקות",
    generic: "שגיאה בהתחברות",
  },
  en: {
    missing: "Please fill in a username and password",
    invalidCredentials: "Incorrect username or password",
    rateLimited: "Too many attempts - please try again in a few minutes",
    generic: "Sign-in error",
  },
};

// Every account here (private clients and halls alike) previously had zero
// throttling on password guesses - unlike the superadmin login, which
// already had this. Same limits, independent counter.
const limiter = createRateLimiter(8, 15 * 60 * 1000);

export async function POST(req: NextRequest) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  try {
    const ip = clientIp(req);
    if (limiter.isLimited(ip)) {
      return NextResponse.json({ error: t.rateLimited }, { status: 429 });
    }

    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: t.missing }, { status: 400 });
    }

    const user = await verifyUser(String(username).trim(), String(password));
    if (!user) {
      limiter.recordFailure(ip);
      return NextResponse.json({ error: t.invalidCredentials }, { status: 401 });
    }
    limiter.clear(ip);

    const token = await createSessionToken(user.id);
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json({ error: t.generic }, { status: 500 });
  }
}
