import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser, listLeads } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  return NextResponse.json({ leads: listLeads() });
}
