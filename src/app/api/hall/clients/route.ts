import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, createUser } from "@/lib/auth";
import { listClientsForHall } from "@/lib/store";
import { getServerLocale } from "@/lib/i18n/server";

const MESSAGES = {
  he: {
    hallLoginRequired: "יש להתחבר כאולם אירועים",
    missing: "נא למלא שם משתמש וסיסמה",
    shortPassword: "הסיסמה חייבת להכיל לפחות 4 תווים",
    generic: "שגיאה ביצירת חשבון לקוח",
  },
  en: {
    hallLoginRequired: "Please log in as a venue",
    missing: "Please fill in a username and password",
    shortPassword: "Password must be at least 4 characters",
    generic: "Error creating client account",
  },
};

export async function GET() {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  const user = await getCurrentUser();
  if (!user || user.accountType !== "hall") {
    return NextResponse.json({ error: t.hallLoginRequired }, { status: 401 });
  }
  const clients = await listClientsForHall(user.id);
  return NextResponse.json({ clients });
}

/** "האולם יפתח ללקוח חשבון דרך הפאנל הפנימי שלו" - the hall creates the
 *  client's login itself (username+password handed to the client
 *  separately, outside this app) rather than the client self-signing-up.
 *  The new account behaves exactly like any other "individual" account
 *  (same dashboard, same create-invite flow) - hallId is the only
 *  difference, and it's what makes this client show up in the hall's own
 *  panel and what gates the lead popups on their eventual invite. */
export async function POST(req: NextRequest) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  const user = await getCurrentUser();
  if (!user || user.accountType !== "hall") {
    return NextResponse.json({ error: t.hallLoginRequired }, { status: 401 });
  }
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: t.missing }, { status: 400 });
    }
    if (String(password).length < 4) {
      return NextResponse.json({ error: t.shortPassword }, { status: 400 });
    }
    const client = await createUser(String(username).trim(), String(password), {
      accountType: "individual",
      hallId: user.id,
    });
    return NextResponse.json({ success: true, client });
  } catch (err) {
    const message = err instanceof Error ? err.message : t.generic;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
