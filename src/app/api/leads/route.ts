import { NextRequest, NextResponse } from "next/server";
import { insertLead } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, sourceInviteId, eventDate, eventType, eventVenue } = await req.json();
    if (!phone || !String(phone).trim()) {
      return NextResponse.json({ error: "נא להזין מספר טלפון" }, { status: 400 });
    }
    await insertLead({
      name: name ?? "",
      phone: String(phone).trim(),
      sourceInviteId: sourceInviteId ?? "",
      eventDate: eventDate ?? "",
      eventType: eventType ?? "",
      eventVenue: eventVenue ?? "",
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה בשליחה";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
