import fs from "fs";
import path from "path";
import type { EventCategory } from "@/lib/eventCategories";

// How long a past event's invite (and its RSVPs/tables/uploaded photo) is
// kept around after the event date before the lazy sweep in readStore()
// purges it. See the sweep function below.
const RETENTION_DAYS_AFTER_EVENT = 14;

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "store.json");

export interface StoredUser {
  id: number;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface StoredSession {
  token: string;
  userId: number;
  createdAt: string;
}

export interface Celebrant {
  name: string;
  gender: string;
  age: string;
}

export interface StoredInvite {
  id: string;
  userId: number;
  mode: "image" | "template";
  invitedAs: string;
  partyType: string;
  celebrants: Celebrant[];
  willBe: string;
  eventDate: string;
  eventStart: string;
  meetAt: string;
  address: string;
  showNavBtn: boolean;
  imgOrBe: string;
  gladSee: string;
  notes: string;
  imageUrl: string;
  templateId?: string;
  templateFields?: Record<string, string>;
  wantRsvp: boolean;
  createdAt: string;
  /** The event category chosen on the landing page / creation flow
   *  ("חתונה", "בר/בת מצווה", "חינה", ...) - drives which extra fields
   *  CategoryFieldsForm shows and how the guest-view headline is built.
   *  Optional so older invites created before this existed keep working. */
  eventCategory?: EventCategory;
  /** Free-form bag for the category-specific fields (groomName, brideName,
   *  celebrantAge, familyName, ...) - same pattern as templateFields, so
   *  adding/renaming a field never needs a data migration. */
  categoryFields?: Record<string, string>;
  /** The AI-chosen (or heuristic-fallback) design decision for laying the
   *  event text over an uploaded/AI photo - computed once at save time and
   *  reused identically in the create-flow preview and the guest view. */
  textStyle?: {
    textColor: string;
    scrimColor: string;
    scrimOpacity: number;
    accentColor: string;
    anchor: "top" | "center" | "bottom";
  };
}

export interface StoredRsvp {
  id: number;
  inviteId: string;
  guestName: string;
  familyName: string;
  phone: string;
  allergies: string;
  attending: boolean;
  guestCount: number;
  tableId: string | null;
  createdAt: string;
}

export interface StoredTable {
  id: string;
  inviteId: string;
  number: string;
  createdAt: string;
}

export interface StoredLead {
  id: number;
  name: string;
  phone: string;
  sourceInviteId: string;
  createdAt: string;
}

interface StoreShape {
  users: StoredUser[];
  sessions: StoredSession[];
  invites: StoredInvite[];
  rsvps: StoredRsvp[];
  tables: StoredTable[];
  leads: StoredLead[];
  nextUserId: number;
  nextRsvpId: number;
  nextTableId: number;
  nextLeadId: number;
}

function defaultStore(): StoreShape {
  return {
    users: [],
    sessions: [],
    invites: [],
    rsvps: [],
    tables: [],
    leads: [],
    nextUserId: 1,
    nextRsvpId: 1,
    nextTableId: 1,
    nextLeadId: 1,
  };
}

function ensureFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(defaultStore(), null, 2), "utf-8");
  }
}

// An invite whose event was more than RETENTION_DAYS_AFTER_EVENT days ago is
// dropped, along with its RSVPs, seating tables, and uploaded photo file -
// no cron/scheduler needed since this flat-file store is fully read on
// every request anyway; this just prunes stale rows as part of that read.
// Invites with a missing/unparseable eventDate are left alone (never
// destroy data over a date we can't confidently read).
function isExpired(eventDate: string, now: Date): boolean {
  if (!eventDate) return false;
  const eventTime = new Date(eventDate).getTime();
  if (Number.isNaN(eventTime)) return false;
  const cutoff = eventTime + RETENTION_DAYS_AFTER_EVENT * 24 * 60 * 60 * 1000;
  return now.getTime() > cutoff;
}

function sweepExpiredInvites(store: StoreShape): boolean {
  const now = new Date();
  const expired = store.invites.filter((i) => isExpired(i.eventDate, now));
  if (expired.length === 0) return false;

  const expiredIds = new Set(expired.map((i) => i.id));
  store.invites = store.invites.filter((i) => !expiredIds.has(i.id));
  store.rsvps = store.rsvps.filter((r) => !expiredIds.has(r.inviteId));
  store.tables = store.tables.filter((t) => !expiredIds.has(t.inviteId));

  for (const invite of expired) {
    if (invite.imageUrl?.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", invite.imageUrl);
      try {
        fs.unlinkSync(filePath);
      } catch {
        // already gone - fine.
      }
    }
  }
  return true;
}

function readStore(): StoreShape {
  ensureFile();
  const raw = fs.readFileSync(dataFile, "utf-8");
  let store: StoreShape;
  try {
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    // Backfill fields added after some invites.json files were already on disk.
    store = {
      ...defaultStore(),
      ...parsed,
      tables: parsed.tables ?? [],
      leads: parsed.leads ?? [],
      // Older store.json files may predate tableId/guestCount - back-fill
      // them with defaults rather than assuming every persisted row already
      // has both (spreading r after the defaults made TS think r always
      // overwrites them, which isn't true for rows written before these
      // fields existed).
      rsvps: (parsed.rsvps ?? []).map((r) => ({ ...r, tableId: r.tableId ?? null, guestCount: r.guestCount ?? 1 })),
    };
  } catch {
    return defaultStore();
  }

  if (sweepExpiredInvites(store)) {
    writeStore(store);
  }
  return store;
}

function writeStore(store: StoreShape) {
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2), "utf-8");
}

// ---- Users ----
export function findUserByUsername(username: string): StoredUser | undefined {
  return readStore().users.find((u) => u.username === username);
}

export function findUserById(id: number): StoredUser | undefined {
  return readStore().users.find((u) => u.id === id);
}

export function insertUser(username: string, passwordHash: string): StoredUser {
  const store = readStore();
  const user: StoredUser = {
    id: store.nextUserId,
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  store.nextUserId += 1;
  writeStore(store);
  return user;
}

// ---- Sessions ----
export function insertSession(token: string, userId: number) {
  const store = readStore();
  store.sessions.push({ token, userId, createdAt: new Date().toISOString() });
  writeStore(store);
}

export function deleteSession(token: string) {
  const store = readStore();
  store.sessions = store.sessions.filter((s) => s.token !== token);
  writeStore(store);
}

export function findUserByToken(token: string): StoredUser | undefined {
  const store = readStore();
  const session = store.sessions.find((s) => s.token === token);
  if (!session) return undefined;
  return store.users.find((u) => u.id === session.userId);
}

// ---- Invites ----
export function insertInvite(invite: StoredInvite) {
  const store = readStore();
  store.invites.push(invite);
  writeStore(store);
}

export function findInviteById(id: string): StoredInvite | undefined {
  return readStore().invites.find((i) => i.id === id);
}

export function updateInvite(
  id: string,
  userId: number,
  updates: Partial<Omit<StoredInvite, "id" | "userId" | "mode" | "createdAt">>
): boolean {
  const store = readStore();
  const invite = store.invites.find((i) => i.id === id && i.userId === userId);
  if (!invite) return false;
  Object.assign(invite, updates);
  writeStore(store);
  return true;
}

export function listInvitesByUser(userId: number): StoredInvite[] {
  return readStore()
    .invites.filter((i) => i.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function deleteInvite(id: string, userId: number): boolean {
  const store = readStore();
  const before = store.invites.length;
  store.invites = store.invites.filter((i) => !(i.id === id && i.userId === userId));
  const wasDeleted = store.invites.length < before;
  if (wasDeleted) {
    store.rsvps = store.rsvps.filter((r) => r.inviteId !== id);
    store.tables = store.tables.filter((t) => t.inviteId !== id);
  }
  writeStore(store);
  return wasDeleted;
}

export function countRsvpsForInvite(inviteId: string): { total: number; attending: number } {
  const rsvps = readStore().rsvps.filter((r) => r.inviteId === inviteId);
  return { total: rsvps.length, attending: rsvps.filter((r) => r.attending).length };
}

// ---- RSVPs ----
// Resubmitting (someone changes their answer, or the page gets refreshed and
// re-sent) updates their existing response instead of adding a duplicate
// row - matched by phone when given, otherwise by full name, within the
// same invite.
export function insertRsvp(rsvp: Omit<StoredRsvp, "id" | "createdAt" | "tableId">): StoredRsvp {
  const store = readStore();
  const phone = rsvp.phone?.trim();
  const existing = store.rsvps.find((r) => {
    if (r.inviteId !== rsvp.inviteId) return false;
    if (phone) return r.phone?.trim() === phone;
    return r.guestName === rsvp.guestName && r.familyName === rsvp.familyName;
  });

  if (existing) {
    Object.assign(existing, rsvp);
    writeStore(store);
    return existing;
  }

  const full: StoredRsvp = {
    ...rsvp,
    id: store.nextRsvpId,
    tableId: null,
    createdAt: new Date().toISOString(),
  };
  store.rsvps.push(full);
  store.nextRsvpId += 1;
  writeStore(store);
  return full;
}

export function listRsvpsByInvite(inviteId: string): StoredRsvp[] {
  return readStore()
    .rsvps.filter((r) => r.inviteId === inviteId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function findRsvpById(rsvpId: number): StoredRsvp | undefined {
  return readStore().rsvps.find((r) => r.id === rsvpId);
}

// Used by the at-the-door table lookup: one QR code per event, and each
// guest identifies themselves by name to find their own seat - so this
// matches by name within a single invite only, never across events.
export function findRsvpsByName(inviteId: string, guestName: string, familyName: string): StoredRsvp[] {
  const g = guestName.trim().toLowerCase();
  const f = familyName.trim().toLowerCase();
  return readStore().rsvps.filter(
    (r) =>
      r.inviteId === inviteId &&
      r.attending &&
      r.guestName.trim().toLowerCase() === g &&
      r.familyName.trim().toLowerCase() === f
  );
}

export function assignRsvpTable(rsvpId: number, tableId: string | null): boolean {
  const store = readStore();
  const rsvp = store.rsvps.find((r) => r.id === rsvpId);
  if (!rsvp) return false;
  rsvp.tableId = tableId;
  writeStore(store);
  return true;
}

// ---- Seating tables ----
export function insertTable(inviteId: string, number: string): StoredTable {
  const store = readStore();
  const table: StoredTable = {
    id: `t${store.nextTableId}`,
    inviteId,
    number,
    createdAt: new Date().toISOString(),
  };
  store.tables.push(table);
  store.nextTableId += 1;
  writeStore(store);
  return table;
}

export function listTablesByInvite(inviteId: string): StoredTable[] {
  return readStore()
    .tables.filter((t) => t.inviteId === inviteId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function findTableById(tableId: string): StoredTable | undefined {
  return readStore().tables.find((t) => t.id === tableId);
}

export function deleteTable(tableId: string, inviteId: string): boolean {
  const store = readStore();
  const before = store.tables.length;
  store.tables = store.tables.filter((t) => !(t.id === tableId && t.inviteId === inviteId));
  const wasDeleted = store.tables.length < before;
  if (wasDeleted) {
    store.rsvps.forEach((r) => {
      if (r.tableId === tableId) r.tableId = null;
    });
  }
  writeStore(store);
  return wasDeleted;
}

// ---- Leads (from the "planning an event soon?" widget on guest invites) ----
export function insertLead(lead: Omit<StoredLead, "id" | "createdAt">): StoredLead {
  const store = readStore();
  const full: StoredLead = { ...lead, id: store.nextLeadId, createdAt: new Date().toISOString() };
  store.leads.push(full);
  store.nextLeadId += 1;
  writeStore(store);
  return full;
}

export function listLeads(): StoredLead[] {
  return readStore().leads.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Every invite belongs to exactly one event owner and leads are tied to the
// single invite they came from - used so the admin's "contact lead" message
// can name the right event owner without ever mixing up different owners'
// events.
export function getInviteOwnerUsername(inviteId: string): string | null {
  const store = readStore();
  const invite = store.invites.find((i) => i.id === inviteId);
  if (!invite) return null;
  const owner = store.users.find((u) => u.id === invite.userId);
  return owner?.username ?? null;
}

// ---- Super-admin ----
// Only the system operator's own account is admin - matched by username
// rather than "first account created", since test/dev signups during
// development can otherwise end up occupying id 1.
const ADMIN_USERNAMES = ["oren"];

export function isAdminUser(user: { username: string } | null | undefined): boolean {
  return !!user && ADMIN_USERNAMES.includes(user.username.toLowerCase());
}

export function listAllUsersWithStats(): Array<{
  id: number;
  username: string;
  createdAt: string;
  inviteCount: number;
  totalAttending: number;
  totalTables: number;
}> {
  const store = readStore();
  return store.users
    .map((u) => {
      const invites = store.invites.filter((i) => i.userId === u.id);
      const inviteIds = new Set(invites.map((i) => i.id));
      const rsvps = store.rsvps.filter((r) => inviteIds.has(r.inviteId));
      const tables = store.tables.filter((t) => inviteIds.has(t.inviteId));
      return {
        id: u.id,
        username: u.username,
        createdAt: u.createdAt,
        inviteCount: invites.length,
        totalAttending: rsvps.filter((r) => r.attending).length,
        totalTables: tables.length,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUserDetail(userId: number) {
  const store = readStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return null;
  const invites = store.invites.filter((i) => i.userId === userId);
  const invitesWithStats = invites.map((inv) => {
    const rsvps = store.rsvps.filter((r) => r.inviteId === inv.id);
    const tables = store.tables.filter((t) => t.inviteId === inv.id);
    return {
      invite: inv,
      totalRsvps: rsvps.length,
      totalAttending: rsvps.filter((r) => r.attending).length,
      totalGuests: rsvps.filter((r) => r.attending).reduce((sum, r) => sum + (r.guestCount || 1), 0),
      totalTables: tables.length,
    };
  });
  return { user: { id: user.id, username: user.username, createdAt: user.createdAt }, invites: invitesWithStats };
}

export function adminUpdateUser(
  userId: number,
  updates: { username?: string; passwordHash?: string }
): boolean {
  const store = readStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return false;
  if (updates.username && updates.username !== user.username) {
    const taken = store.users.some((u) => u.id !== userId && u.username === updates.username);
    if (taken) throw new Error("שם המשתמש כבר תפוס");
    user.username = updates.username;
  }
  if (updates.passwordHash) {
    user.passwordHash = updates.passwordHash;
  }
  writeStore(store);
  return true;
}
