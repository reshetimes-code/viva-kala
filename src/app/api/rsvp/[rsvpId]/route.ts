import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findRsvpById, findInviteById, assignRsvpTable } from "@/lib/store";
import { getServerLocale } from "@/lib/i18n/server";

const MESSAGES = {
  he: {
    loginRequired: "יש להתחבר תחילה",
    rsvpNotFound: "אישור הגעה לא נמצא",
    forbidden: "אין הרשאה",
  },
  en: {
    loginRequired: "Please log in first",
    rsvpNotFound: "RSVP not found",
    forbidden: "Not authorized",
  },
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ rsvpId: string }> }
) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: t.loginRequired }, { status: 401 });
  }

  const { rsvpId } = await params;
  const rsvp = await findRsvpById(Number(rsvpId));
  if (!rsvp) {
    return NextResponse.json({ error: t.rsvpNotFound }, { status: 404 });
  }

  const invite = await findInviteById(rsvp.inviteId);
  if (!invite || invite.userId !== user.id) {
    return NextResponse.json({ error: t.forbidden }, { status: 403 });
  }

  const { tableId } = await req.json();
  await assignRsvpTable(rsvp.id, tableId ?? null);
  return NextResponse.json({ success: true });
}
