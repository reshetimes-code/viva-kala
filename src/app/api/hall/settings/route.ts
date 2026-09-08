import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findUserById, updateHallSettings } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.accountType !== "hall") {
    return NextResponse.json({ error: "יש להתחבר כאולם אירועים" }, { status: 401 });
  }
  const hall = await findUserById(user.id);
  return NextResponse.json({ youtubeUrl: hall?.youtubeUrl ?? "", tourUrl: hall?.tourUrl ?? "" });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.accountType !== "hall") {
    return NextResponse.json({ error: "יש להתחבר כאולם אירועים" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const youtubeUrl = typeof body?.youtubeUrl === "string" ? body.youtubeUrl : "";
  const tourUrl = typeof body?.tourUrl === "string" ? body.tourUrl : "";
  await updateHallSettings(user.id, { youtubeUrl, tourUrl });
  return NextResponse.json({ success: true });
}
