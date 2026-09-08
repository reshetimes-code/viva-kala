import { NextRequest, NextResponse } from "next/server";
import { createUser, createSessionToken, setSessionCookie } from "@/lib/auth";
import { updateHallSettings } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { username, password, accountType, youtubeUrl, tourUrl } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "נא למלא שם משתמש וסיסמה" }, { status: 400 });
    }
    if (String(password).length < 4) {
      return NextResponse.json({ error: "הסיסמה חייבת להכיל לפחות 4 תווים" }, { status: 400 });
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
    const message = err instanceof Error ? err.message : "שגיאה בהרשמה";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
