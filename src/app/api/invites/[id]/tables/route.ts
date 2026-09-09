import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findInviteById, insertTable, listTablesByInvite } from "@/lib/store";
import { getServerLocale } from "@/lib/i18n/server";

const MESSAGES = {
  he: {
    loginRequired: "יש להתחבר תחילה",
    notFound: "הזמנה לא נמצאה",
    needTableNumber: "נא להזין מספר שולחן",
    invalidCapacity: "כמות מקומות לא תקינה",
  },
  en: {
    loginRequired: "Please log in first",
    notFound: "Invitation not found",
    needTableNumber: "Please enter a table number",
    invalidCapacity: "Invalid seat count",
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
  return NextResponse.json({ tables: await listTablesByInvite(id) });
}

export async function POST(
  req: NextRequest,
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

  const { number, capacity } = await req.json();
  if (!number || !String(number).trim()) {
    return NextResponse.json({ error: t.needTableNumber }, { status: 400 });
  }
  const parsedCapacity =
    capacity === undefined || capacity === null || capacity === ""
      ? null
      : Number(capacity);
  if (parsedCapacity !== null && (!Number.isFinite(parsedCapacity) || parsedCapacity <= 0)) {
    return NextResponse.json({ error: t.invalidCapacity }, { status: 400 });
  }

  const table = await insertTable(id, String(number).trim(), parsedCapacity);
  return NextResponse.json({ success: true, table });
}
