import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findInviteById, deleteTable } from "@/lib/store";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר תחילה" }, { status: 401 });
  }
  const { id, tableId } = await params;
  const invite = findInviteById(id);
  if (!invite || invite.userId !== user.id) {
    return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
  }
  deleteTable(tableId, id);
  return NextResponse.json({ success: true });
}
