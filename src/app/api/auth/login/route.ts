import { NextRequest, NextResponse } from "next/server";
import { verifyUser, createSessionToken, setSessionCookie } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n/server";

const MESSAGES = {
  he: {
    missing: "נא למלא שם משתמש וסיסמה",
    invalidCredentials: "שם משתמש או סיסמה שגויים",
    generic: "שגיאה בהתחברות",
  },
  en: {
    missing: "Please fill in a username and password",
    invalidCredentials: "Incorrect username or password",
    generic: "Sign-in error",
  },
};

export async function POST(req: NextRequest) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: t.missing }, { status: 400 });
    }

    const user = await verifyUser(String(username).trim(), String(password));
    if (!user) {
      return NextResponse.json({ error: t.invalidCredentials }, { status: 401 });
    }

    const token = await createSessionToken(user.id);
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json({ error: t.generic }, { status: 500 });
  }
}
