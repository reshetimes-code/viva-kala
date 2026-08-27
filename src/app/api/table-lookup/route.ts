import { NextResponse } from "next/server";
import { findInviteById, findRsvpsByName, findTableById } from "@/lib/store";

// Public endpoint behind the single QR code printed for the hall - a guest
// scans it, types their name, and gets back only their own table number for
// that one event (matched strictly within that inviteId).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const inviteId = typeof body?.inviteId === "string" ? body.inviteId : "";
  const guestName = typeof body?.guestName === "string" ? body.guestName : "";
  const familyName = typeof body?.familyName === "string" ? body.familyName : "";

  if (!inviteId || !findInviteById(inviteId)) {
    return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
  }
  if (!guestName.trim() || !familyName.trim()) {
    return NextResponse.json({ error: "יש למלא שם פרטי ושם משפחה" }, { status: 400 });
  }

  const matches = findRsvpsByName(inviteId, guestName, familyName);
  const results = matches.map((r) => ({
    guestName: r.guestName,
    familyName: r.familyName,
    tableNumber: r.tableId ? findTableById(r.tableId)?.number ?? null : null,
  }));

  return NextResponse.json({ results });
}
