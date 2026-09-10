import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { findUserByUsername, insertUser, insertSession, deleteSession, findUserByToken } from "./store";

const SESSION_COOKIE = "session_token";

export interface User {
  id: number;
  username: string;
  accountType: "individual" | "hall";
  hallId?: number;
}

export async function createUser(
  username: string,
  password: string,
  options?: { accountType?: "individual" | "hall"; hallId?: number }
): Promise<User> {
  const existing = await findUserByUsername(username);
  if (existing) {
    // Stable code, not user-facing text - the route/page catching this picks
    // a Hebrew/English message for it based on the request's UI language.
    throw new Error("USERNAME_TAKEN");
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = await insertUser(username, passwordHash, options);
  return { id: user.id, username: user.username, accountType: user.accountType, hallId: user.hallId };
}

export async function verifyUser(username: string, password: string): Promise<User | null> {
  const user = await findUserByUsername(username);
  if (!user) return null;
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, username: user.username, accountType: user.accountType, hallId: user.hallId };
}

export async function createSessionToken(userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await insertSession(token, userId);
  return token;
}

export async function deleteSessionToken(token: string) {
  await deleteSession(token);
}

export async function getUserByToken(token: string): Promise<User | null> {
  const user = await findUserByToken(token);
  return user ? { id: user.id, username: user.username, accountType: user.accountType, hallId: user.hallId } : null;
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getUserByToken(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Without this, the browser would also send the session token over a
    // plain http:// connection (a MITM downgrade, a stray non-TLS link) -
    // off locally only, where there's no TLS to require, matching the same
    // pattern already used for the superadmin cookie in superadmin.ts.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await deleteSessionToken(token);
  cookieStore.delete(SESSION_COOKIE);
}

export { SESSION_COOKIE };
