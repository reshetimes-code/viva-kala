import { NextResponse } from "next/server";
import { getCurrentUser, createSessionToken, setSessionCookie } from "@/lib/auth";
import { isAdminUser, findUserById } from "@/lib/store";

// Lets the super-admin jump straight into an event owner's own dashboard
// (for support/debugging) by swapping in a fresh session for that account -
// gated to the real admin account only, never available to anyone else.
export async function POST(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await getCurrentUser();
  if (!admin || !isAdminUser(admin)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { userId } = await params;
  const target = await findUserById(Number(userId));
  if (!target) {
    return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
  }

  const token = await createSessionToken(target.id);
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
