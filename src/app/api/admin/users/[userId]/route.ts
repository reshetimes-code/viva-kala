import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser, getUserDetail, adminUpdateUser, adminDeleteUser, findUserById } from "@/lib/store";
import { hasAdminAccess } from "@/lib/superadmin";
import { getServerLocale } from "@/lib/i18n/server";

const MESSAGES = {
  he: {
    noAccess: "אין הרשאה",
    userNotFound: "משתמש לא נמצא",
    shortPassword: "הסיסמה חייבת להכיל לפחות 4 תווים",
    usernameTaken: "שם המשתמש כבר תפוס",
    updateError: "שגיאה בעדכון",
    cannotDeleteAdmin: "לא ניתן למחוק את חשבון המנהל",
  },
  en: {
    noAccess: "You don't have permission",
    userNotFound: "User not found",
    shortPassword: "Password must be at least 4 characters",
    usernameTaken: "This username is already taken",
    updateError: "Error updating user",
    cannotDeleteAdmin: "The admin account cannot be deleted",
  },
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  const admin = await getCurrentUser();
  if (!(await hasAdminAccess(admin))) {
    return NextResponse.json({ error: t.noAccess }, { status: 403 });
  }
  const { userId } = await params;
  const detail = await getUserDetail(Number(userId));
  if (!detail) {
    return NextResponse.json({ error: t.userNotFound }, { status: 404 });
  }
  return NextResponse.json(detail);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  const admin = await getCurrentUser();
  if (!(await hasAdminAccess(admin))) {
    return NextResponse.json({ error: t.noAccess }, { status: 403 });
  }
  const { userId } = await params;
  const { username, password } = await req.json();

  try {
    const updates: { username?: string; passwordHash?: string } = {};
    if (username && String(username).trim()) updates.username = String(username).trim();
    if (password && String(password).trim()) {
      if (String(password).length < 4) {
        return NextResponse.json({ error: t.shortPassword }, { status: 400 });
      }
      updates.passwordHash = bcrypt.hashSync(String(password), 10);
    }
    const ok = await adminUpdateUser(Number(userId), updates);
    if (!ok) {
      return NextResponse.json({ error: t.userNotFound }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error && err.message === "USERNAME_TAKEN"
        ? t.usernameTaken
        : err instanceof Error
        ? err.message
        : t.updateError;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const locale = await getServerLocale();
  const t = MESSAGES[locale];
  const admin = await getCurrentUser();
  if (!(await hasAdminAccess(admin))) {
    return NextResponse.json({ error: t.noAccess }, { status: 403 });
  }
  const { userId } = await params;
  const id = Number(userId);

  // Never let even the real admin delete the admin account itself (e.g. by
  // mistakenly opening its own row) - would lock the panel with no way back in.
  const target = await findUserById(id);
  if (target && isAdminUser(target)) {
    return NextResponse.json({ error: t.cannotDeleteAdmin }, { status: 400 });
  }

  const ok = await adminDeleteUser(id);
  if (!ok) {
    return NextResponse.json({ error: t.userNotFound }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
