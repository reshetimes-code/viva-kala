import { NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { findInviteById, insertInvite } from "@/lib/store";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר תחילה" }, { status: 401 });
  }

  const { id } = await params;
  const source = findInviteById(id);
  if (!source || source.userId !== user.id) {
    return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
  }

  const newId = crypto.randomBytes(6).toString("hex");
  insertInvite({
    ...source,
    id: newId,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, id: newId });
}
