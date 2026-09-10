import { NextResponse } from "next/server";
import { getCurrentUser, createSessionToken, setSessionCookie } from "@/lib/auth";
import { findUserById } from "@/lib/store";
import { getServerLocale } from "@/lib/i18n/server";

const MESSAGES = {
  he: {
    hallLoginRequired: "יש להתחבר כאולם אירועים",
    notFound: "לקוח לא נמצא",
  },
  en: {
    hallLoginRequired: "Please log in as a venue",
    notFound: "Client not found",
  },
};

// Lets a hall jump straight into one of ITS OWN clients' dashboards - same
// mechanic as the superadmin's /api/admin/impersonate (swap in a fresh
// session for that account), but scoped hard to hallId: a hall can only
// ever land in an account it itself opened (see HallAddClientForm), never
// an arbitrary user or another hall's client.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  const user = await getCurrentUser();
  if (!user || user.accountType !== "hall") {
    return NextResponse.json({ error: t.hallLoginRequired }, { status: 401 });
  }

  const { userId } = await params;
  const target = await findUserById(Number(userId));
  if (!target || target.hallId !== user.id) {
    return NextResponse.json({ error: t.notFound }, { status: 404 });
  }

  const token = await createSessionToken(target.id);
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
