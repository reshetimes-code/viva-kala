import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findInviteById, listRsvpsByInvite, listTablesByInvite } from "@/lib/store";
import { getServerLocale } from "@/lib/i18n/server";

const MESSAGES = {
  he: {
    loginRequired: "יש להתחבר תחילה",
    notFound: "הזמנה לא נמצאה",
  },
  en: {
    loginRequired: "Please log in first",
    notFound: "Invitation not found",
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
