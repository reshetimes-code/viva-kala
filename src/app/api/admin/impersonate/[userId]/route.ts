import { NextResponse } from "next/server";
import { getCurrentUser, createSessionToken, setSessionCookie } from "@/lib/auth";
import { findUserById } from "@/lib/store";
import { hasAdminAccess } from "@/lib/superadmin";
import { getServerLocale } from "@/lib/i18n/server";

const MESSAGES = {
  he: {
    forbidden: "אין הרשאה",
    userNotFound: "משתמש לא נמצא",
  },
  en: {
    forbidden: "Not authorized",
    userNotFound: "User not found",
  },
};

// Lets the super-admin jump straight into an event owner's own dashboard
// (for support/debugging) by swapping in a fresh session for that account -
// gated to the real admin account or a valid superadmin-cookie login, never
// available to anyone else.
export async function POST(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  const admin = await getCurrentUser();
  if (!(await hasAdminAccess(admin))) {
    return NextResponse.json({ error: t.forbidden }, { status: 403 });
  }

  const { userId } = await params;
  const target = await findUserById(Number(userId));
  if (!target) {
    return NextResponse.json({ error: t.userNotFound }, { status: 404 });
  }

  const token = await createSessionToken(target.id);
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
