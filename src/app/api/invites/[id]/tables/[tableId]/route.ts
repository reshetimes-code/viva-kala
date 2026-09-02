import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findInviteById, deleteTable, updateTableCapacity } from "@/lib/store";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר תחילה" }, { status: 401 });
  }
  const { id, tableId } = await params;
  const invite = await findInviteById(id);
  if (!invite || invite.userId !== user.id) {
    return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
  }
  await deleteTable(tableId, id);
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר תחילה" }, { status: 401 });
  }
  const { id, tableId } = await params;
  const invite = await findInviteById(id);
  if (!invite || invite.userId !== user.id) {
    return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
  }
  const { capacity } = await req.json();
  const parsedCapacity =
    capacity === undefined || capacity === null || capacity === ""
      ? null
      : Number(capacity);
  if (parsedCapacity !== null && (!Number.isFinite(parsedCapacity) || parsedCapacity <= 0)) {
    return NextResponse.json({ error: "כמות מקומות לא תקינה" }, { status: 400 });
  }
  const table = await updateTableCapacity(tableId, parsedCapacity);
  if (!table) {
    return NextResponse.json({ error: "שולחן לא נמצא" }, { status: 404 });
  }
  return NextResponse.json({ success: true, table });
}
