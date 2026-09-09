import { NextRequest, NextResponse } from "next/server";
import { findInviteById, insertRsvp, RsvpPhoneConflictError } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { inviteId, guestName, familyName, phone, allergies, attending, guestCount } = await req.json();

    if (!inviteId) {
      return NextResponse.json({ error: "חסר מזהה הזמנה" }, { status: 400 });
    }

    // Name + last name + phone, all three, every time - mirrors the
    // guest-facing form's own client-side check (InviteView.tsx) but never
    // trusts it alone, since this is the identity insertRsvp() locks the
    // guest's table to (see its doc comment).
    const trimmedGuestName = String(guestName ?? "").trim();
    const trimmedFamilyName = String(familyName ?? "").trim();
    const trimmedPhone = String(phone ?? "").trim();
    if (!trimmedGuestName || !trimmedFamilyName || !trimmedPhone) {
      return NextResponse.json({ error: "יש למלא שם פרטי, שם משפחה ומספר טלפון" }, { status: 400 });
    }

    const invite = await findInviteById(inviteId);
    if (!invite) {
      return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
    }

    const rsvp = await insertRsvp({
      inviteId,
      guestName: trimmedGuestName,
      familyName: trimmedFamilyName,
      phone: trimmedPhone,
      allergies: allergies ?? "",
      attending: !!attending,
      guestCount: Math.max(1, Number(guestCount) || 1),
    });

    return NextResponse.json({ success: true, rsvpId: rsvp.id });
  } catch (err) {
    if (err instanceof RsvpPhoneConflictError) {
      return NextResponse.json(
        {
          error: "מספר הטלפון שהזנת קיים כבר במערכת",
          detail: "לעדכון פרטי הגעתכם אנא צרו קשר עם בעלי האירוע",
        },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "שגיאה בשליחת אישור ההגעה";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
