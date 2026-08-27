import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findInviteById, insertTable, listTablesByInvite } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר תחילה" }, { status: 401 });
  }
  const { id } = await params;
  const invite = findInviteById(id);
  if (!invite || invite.userId !== user.id) {
    return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
  }
  return NextResponse.json({ tables: listTablesByInvite(id) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר תחילה" }, { status: 401 });
  }
  const { id } = await params;
  const invite = findInviteById(id);
  if (!invite || invite.userId !== user.id) {
    return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
  }

  const { number } = await req.json();
  if (!number || !String(number).trim()) {
    return NextResponse.json({ error: "נא להזין מספר שולחן" }, { status: 400 });
  }

  const table = insertTable(id, String(number).trim());
  return NextResponse.json({ success: true, table });
}
