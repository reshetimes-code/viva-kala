import { NextRequest, NextResponse } from "next/server";
import { findUserByToken, listInvitesByUser } from "@/lib/store";
import { verifySuperadminToken, SUPERADMIN_COOKIE } from "@/lib/superadmin";

const SESSION_COOKIE = "session_token";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    // /admin has a second, independent front door (see src/lib/superadmin.ts) -
    // a valid superadmin cookie never comes with a session_token (that login
    // never touches the users table at all), so without this check every
    // superadmin-only visit to /admin would be bounced here before the page
    // itself ever got a chance to recognize that cookie.
    const { pathname } = req.nextUrl;
    const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
    if (isAdminPath && verifySuperadminToken(req.cookies.get(SUPERADMIN_COOKIE)?.value)) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Each account gets exactly one invite. Once it exists, the "create a new
  // invite" entry points send them back to manage the one they already
  // have instead - editing still works separately via /dashboard/[id]/edit,
  // a route this check never touches.
  const { pathname } = req.nextUrl;
  const isCreateEntry =
    pathname === "/create" || pathname.startsWith("/create/image") || pathname.startsWith("/create/templates");
  if (isCreateEntry) {
    const user = await findUserByToken(token);
    if (user && (await listInvitesByUser(user.id)).length > 0) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/create", "/create/:path*", "/dashboard", "/dashboard/:path*", "/admin", "/admin/:path*"],
};
