import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteInvite, findInviteById, updateInvite } from "@/lib/store";

export async function DELETE(
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

  deleteInvite(id, user.id);
  return NextResponse.json({ success: true });
}

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
  return NextResponse.json({ invite });
}

export async function PATCH(
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

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  const allowed = [
    "invitedAs", "partyType", "celebrants", "willBe", "eventDate", "eventStart",
    "meetAt", "address", "showNavBtn", "imgOrBe", "gladSee", "notes", "imageUrl",
    "templateFields", "wantRsvp",
  ];
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  // The image-mode form's field is historically named imageDataUrl - accept
  // it here too and store it under the invite's real imageUrl column.
  if ("imageDataUrl" in body) updates.imageUrl = body.imageDataUrl;

  updateInvite(id, user.id, updates);
  return NextResponse.json({ success: true });
}
