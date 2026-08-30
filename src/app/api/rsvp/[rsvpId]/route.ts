import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findRsvpById, findInviteById, assignRsvpTable } from "@/lib/store";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ rsvpId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר תחילה" }, { status: 401 });
  }

  const { rsvpId } = await params;
  const rsvp = await findRsvpById(Number(rsvpId));
  if (!rsvp) {
    return NextResponse.json({ error: "אישור הגעה לא נמצא" }, { status: 404 });
  }

  const invite = await findInviteById(rsvp.inviteId);
  if (!invite || invite.userId !== user.id) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { tableId } = await req.json();
  await assignRsvpTable(rsvp.id, tableId ?? null);
  return NextResponse.json({ success: true });
}
