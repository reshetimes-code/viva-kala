import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { insertInvite, listInvitesByUser, countRsvpsForInvite } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import { saveImageDataUrl } from "@/lib/imageStorage";
import { isEventCategory } from "@/lib/eventCategories";

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
      eventCategory,
      categoryFields,
    } = body;

    if (mode === "image" && !imageDataUrl) {
      return NextResponse.json({ error: "נדרשת תמונת הזמנה" }, { status: 400 });
    }
    if (mode === "template" && (!templateId || !templateFields)) {
      return NextResponse.json({ error: "נדרשת תבנית עיצוב ופרטים" }, { status: 400 });
    }

    const id = crypto.randomBytes(6).toString("hex");

    // Photos come in as base64 data URLs from the browser - normalize/
    // compress and write them to disk once here, so store.json only ever
    // holds a short "/uploads/..." path instead of megabytes of inline text.
    const imageUrl = mode === "image" ? await saveImageDataUrl(imageDataUrl, "invite") : "";

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
      imageUrl,
      templateId: mode === "template" ? templateId : undefined,
      templateFields: mode === "template" ? templateFields : undefined,
      wantRsvp: !!wantRsvp,
      eventCategory: isEventCategory(eventCategory) ? eventCategory : undefined,
      categoryFields: categoryFields && typeof categoryFields === "object" ? categoryFields : undefined,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה ביצירת הזמנה";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
