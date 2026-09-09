import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { clearSuperadminCookie } from "@/lib/superadmin";

export async function POST() {
  await clearSessionCookie();
  await clearSuperadminCookie();
  return NextResponse.json({ success: true });
}
