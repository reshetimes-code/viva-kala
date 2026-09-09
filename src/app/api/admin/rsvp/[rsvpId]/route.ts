import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateRsvpDetails, deleteRsvp } from "@/lib/store";
import { hasAdminAccess } from "@/lib/superadmin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ rsvpId: string }> }
) {
  const admin = await getCurrentUser();
  if (!(await hasAdminAccess(admin))) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { rsvpId } = await params;
  const body = await req.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  if (typeof body.guestName === "string") updates.guestName = body.guestName.trim();
  if (typeof body.familyName === "string") updates.familyName = body.familyName.trim();
  if (typeof body.phone === "string") updates.phone = body.phone.trim();
  if (typeof body.attending === "boolean") updates.attending = body.attending;
  if (typeof body.guestCount === "number") updates.guestCount = Math.max(1, body.guestCount);

  const rsvp = await updateRsvpDetails(Number(rsvpId), updates);
  if (!rsvp) {
    return NextResponse.json({ error: "אישור הגעה לא נמצא" }, { status: 404 });
  }
  return NextResponse.json({ success: true, rsvp });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ rsvpId: string }> }
) {
  const admin = await getCurrentUser();
  if (!(await hasAdminAccess(admin))) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { rsvpId } = await params;
  const ok = await deleteRsvp(Number(rsvpId));
  if (!ok) {
    return NextResponse.json({ error: "אישור הגעה לא נמצא" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
