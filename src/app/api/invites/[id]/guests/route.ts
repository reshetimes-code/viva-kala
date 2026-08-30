import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findInviteById, listRsvpsByInvite, listTablesByInvite } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר תחילה" }, { status: 401 });
  }

  const { id } = await params;
  const invite = await findInviteById(id);
  if (!invite || invite.userId !== user.id) {
    return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
  }

  return NextResponse.json({
    rsvps: await listRsvpsByInvite(id),
    tables: await listTablesByInvite(id),
  });
}
