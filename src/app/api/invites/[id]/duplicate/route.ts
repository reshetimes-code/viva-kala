import { NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { findInviteById, insertInvite } from "@/lib/store";
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

export async function POST(
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
  const source = await findInviteById(id);
  if (!source || source.userId !== user.id) {
    return NextResponse.json({ error: t.notFound }, { status: 404 });
  }

  const newId = crypto.randomBytes(6).toString("hex");
  await insertInvite({
    ...source,
    id: newId,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, id: newId });
}
