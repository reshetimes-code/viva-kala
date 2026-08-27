import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { insertInvite, listInvitesByUser, countRsvpsForInvite } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר תחילה" }, { status: 401 });
  }

  const invites = listInvitesByUser(user.id).map((inv) => ({
    ...inv,
    rsvpCounts: countRsvpsForInvite(inv.id),
  }));

  return NextResponse.json({ invites });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר תחילה" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const mode: "image" | "template" = body.mode === "template" ? "template" : "image";

    const {
      invitedAs,
      partyType,
      celebrants,
      willBe,
      eventDate,
      eventStart,
      meetAt,
      address,
      showNavBtn,
      imgOrBe,
      gladSee,
      notes,
      imageDataUrl,
      templateId,
      templateFields,
      wantRsvp,
    } = body;

    if (mode === "image" && !imageDataUrl) {
      return NextResponse.json({ error: "נדרשת תמונת הזמנה" }, { status: 400 });
    }
    if (mode === "template" && (!templateId || !templateFields)) {
      return NextResponse.json({ error: "נדרשת תבנית עיצוב ופרטים" }, { status: 400 });
    }

    const id = crypto.randomBytes(6).toString("hex");

    insertInvite({
      id,
      userId: user.id,
      mode,
      invitedAs: invitedAs ?? "",
      partyType: partyType ?? "",
      celebrants: celebrants ?? [],
      willBe: willBe ?? "",
      eventDate: eventDate ?? "",
      eventStart: eventStart ?? "",
      meetAt: meetAt ?? "",
      address: address ?? "",
      showNavBtn: !!showNavBtn,
      imgOrBe: imgOrBe ?? "",
      gladSee: gladSee ?? "",
      notes: notes ?? "",
      imageUrl: mode === "image" ? imageDataUrl : "",
      templateId: mode === "template" ? templateId : undefined,
      templateFields: mode === "template" ? templateFields : undefined,
      wantRsvp: !!wantRsvp,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה ביצירת הזמנה";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
