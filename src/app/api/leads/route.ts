import { NextRequest, NextResponse } from "next/server";
import { insertLead } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, sourceInviteId } = await req.json();
    if (!phone || !String(phone).trim()) {
      return NextResponse.json({ error: "נא להזין מספר טלפון" }, { status: 400 });
    }
    insertLead({
      name: name ?? "",
      phone: String(phone).trim(),
      sourceInviteId: sourceInviteId ?? "",
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה בשליחה";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
