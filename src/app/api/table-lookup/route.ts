import { NextResponse } from "next/server";
import { findInviteById, findRsvpByIdentity, findTableById } from "@/lib/store";

// Public endpoint behind the single QR code printed for the hall - a guest
// scans it and types their name AND phone, and gets back only their own
// table number for that one event (matched strictly within that inviteId).
// Phone is required alongside the name, not optional: it's the same
// name+phone pair that was locked in as their identity when they RSVP'd
// (see insertRsvp/findRsvpByIdentity in store.ts) - matching on name alone
// would let anyone who knows (or guesses) a guest's name land on that
// guest's assigned table.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const inviteId = typeof body?.inviteId === "string" ? body.inviteId : "";
  const guestName = typeof body?.guestName === "string" ? body.guestName : "";
  const familyName = typeof body?.familyName === "string" ? body.familyName : "";
  const phone = typeof body?.phone === "string" ? body.phone : "";

  if (!inviteId || !(await findInviteById(inviteId))) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }
  if (!guestName.trim() || !familyName.trim() || !phone.trim()) {
    return NextResponse.json({ error: "יש למלא שם פרטי, שם משפחה ומספר טלפון" }, { status: 400 });
  }

  const matches = await findRsvpByIdentity(inviteId, guestName, familyName, phone);
  const results = await Promise.all(
    matches.map(async (r) => ({
      guestName: r.guestName,
      familyName: r.familyName,
      tableNumber: r.tableId ? (await findTableById(r.tableId))?.number ?? null : null,
    }))
  );

  return NextResponse.json({ results });
}
