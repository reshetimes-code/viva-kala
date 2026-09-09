import { NextRequest, NextResponse } from "next/server";
import { insertLead } from "@/lib/store";
import { getServerLocale } from "@/lib/i18n/server";

const MESSAGES = {
  he: {
    needPhone: "נא להזין מספר טלפון",
    generic: "שגיאה בשליחה",
  },
  en: {
    needPhone: "Please enter a phone number",
    generic: "Error submitting",
  },
};

export async function POST(req: NextRequest) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  try {
    const { name, phone, sourceInviteId, eventDate, eventType, eventVenue } = await req.json();
    if (!phone || !String(phone).trim()) {
      return NextResponse.json({ error: t.needPhone }, { status: 400 });
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
    const message = err instanceof Error ? err.message : t.generic;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
