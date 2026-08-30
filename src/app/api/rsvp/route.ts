import { NextRequest, NextResponse } from "next/server";
import { findInviteById, insertRsvp } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { inviteId, guestName, familyName, phone, allergies, attending, guestCount } = await req.json();

    if (!inviteId) {
      return NextResponse.json({ error: "חסר מזהה הזמנה" }, { status: 400 });
    }

    const invite = await findInviteById(inviteId);
    if (!invite) {
      return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
    }

    const rsvp = await insertRsvp({
      inviteId,
      guestName: guestName ?? "",
      familyName: familyName ?? "",
      phone: phone ?? "",
      allergies: allergies ?? "",
      attending: !!attending,
      guestCount: Math.max(1, Number(guestCount) || 1),
    });

    return NextResponse.json({ success: true, rsvpId: rsvp.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה בשליחת אישור ההגעה";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
