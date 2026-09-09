import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { isAdminUser } from "./store";

// A second, independent way into the admin panel: a single shared password
// (env var, no username, no row in the users table at all) that drops
// straight into /admin. Exists alongside the normal "log in as the oren
// account" path (isAdminUser) rather than replacing it - either one alone
// is enough to pass hasAdminAccess() below.
const SUPERADMIN_COOKIE = "superadmin_token";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days, same as the regular session cookie

export function isSuperadminConfigured(): boolean {
  return !!process.env.SUPERADMIN_PASSWORD_HASH;
}

// Login attempts are throttled per-IP in memory rather than in the database -
// this service always runs as exactly one instance (min=max=1 on Cloud Run),
// so the counters are as reliable as a DB table would be for as long as the
// instance stays up, with no schema to add for what's just a brute-force
// speed bump on a single shared secret.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

export function isRateLimited(ip: string): boolean {
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt < Date.now()) return false;
  return rec.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    rec.count += 1;
  }
}

export function clearAttempts(ip: string): void {
  attempts.delete(ip);
}

export function verifySuperadminPassword(password: string): boolean {
  const hash = process.env.SUPERADMIN_PASSWORD_HASH;
  if (!hash) return false;
  return bcrypt.compareSync(password, hash);
}

// Stateless signed cookie (no sessions-table row, on purpose - this login
// has nothing to do with the users table) - signed with the password hash
// itself as the HMAC key, so rotating SUPERADMIN_PASSWORD_HASH also silently
// invalidates every cookie issued under the old password.
function sign(payload: string): string {
  const key = process.env.SUPERADMIN_PASSWORD_HASH;
  if (!key) throw new Error("SUPERADMIN_PASSWORD_HASH is not set");
  return crypto.createHmac("sha256", key).update(payload).digest("hex");
}

// Exported (not just used internally by hasSuperadminCookie below) so
// proxy.ts's middleware can check the raw cookie value straight off the
// request too - middleware runs before any page/route code and reads
// cookies via NextRequest, not next/headers' cookies(), which only works
// inside Server Components/Route Handlers/Actions.
export function verifySuperadminToken(token: string | undefined): boolean {
  if (!token || !isSuperadminConfigured()) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return false;
  }
  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;
  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export async function setSuperadminCookie(): Promise<void> {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = String(expiresAt);
  const token = `${payload}.${sign(payload)}`;
  const cookieStore = await cookies();
  cookieStore.set(SUPERADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: TOKEN_TTL_MS / 1000,
  });
}

export async function clearSuperadminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SUPERADMIN_COOKIE);
}

export async function hasSuperadminCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySuperadminToken(cookieStore.get(SUPERADMIN_COOKIE)?.value);
}

export { SUPERADMIN_COOKIE };

// The one check every admin page/route should use instead of isAdminUser()
// alone - true for the real oren account OR a valid superadmin cookie.
export async function hasAdminAccess(user: { username: string } | null | undefined): Promise<boolean> {
  if (isAdminUser(user)) return true;
  return hasSuperadminCookie();
}
