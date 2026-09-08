import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, createUser } from "@/lib/auth";
import { listClientsForHall } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.accountType !== "hall") {
    return NextResponse.json({ error: "יש להתחבר כאולם אירועים" }, { status: 401 });
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
  const user = await getCurrentUser();
  if (!user || user.accountType !== "hall") {
    return NextResponse.json({ error: "יש להתחבר כאולם אירועים" }, { status: 401 });
  }
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "נא למלא שם משתמש וסיסמה" }, { status: 400 });
    }
    if (String(password).length < 4) {
      return NextResponse.json({ error: "הסיסמה חייבת להכיל לפחות 4 תווים" }, { status: 400 });
    }
    const client = await createUser(String(username).trim(), String(password), {
      accountType: "individual",
      hallId: user.id,
    });
    return NextResponse.json({ success: true, client });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה ביצירת חשבון לקוח";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
