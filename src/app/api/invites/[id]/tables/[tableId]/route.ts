import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findInviteById, deleteTable, updateTableCapacity } from "@/lib/store";
import { getServerLocale } from "@/lib/i18n/server";

const MESSAGES = {
  he: {
    loginRequired: "יש להתחבר תחילה",
    notFound: "הזמנה לא נמצאה",
    invalidCapacity: "כמות מקומות לא תקינה",
    tableNotFound: "שולחן לא נמצא",
  },
  en: {
    loginRequired: "Please log in first",
    notFound: "Invitation not found",
    invalidCapacity: "Invalid seat count",
    tableNotFound: "Table not found",
  },
};

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: t.loginRequired }, { status: 401 });
  }
  const { id, tableId } = await params;
  const invite = await findInviteById(id);
  if (!invite || invite.userId !== user.id) {
    return NextResponse.json({ error: t.notFound }, { status: 404 });
  }
  await deleteTable(tableId, id);
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: t.loginRequired }, { status: 401 });
  }
  const { id, tableId } = await params;
  const invite = await findInviteById(id);
  if (!invite || invite.userId !== user.id) {
    return NextResponse.json({ error: t.notFound }, { status: 404 });
  }
  const { capacity } = await req.json();
  const parsedCapacity =
    capacity === undefined || capacity === null || capacity === ""
      ? null
      : Number(capacity);
  if (parsedCapacity !== null && (!Number.isFinite(parsedCapacity) || parsedCapacity <= 0)) {
    return NextResponse.json({ error: t.invalidCapacity }, { status: 400 });
  }
  const table = await updateTableCapacity(tableId, id, parsedCapacity);
  if (!table) {
    return NextResponse.json({ error: t.tableNotFound }, { status: 404 });
  }
  return NextResponse.json({ success: true, table });
}
