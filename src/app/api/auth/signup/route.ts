import { NextRequest, NextResponse } from "next/server";
import { createUser, createSessionToken, setSessionCookie } from "@/lib/auth";
import { updateHallSettings } from "@/lib/store";
import { getServerLocale } from "@/lib/i18n/server";

const MESSAGES = {
  he: {
    missing: "נא למלא שם משתמש וסיסמה",
    shortPassword: "הסיסמה חייבת להכיל לפחות 4 תווים",
    usernameTaken: "שם המשתמש כבר תפוס",
    generic: "שגיאה בהרשמה",
  },
  en: {
    missing: "Please fill in a username and password",
    shortPassword: "Password must be at least 4 characters",
    usernameTaken: "This username is already taken",
    generic: "Sign-up error",
  },
};

export async function POST(req: NextRequest) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
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
