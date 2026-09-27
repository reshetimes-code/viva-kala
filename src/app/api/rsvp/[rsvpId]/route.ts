import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findRsvpById, findInviteById, findTableById, assignRsvpTable, getOrCreateRsvpToken } from "@/lib/store";
import { getServerLocale } from "@/lib/i18n/server";

const MESSAGES = {
  he: {
    loginRequired: "יש להתחבר תחילה",
    rsvpNotFound: "אישור הגעה לא נמצא",
    forbidden: "אין הרשאה",
    tableNotFound: "שולחן לא נמצא",
  },
  en: {
    loginRequired: "Please log in first",
    rsvpNotFound: "RSVP not found",
    forbidden: "Not authorized",
    tableNotFound: "Table not found",
  },
};

// The dashboard's "personal link" button calls this to get (or lazily
// create, see getOrCreateRsvpToken) this guest's own
// /table-lookup/guest/[token] link - same auth/ownership check as PATCH
// below, since only the event's own host should be able to mint a guest's
// link.
export async function GET(
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

  const token = await getOrCreateRsvpToken(rsvp.id);
  return NextResponse.json({ token });
}

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
  if (tableId) {
    // Without this, a host could point their own guest's table_id at a
    // table row that actually belongs to a completely different invite
    // (the rsvp-ownership check above only verifies the rsvp itself, not
    // that this id is really one of THIS invite's own tables).
    const table = await findTableById(tableId);
    if (!table || table.inviteId !== invite.id) {
      return NextResponse.json({ error: t.tableNotFound }, { status: 404 });
    }
  }
  await assignRsvpTable(rsvp.id, tableId ?? null);
  return NextResponse.json({ success: true });
}
