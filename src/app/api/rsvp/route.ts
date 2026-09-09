import { NextRequest, NextResponse } from "next/server";
import { findInviteById, insertRsvp, RsvpPhoneConflictError } from "@/lib/store";
import { getServerLocale } from "@/lib/i18n/server";

const MESSAGES = {
  he: {
    missingInviteId: "חסר מזהה הזמנה",
    missingFields: "יש למלא שם פרטי, שם משפחה ומספר טלפון",
    notFound: "הזמנה לא נמצאה",
    phoneExists: "מספר הטלפון שהזנת קיים כבר במערכת",
    phoneExistsDetail: "לעדכון פרטי הגעתכם אנא צרו קשר עם בעלי האירוע",
    generic: "שגיאה בשליחת אישור ההגעה",
  },
  en: {
    missingInviteId: "Missing invitation id",
    missingFields: "Please fill in first name, last name and phone number",
    notFound: "Invitation not found",
    phoneExists: "This phone number is already registered",
    phoneExistsDetail: "To update your attendance details, please contact the event host",
    generic: "Error submitting your RSVP",
  },
};

export async function POST(req: NextRequest) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  try {
    const { inviteId, guestName, familyName, phone, allergies, attending, guestCount } = await req.json();

    if (!inviteId) {
      return NextResponse.json({ error: t.missingInviteId }, { status: 400 });
    }

    // Name + last name + phone, all three, every time - mirrors the
    // guest-facing form's own client-side check (InviteView.tsx) but never
    // trusts it alone, since this is the identity insertRsvp() locks the
    // guest's table to (see its doc comment).
    const trimmedGuestName = String(guestName ?? "").trim();
    const trimmedFamilyName = String(familyName ?? "").trim();
    const trimmedPhone = String(phone ?? "").trim();
    if (!trimmedGuestName || !trimmedFamilyName || !trimmedPhone) {
      return NextResponse.json({ error: t.missingFields }, { status: 400 });
    }

    const invite = await findInviteById(inviteId);
    if (!invite) {
      return NextResponse.json({ error: t.notFound }, { status: 404 });
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
          error: t.phoneExists,
          detail: t.phoneExistsDetail,
        },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : t.generic;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
