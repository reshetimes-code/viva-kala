import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser, getUserDetail, adminUpdateUser } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await getCurrentUser();
  if (!isAdminUser(admin)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  const { userId } = await params;
  const detail = await getUserDetail(Number(userId));
  if (!detail) {
    return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
  }
  return NextResponse.json(detail);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await getCurrentUser();
  if (!isAdminUser(admin)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  const { userId } = await params;
  const { username, password } = await req.json();

  try {
    const updates: { username?: string; passwordHash?: string } = {};
    if (username && String(username).trim()) updates.username = String(username).trim();
    if (password && String(password).trim()) {
      if (String(password).length < 4) {
        return NextResponse.json({ error: "הסיסמה חייבת להכיל לפחות 4 תווים" }, { status: 400 });
      }
      updates.passwordHash = bcrypt.hashSync(String(password), 10);
    }
    const ok = await adminUpdateUser(Number(userId), updates);
    if (!ok) {
      return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה בעדכון";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
