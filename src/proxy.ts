import { NextRequest, NextResponse } from "next/server";
import { findUserByToken, listInvitesByUser } from "@/lib/store";

const SESSION_COOKIE = "session_token";

export function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
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
    const user = findUserByToken(token);
    if (user && listInvitesByUser(user.id).length > 0) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/create", "/create/:path*", "/dashboard", "/dashboard/:path*", "/admin", "/admin/:path*"],
};
