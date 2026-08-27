import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { findUserByUsername, insertUser, insertSession, deleteSession, findUserByToken } from "./store";

const SESSION_COOKIE = "session_token";

export interface User {
  id: number;
  username: string;
}

export function createUser(username: string, password: string): User {
  const existing = findUserByUsername(username);
  if (existing) {
    throw new Error("שם המשתמש כבר תפוס");
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = insertUser(username, passwordHash);
  return { id: user.id, username: user.username };
}

export function verifyUser(username: string, password: string): User | null {
  const user = findUserByUsername(username);
  if (!user) return null;
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, username: user.username };
}

export function createSessionToken(userId: number): string {
  const token = crypto.randomBytes(32).toString("hex");
  insertSession(token, userId);
  return token;
}

export function deleteSessionToken(token: string) {
  deleteSession(token);
}

export function getUserByToken(token: string): User | null {
  const user = findUserByToken(token);
  return user ? { id: user.id, username: user.username } : null;
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
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) deleteSessionToken(token);
  cookieStore.delete(SESSION_COOKIE);
}

export { SESSION_COOKIE };
