import { NextRequest, NextResponse } from "next/server";
import { createUser, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "נא למלא שם משתמש וסיסמה" }, { status: 400 });
    }
    if (String(password).length < 4) {
      return NextResponse.json({ error: "הסיסמה חייבת להכיל לפחות 4 תווים" }, { status: 400 });
    }

    const user = createUser(String(username).trim(), String(password));
    const token = createSessionToken(user.id);
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה בהרשמה";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
