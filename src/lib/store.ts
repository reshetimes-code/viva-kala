import type { EventCategory } from "@/lib/eventCategories";
import { getPool } from "@/lib/db";
import { deleteStoredImage } from "@/lib/imageStorage";

// How long a past event's invite (and its RSVPs/tables/uploaded photo) is
// kept around after the event date before the lazy sweep below purges it.
const RETENTION_DAYS_AFTER_EVENT = 14;

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

// ---------------------------------------------------------------------
// Row <-> TS mapping. Postgres columns are snake_case, jsonb columns come
// back already parsed by node-postgres; timestamptz columns come back as
// JS Date objects, converted to ISO strings here to keep createdAt's
// external contract (a string, sortable with .localeCompare) unchanged
// from when this was a flat JSON file.
// ---------------------------------------------------------------------

function rowToUser(row: any): StoredUser {
  return { id: row.id, username: row.username, passwordHash: row.password_hash, createdAt: row.created_at.toISOString() };
}

function rowToInvite(row: any): StoredInvite {
  return {
    id: row.id,
    userId: row.user_id,
    mode: row.mode,
    invitedAs: row.invited_as,
    partyType: row.party_type,
    celebrants: row.celebrants ?? [],
    willBe: row.will_be,
    eventDate: row.event_date,
    eventStart: row.event_start,
    meetAt: row.meet_at,
    address: row.address,
    showNavBtn: row.show_nav_btn,
    imgOrBe: row.img_or_be,
    gladSee: row.glad_see,
    notes: row.notes,
    imageUrl: row.image_url,
    templateId: row.template_id ?? undefined,
    templateFields: row.template_fields ?? undefined,
    wantRsvp: row.want_rsvp,
    createdAt: row.created_at.toISOString(),
    eventCategory: row.event_category ?? undefined,
    categoryFields: row.category_fields ?? undefined,
    textStyle: row.text_style ?? undefined,
  };
}

function rowToRsvp(row: any): StoredRsvp {
  return {
    id: row.id,
    inviteId: row.invite_id,
    guestName: row.guest_name,
    familyName: row.family_name,
    phone: row.phone,
    allergies: row.allergies,
    attending: row.attending,
    guestCount: row.guest_count,
    tableId: row.table_id,
    createdAt: row.created_at.toISOString(),
  };
}

function rowToTable(row: any): StoredTable {
  return { id: row.id, inviteId: row.invite_id, number: row.number, createdAt: row.created_at.toISOString() };
}

function rowToLead(row: any): StoredLead {
  return { id: row.id, name: row.name, phone: row.phone, sourceInviteId: row.source_invite_id, createdAt: row.created_at.toISOString() };
}

// camelCase invite field -> [column, isJsonColumn]. Drives both the
// dynamic UPDATE in updateInvite() and the INSERT in insertInvite(), so
// adding a new invite field only ever needs one line here.
const INVITE_FIELD_MAP: Record<string, [string, boolean]> = {
  invitedAs: ["invited_as", false],
  partyType: ["party_type", false],
  celebrants: ["celebrants", true],
  willBe: ["will_be", false],
  eventDate: ["event_date", false],
  eventStart: ["event_start", false],
  meetAt: ["meet_at", false],
  address: ["address", false],
  showNavBtn: ["show_nav_btn", false],
  imgOrBe: ["img_or_be", false],
  gladSee: ["glad_see", false],
  notes: ["notes", false],
  imageUrl: ["image_url", false],
  templateId: ["template_id", false],
  templateFields: ["template_fields", true],
  wantRsvp: ["want_rsvp", false],
  eventCategory: ["event_category", false],
  categoryFields: ["category_fields", true],
  textStyle: ["text_style", true],
};

function toParam(value: unknown, isJson: boolean) {
  if (isJson) return value === undefined ? null : JSON.stringify(value);
  return value === undefined ? null : value;
}

// ---- Users ----
export async function findUserByUsername(username: string): Promise<StoredUser | undefined> {
  const res = await getPool().query("SELECT * FROM users WHERE username = $1", [username]);
  return res.rows[0] ? rowToUser(res.rows[0]) : undefined;
}

export async function findUserById(id: number): Promise<StoredUser | undefined> {
  const res = await getPool().query("SELECT * FROM users WHERE id = $1", [id]);
  return res.rows[0] ? rowToUser(res.rows[0]) : undefined;
}

export async function insertUser(username: string, passwordHash: string): Promise<StoredUser> {
  const res = await getPool().query(
    "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *",
    [username, passwordHash]
  );
  return rowToUser(res.rows[0]);
}

// ---- Sessions ----
export async function insertSession(token: string, userId: number): Promise<void> {
  await getPool().query("INSERT INTO sessions (token, user_id) VALUES ($1, $2)", [token, userId]);
}

export async function deleteSession(token: string): Promise<void> {
  await getPool().query("DELETE FROM sessions WHERE token = $1", [token]);
}

export async function findUserByToken(token: string): Promise<StoredUser | undefined> {
  const res = await getPool().query(
    `SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token = $1`,
    [token]
  );
  return res.rows[0] ? rowToUser(res.rows[0]) : undefined;
}

// ---- Invites ----
export async function insertInvite(invite: StoredInvite): Promise<void> {
  const keys = Object.keys(INVITE_FIELD_MAP);
  const columns = ["id", "user_id", "mode", "created_at", ...keys.map((k) => INVITE_FIELD_MAP[k][0])];
  const values = [
    invite.id,
    invite.userId,
    invite.mode,
    invite.createdAt,
    ...keys.map((k) => toParam((invite as any)[k], INVITE_FIELD_MAP[k][1])),
  ];
  const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
  await getPool().query(
    `INSERT INTO invites (${columns.join(", ")}) VALUES (${placeholders})`,
    values
  );
}

export async function findInviteById(id: string): Promise<StoredInvite | undefined> {
  const res = await getPool().query("SELECT * FROM invites WHERE id = $1", [id]);
  const row = res.rows[0];
  if (!row) return undefined;
  if (isExpired(row.event_date, new Date())) {
    await purgeInvite(row);
    return undefined;
  }
  return rowToInvite(row);
}

export async function updateInvite(
  id: string,
  userId: number,
  updates: Partial<Omit<StoredInvite, "id" | "userId" | "mode" | "createdAt">>
): Promise<boolean> {
  const entries = Object.entries(updates).filter(([k]) => k in INVITE_FIELD_MAP);
  if (entries.length === 0) return false;

  const setClauses: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of entries) {
    const [column, isJson] = INVITE_FIELD_MAP[key];
    values.push(toParam(value, isJson));
    setClauses.push(`${column} = $${values.length}`);
  }
  values.push(id, userId);
  const res = await getPool().query(
    `UPDATE invites SET ${setClauses.join(", ")} WHERE id = $${values.length - 1} AND user_id = $${values.length}`,
    values
  );
  return (res.rowCount ?? 0) > 0;
}

export async function listInvitesByUser(userId: number): Promise<StoredInvite[]> {
  await sweepExpiredForUser(userId);
  const res = await getPool().query(
    "SELECT * FROM invites WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return res.rows.map(rowToInvite);
}

export async function deleteInvite(id: string, userId: number): Promise<boolean> {
  // ON DELETE CASCADE (rsvps, tables both reference invites.id) handles the
  // related rows - the photo file itself is deleted by the caller (it knows
  // the invite's imageUrl before calling this).
  const res = await getPool().query("DELETE FROM invites WHERE id = $1 AND user_id = $2", [id, userId]);
  return (res.rowCount ?? 0) > 0;
}

export async function countRsvpsForInvite(inviteId: string): Promise<{ total: number; attending: number }> {
  const res = await getPool().query(
    "SELECT count(*)::int AS total, count(*) FILTER (WHERE attending)::int AS attending FROM rsvps WHERE invite_id = $1",
    [inviteId]
  );
  return { total: res.rows[0].total, attending: res.rows[0].attending };
}

// ---- RSVPs ----
// Resubmitting (someone changes their answer, or the page gets refreshed and
// re-sent) updates their existing response instead of adding a duplicate
// row - matched by phone when given, otherwise by full name, within the
// same invite.
export async function insertRsvp(rsvp: Omit<StoredRsvp, "id" | "createdAt" | "tableId">): Promise<StoredRsvp> {
  const phone = rsvp.phone?.trim();
  const existing = phone
    ? await getPool().query("SELECT id FROM rsvps WHERE invite_id = $1 AND trim(phone) = $2", [rsvp.inviteId, phone])
    : await getPool().query(
        "SELECT id FROM rsvps WHERE invite_id = $1 AND guest_name = $2 AND family_name = $3",
        [rsvp.inviteId, rsvp.guestName, rsvp.familyName]
      );

  if (existing.rows[0]) {
    const res = await getPool().query(
      `UPDATE rsvps SET guest_name=$1, family_name=$2, phone=$3, allergies=$4, attending=$5, guest_count=$6
       WHERE id = $7 RETURNING *`,
      [rsvp.guestName, rsvp.familyName, rsvp.phone, rsvp.allergies, rsvp.attending, rsvp.guestCount, existing.rows[0].id]
    );
    return rowToRsvp(res.rows[0]);
  }

  const res = await getPool().query(
    `INSERT INTO rsvps (invite_id, guest_name, family_name, phone, allergies, attending, guest_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [rsvp.inviteId, rsvp.guestName, rsvp.familyName, rsvp.phone, rsvp.allergies, rsvp.attending, rsvp.guestCount]
  );
  return rowToRsvp(res.rows[0]);
}

export async function listRsvpsByInvite(inviteId: string): Promise<StoredRsvp[]> {
  const res = await getPool().query("SELECT * FROM rsvps WHERE invite_id = $1 ORDER BY created_at ASC", [inviteId]);
  return res.rows.map(rowToRsvp);
}

export async function findRsvpById(rsvpId: number): Promise<StoredRsvp | undefined> {
  const res = await getPool().query("SELECT * FROM rsvps WHERE id = $1", [rsvpId]);
  return res.rows[0] ? rowToRsvp(res.rows[0]) : undefined;
}

// Used by the at-the-door table lookup: one QR code per event, and each
// guest identifies themselves by name to find their own seat - so this
// matches by name within a single invite only, never across events.
export async function findRsvpsByName(inviteId: string, guestName: string, familyName: string): Promise<StoredRsvp[]> {
  const res = await getPool().query(
    `SELECT * FROM rsvps
     WHERE invite_id = $1 AND attending
       AND lower(trim(guest_name)) = lower(trim($2))
       AND lower(trim(family_name)) = lower(trim($3))`,
    [inviteId, guestName, familyName]
  );
  return res.rows.map(rowToRsvp);
}

export async function assignRsvpTable(rsvpId: number, tableId: string | null): Promise<boolean> {
  const res = await getPool().query("UPDATE rsvps SET table_id = $1 WHERE id = $2", [tableId, rsvpId]);
  return (res.rowCount ?? 0) > 0;
}

// ---- Seating tables ----
export async function insertTable(inviteId: string, number: string): Promise<StoredTable> {
  // Table ids were "t<counter>" strings in the old flat-file store - kept
  // the same shape here (per-invite sequence number) rather than switching
  // to a raw serial id, since it's a user-visible-ish identifier.
  const countRes = await getPool().query("SELECT count(*)::int AS n FROM tables WHERE invite_id = $1", [inviteId]);
  const id = `t${inviteId}-${countRes.rows[0].n + 1}`;
  const res = await getPool().query(
    "INSERT INTO tables (id, invite_id, number) VALUES ($1, $2, $3) RETURNING *",
    [id, inviteId, number]
  );
  return rowToTable(res.rows[0]);
}

export async function listTablesByInvite(inviteId: string): Promise<StoredTable[]> {
  const res = await getPool().query("SELECT * FROM tables WHERE invite_id = $1 ORDER BY created_at ASC", [inviteId]);
  return res.rows.map(rowToTable);
}

export async function findTableById(tableId: string): Promise<StoredTable | undefined> {
  const res = await getPool().query("SELECT * FROM tables WHERE id = $1", [tableId]);
  return res.rows[0] ? rowToTable(res.rows[0]) : undefined;
}

export async function deleteTable(tableId: string, inviteId: string): Promise<boolean> {
  // rsvps.table_id has no FK constraint (a table can be deleted without
  // deleting the guests seated at it) - clear it explicitly first.
  await getPool().query("UPDATE rsvps SET table_id = NULL WHERE table_id = $1", [tableId]);
  const res = await getPool().query("DELETE FROM tables WHERE id = $1 AND invite_id = $2", [tableId, inviteId]);
  return (res.rowCount ?? 0) > 0;
}

// ---- Leads (from the "planning an event soon?" widget on guest invites) ----
export async function insertLead(lead: Omit<StoredLead, "id" | "createdAt">): Promise<StoredLead> {
  const res = await getPool().query(
    "INSERT INTO leads (name, phone, source_invite_id) VALUES ($1, $2, $3) RETURNING *",
    [lead.name, lead.phone, lead.sourceInviteId]
  );
  return rowToLead(res.rows[0]);
}

export async function listLeads(): Promise<StoredLead[]> {
  const res = await getPool().query("SELECT * FROM leads ORDER BY created_at DESC");
  return res.rows.map(rowToLead);
}

// Every invite belongs to exactly one event owner and leads are tied to the
// single invite they came from - used so the admin's "contact lead" message
// can name the right event owner without ever mixing up different owners'
// events.
export async function getInviteOwnerUsername(inviteId: string): Promise<string | null> {
  const res = await getPool().query(
    `SELECT u.username FROM users u JOIN invites i ON i.user_id = u.id WHERE i.id = $1`,
    [inviteId]
  );
  return res.rows[0]?.username ?? null;
}

// ---- Super-admin ----
// Only the system operator's own account is admin - matched by username
// rather than "first account created", since test/dev signups during
// development can otherwise end up occupying id 1.
const ADMIN_USERNAMES = ["oren"];

export function isAdminUser(user: { username: string } | null | undefined): boolean {
  return !!user && ADMIN_USERNAMES.includes(user.username.toLowerCase());
}

export async function listAllUsersWithStats(): Promise<Array<{
  id: number;
  username: string;
  createdAt: string;
  inviteCount: number;
  totalAttending: number;
  totalTables: number;
}>> {
  const res = await getPool().query(`
    SELECT
      u.id, u.username, u.created_at,
      count(DISTINCT i.id)::int AS invite_count,
      count(DISTINCT r.id) FILTER (WHERE r.attending)::int AS total_attending,
      count(DISTINCT t.id)::int AS total_tables
    FROM users u
    LEFT JOIN invites i ON i.user_id = u.id
    LEFT JOIN rsvps r ON r.invite_id = i.id
    LEFT JOIN tables t ON t.invite_id = i.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `);
  return res.rows.map((row) => ({
    id: row.id,
    username: row.username,
    createdAt: row.created_at.toISOString(),
    inviteCount: row.invite_count,
    totalAttending: row.total_attending,
    totalTables: row.total_tables,
  }));
}

export async function getUserDetail(userId: number) {
  const userRes = await getPool().query("SELECT * FROM users WHERE id = $1", [userId]);
  if (!userRes.rows[0]) return null;
  const user = rowToUser(userRes.rows[0]);

  const invitesRes = await getPool().query("SELECT * FROM invites WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
  const invitesWithStats = await Promise.all(
    invitesRes.rows.map(async (row) => {
      const inv = rowToInvite(row);
      const statsRes = await getPool().query(
        `SELECT
           count(*)::int AS total_rsvps,
           count(*) FILTER (WHERE attending)::int AS total_attending,
           coalesce(sum(guest_count) FILTER (WHERE attending), 0)::int AS total_guests
         FROM rsvps WHERE invite_id = $1`,
        [inv.id]
      );
      const tablesRes = await getPool().query("SELECT count(*)::int AS n FROM tables WHERE invite_id = $1", [inv.id]);
      return {
        invite: inv,
        totalRsvps: statsRes.rows[0].total_rsvps,
        totalAttending: statsRes.rows[0].total_attending,
        totalGuests: statsRes.rows[0].total_guests,
        totalTables: tablesRes.rows[0].n,
      };
    })
  );
  return { user: { id: user.id, username: user.username, createdAt: user.createdAt }, invites: invitesWithStats };
}

export async function adminUpdateUser(
  userId: number,
  updates: { username?: string; passwordHash?: string }
): Promise<boolean> {
  if (updates.username) {
    const taken = await getPool().query("SELECT 1 FROM users WHERE id <> $1 AND username = $2", [userId, updates.username]);
    if (taken.rows.length > 0) throw new Error("שם המשתמש כבר תפוס");
  }
  const setClauses: string[] = [];
  const values: unknown[] = [];
  if (updates.username) {
    values.push(updates.username);
    setClauses.push(`username = $${values.length}`);
  }
  if (updates.passwordHash) {
    values.push(updates.passwordHash);
    setClauses.push(`password_hash = $${values.length}`);
  }
  if (setClauses.length === 0) return true;
  values.push(userId);
  const res = await getPool().query(`UPDATE users SET ${setClauses.join(", ")} WHERE id = $${values.length}`, values);
  return (res.rowCount ?? 0) > 0;
}

// ---------------------------------------------------------------------
// 14-day cleanup - an invite (and its RSVPs/tables/uploaded photo) is
// purged RETENTION_DAYS_AFTER_EVENT days after eventDate. No cron/scheduler
// service exists for this app, so it runs lazily: whenever an invite is
// looked up (by id, or by owner), check first whether it's already past
// its retention window and delete it before returning anything. Invites
// with a missing/unparseable eventDate are left alone (never destroy data
// over a date that can't be confidently read).
// ---------------------------------------------------------------------

function isExpired(eventDate: string, now: Date): boolean {
  if (!eventDate) return false;
  const eventTime = new Date(eventDate).getTime();
  if (Number.isNaN(eventTime)) return false;
  const cutoff = eventTime + RETENTION_DAYS_AFTER_EVENT * 24 * 60 * 60 * 1000;
  return now.getTime() > cutoff;
}

async function purgeInvite(row: { id: string; image_url?: string }): Promise<void> {
  await getPool().query("DELETE FROM invites WHERE id = $1", [row.id]); // cascades rsvps/tables
  await deleteStoredImage(row.image_url);
}

async function sweepExpiredForUser(userId: number): Promise<void> {
  const res = await getPool().query("SELECT id, event_date, image_url FROM invites WHERE user_id = $1", [userId]);
  const now = new Date();
  for (const row of res.rows) {
    if (isExpired(row.event_date, now)) {
      await purgeInvite(row);
    }
  }
}
