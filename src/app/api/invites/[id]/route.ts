import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteInvite, findInviteById, updateInvite } from "@/lib/store";
import { deleteStoredImage, saveImageDataUrl } from "@/lib/imageStorage";
import { isEventCategory } from "@/lib/eventCategories";

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
  await deleteStoredImage(invite.imageUrl);
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
    "templateFields", "wantRsvp", "categoryFields",
  ];
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  if ("eventCategory" in body) {
    updates.eventCategory = isEventCategory(body.eventCategory) ? body.eventCategory : undefined;
  }
  // The image-mode form's field is historically named imageDataUrl - accept
  // it here too and store it under the invite's real imageUrl column. A new
  // photo (a data: URL) is written to disk here; the previous file (if any,
  // and if it's actually being replaced) is removed afterwards.
  if ("imageDataUrl" in body) {
    const newUrl = await saveImageDataUrl(body.imageDataUrl, "invite");
    updates.imageUrl = newUrl;
    if (invite.imageUrl && invite.imageUrl !== newUrl) {
      await deleteStoredImage(invite.imageUrl);
    }
  }

  updateInvite(id, user.id, updates);
  return NextResponse.json({ success: true });
}
