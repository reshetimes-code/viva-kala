import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listAllUsersWithStats } from "@/lib/store";
import { hasAdminAccess } from "@/lib/superadmin";

export async function GET() {
  const user = await getCurrentUser();
  if (!(await hasAdminAccess(user))) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  return NextResponse.json({ users: await listAllUsersWithStats() });
}
