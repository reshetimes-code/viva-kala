import { NextResponse } from "next/server";
import { findInviteById, findRsvpByIdentity, findRsvpByPhone, findTableById } from "@/lib/store";
import { getServerLocale } from "@/lib/i18n/server";

const MESSAGES = {
  he: {
    eventNotFound: "אירוע לא נמצא",
    missingFields: "יש למלא מספר טלפון",
  },
  en: {
    eventNotFound: "Event not found",
    missingFields: "Please fill in a phone number",
  },
};

// Public endpoint behind the single QR code printed for the hall. Phone
// number is the primary identifier (see findRsvpByPhone - a phone is
// already effectively unique per guest within one invite, since insertRsvp
// refuses to let a second name reuse an existing one), so guestName/
// familyName are optional here: the form's first attempt sends phone alone,
// and only falls back to also sending the guest's name (routed to the
// stricter findRsvpByIdentity) after repeated phone-only misses.
export async function POST(req: Request) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  const body = await req.json().catch(() => null);
  const inviteId = typeof body?.inviteId === "string" ? body.inviteId : "";
  const guestName = typeof body?.guestName === "string" ? body.guestName : "";
  const familyName = typeof body?.familyName === "string" ? body.familyName : "";
  const phone = typeof body?.phone === "string" ? body.phone : "";

  if (!inviteId || !(await findInviteById(inviteId))) {
    return NextResponse.json({ error: t.eventNotFound }, { status: 404 });
  }
  if (!phone.trim()) {
    return NextResponse.json({ error: t.missingFields }, { status: 400 });
  }

  const matches =
    guestName.trim() && familyName.trim()
      ? await findRsvpByIdentity(inviteId, guestName, familyName, phone)
      : await findRsvpByPhone(inviteId, phone);
  const results = await Promise.all(
    matches.map(async (r) => ({
      guestName: r.guestName,
      familyName: r.familyName,
      tableNumber: r.tableId ? (await findTableById(r.tableId))?.number ?? null : null,
    }))
  );

  return NextResponse.json({ results });
}
