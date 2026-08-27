import { NextRequest, NextResponse } from "next/server";
import { verifyUser, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "נא למלא שם משתמש וסיסמה" }, { status: 400 });
    }

    const user = verifyUser(String(username).trim(), String(password));
    if (!user) {
      return NextResponse.json({ error: "שם משתמש או סיסמה שגויים" }, { status: 401 });
    }

    const token = createSessionToken(user.id);
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json({ error: "שגיאה בהתחברות" }, { status: 500 });
  }
}
