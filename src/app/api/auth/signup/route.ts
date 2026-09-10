import { NextRequest, NextResponse } from "next/server";
import { createUser, createSessionToken, setSessionCookie } from "@/lib/auth";
import { updateHallSettings } from "@/lib/store";
import { getServerLocale } from "@/lib/i18n/server";
import { createRateLimiter, clientIp } from "@/lib/rateLimit";

const MESSAGES = {
  he: {
    missing: "נא למלא שם משתמש וסיסמה",
    shortPassword: "הסיסמה חייבת להכיל לפחות 4 תווים",
    usernameTaken: "שם המשתמש כבר תפוס",
    rateLimited: "יותר מדי נסיונות הרשמה - נסה שוב מאוחר יותר",
    generic: "שגיאה בהרשמה",
  },
  en: {
    missing: "Please fill in a username and password",
    shortPassword: "Password must be at least 4 characters",
    usernameTaken: "This username is already taken",
    rateLimited: "Too many sign-up attempts - please try again later",
    generic: "Sign-up error",
  },
};

// Unlike the login limiter, every attempt counts here (not just failures) -
// the thing being throttled is mass account creation itself, not password
// guessing. A generous cap so a shared office/home IP signing up a few
// legitimate accounts never trips it.
const limiter = createRateLimiter(10, 60 * 60 * 1000);

export async function POST(req: NextRequest) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  const ip = clientIp(req);
  if (limiter.isLimited(ip)) {
    return NextResponse.json({ error: t.rateLimited }, { status: 429 });
  }
  limiter.recordFailure(ip);
  try {
    const { username, password, accountType, youtubeUrl, tourUrl } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: t.missing }, { status: 400 });
    }
    if (String(password).length < 4) {
      return NextResponse.json({ error: t.shortPassword }, { status: 400 });
    }

    const isHall = accountType === "hall";
    const user = await createUser(String(username).trim(), String(password), {
      accountType: isHall ? "hall" : "individual",
    });
    // Optional, hall-only fields from the signup form (see the account-type
    // step there) - same settings a hall can set/change any time from its
    // own panel, just saved here too if they were already filled in.
    if (isHall && (youtubeUrl || tourUrl)) {
      await updateHallSettings(user.id, {
        youtubeUrl: typeof youtubeUrl === "string" ? youtubeUrl : "",
        tourUrl: typeof tourUrl === "string" ? tourUrl : "",
      });
    }
    const token = await createSessionToken(user.id);
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user });
  } catch (err) {
    const message =
      err instanceof Error && err.message === "USERNAME_TAKEN"
        ? t.usernameTaken
        : err instanceof Error
        ? err.message
        : t.generic;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
