import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  findInviteById,
  insertRsvp,
  listRsvpsByInvite,
  listTablesByInvite,
  RsvpPhoneConflictError,
} from "@/lib/store";
import { getServerLocale } from "@/lib/i18n/server";

const MESSAGES = {
  he: {
    loginRequired: "יש להתחבר תחילה",
    notFound: "הזמנה לא נמצאה",
    nameRequired: "יש להזין שם אורח",
    phoneConflict: "מספר הטלפון הזה כבר רשום תחת שם אחר להזמנה זו",
  },
  en: {
    loginRequired: "Please log in first",
    notFound: "Invitation not found",
    nameRequired: "Guest name is required",
    phoneConflict: "That phone number is already registered under a different name for this invitation",
  },
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: t.loginRequired }, { status: 401 });
  }

  const { id } = await params;
  const invite = await findInviteById(id);
  if (!invite || invite.userId !== user.id) {
    return NextResponse.json({ error: t.notFound }, { status: 404 });
  }

  return NextResponse.json({
    rsvps: await listRsvpsByInvite(id),
    tables: await listTablesByInvite(id),
  });
}

// Lets the event owner add a guest straight into the guest list/seating
// chart themselves - for the guest who "doesn't know how to RSVP" (an
// elderly relative, someone without a smartphone) rather than never
// appearing anywhere the host can seat them. Always inserted as attending;
// phone is optional (the identity-conflict check in insertRsvp only kicks
// in once a phone is actually given).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: t.loginRequired }, { status: 401 });
  }

  const { id } = await params;
  const invite = await findInviteById(id);
  if (!invite || invite.userId !== user.id) {
    return NextResponse.json({ error: t.notFound }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const guestName = typeof body?.guestName === "string" ? body.guestName.trim() : "";
  const familyName = typeof body?.familyName === "string" ? body.familyName.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const guestCount =
    Number.isFinite(body?.guestCount) && body.guestCount > 0 ? Math.floor(body.guestCount) : 1;

  if (!guestName) {
    return NextResponse.json({ error: t.nameRequired }, { status: 400 });
  }

  try {
    const rsvp = await insertRsvp({
      inviteId: id,
      guestName,
      familyName,
      phone,
      allergies: "",
      attending: true,
      guestCount,
    });
    return NextResponse.json({ rsvp });
  } catch (err) {
    if (err instanceof RsvpPhoneConflictError) {
      return NextResponse.json({ error: t.phoneConflict }, { status: 409 });
    }
    throw err;
  }
}
