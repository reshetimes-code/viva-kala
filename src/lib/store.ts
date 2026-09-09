import type { EventCategory } from "@/lib/eventCategories";
import { getPool, ensureUserQuotaColumn, ensureHallColumns } from "@/lib/db";
import { deleteStoredImage } from "@/lib/imageStorage";

// How long a past event's invite (and its RSVPs/tables/uploaded photo) is
// kept around after the event date before the lazy sweep below purges it.
const RETENTION_DAYS_AFTER_EVENT = 14;

export interface StoredUser {
  id: number;
  username: string;
  passwordHash: string;
  createdAt: string;
  /** "individual" (the ordinary self-signup client, unrelated to any hall)
   *  or "hall" (an event hall's own account - gets the hall management
   *  panel and its two lead-flow settings below). */
  accountType: "individual" | "hall";
  /** Set only on a client account created BY a hall through its own panel -
   *  points at that hall's own user id. Undefined for every self-signup
   *  account (both "individual" and "hall" ones) - a hall's OWN invites (if
   *  it ever makes one directly) use its own id via accountType==="hall"
   *  instead of this. */
  hallId?: number;
  /** Hall-only settings (undefined/empty for an "individual" account) - the
   *  lead-popup's optional promo video and virtual-tour link, read via a
   *  client invite's owner's hallId. */
  youtubeUrl?: string;
  tourUrl?: string;
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
  /** Max seats at this table - null/undefined means no limit set. */
  capacity: number | null;
  createdAt: string;
}

export interface StoredLead {
  id: number;
  name: string;
  phone: string;
  sourceInviteId: string;
  /** The date they mentioned for their own upcoming event ("מה התאריך?"
   *  in the RSVP screen's cross-sell popup) - optional, free text. */
  eventDate: string;
  /** What kind of event they're planning ("סוג האירוע?" in the same popup) -
   *  optional, one of a fixed short list (חתונה/בר מצווה/ברית/אחר). */
  eventType: string;
  /** Which venue ("איזה אולם?" in the same popup) - optional, free text. */
  eventVenue: string;
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
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    createdAt: row.created_at.toISOString(),
    accountType: row.account_type === "hall" ? "hall" : "individual",
    hallId: row.hall_id ?? undefined,
    youtubeUrl: row.youtube_url ?? undefined,
    tourUrl: row.tour_url ?? undefined,
  };
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
  return {
    id: row.id,
    inviteId: row.invite_id,
    number: row.number,
    capacity: row.capacity ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

function rowToLead(row: any): StoredLead {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    sourceInviteId: row.source_invite_id,
    eventDate: row.event_date ?? "",
    eventType: row.event_type ?? "",
    eventVenue: row.event_venue ?? "",
    createdAt: row.created_at.toISOString(),
  };
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

export async function insertUser(
  username: string,
  passwordHash: string,
  options?: { accountType?: "individual" | "hall"; hallId?: number }
): Promise<StoredUser> {
  await ensureHallColumns();
  const res = await getPool().query(
    "INSERT INTO users (username, password_hash, account_type, hall_id) VALUES ($1, $2, $3, $4) RETURNING *",
    [username, passwordHash, options?.accountType ?? "individual", options?.hallId ?? null]
  );
  return rowToUser(res.rows[0]);
}

// ---- Hall accounts ----

/** The hall a given invite's guest-facing lead popups should behave as -
 *  the invite owner's own row if they're a hall themselves (accountType
 *  "hall", making an invite directly), or the hall that created their
 *  account (hallId) if they're one of that hall's clients. undefined for a
 *  plain self-signup "individual" account with no hall at all - the caller
 *  (the invite page) takes that as "no lead popups for this invite". */
export async function getHallForUser(user: StoredUser): Promise<StoredUser | undefined> {
  if (user.accountType === "hall") return user;
  if (!user.hallId) return undefined;
  return findUserById(user.hallId);
}

export async function updateHallSettings(
  hallUserId: number,
  updates: { youtubeUrl?: string; tourUrl?: string }
): Promise<void> {
  await ensureHallColumns();
  await getPool().query("UPDATE users SET youtube_url = $1, tour_url = $2 WHERE id = $3 AND account_type = 'hall'", [
    updates.youtubeUrl?.trim() || null,
    updates.tourUrl?.trim() || null,
    hallUserId,
  ]);
}

/** One row per client account a hall created through its own panel, each
 *  paired with that client's own invite (a client account only ever has the
 *  one invite the hall set them up to build - same "one invite per account"
 *  assumption the rest of the dashboard already makes) and RSVP/table
 *  counts, so the hall panel's table can render entirely from one call. */
export interface HallClientRow {
  userId: number;
  username: string;
  createdAt: string;
  invite?: StoredInvite;
  rsvpCounts: { total: number; attending: number };
  tableCount: number;
}

export async function listClientsForHall(hallUserId: number): Promise<HallClientRow[]> {
  await ensureHallColumns();
  const usersRes = await getPool().query(
    "SELECT * FROM users WHERE hall_id = $1 ORDER BY created_at DESC",
    [hallUserId]
  );
  const clients = usersRes.rows.map(rowToUser);
  return Promise.all(
    clients.map(async (c) => {
      const invites = await listInvitesByUser(c.id);
      const invite = invites[0];
      const rsvpCounts = invite ? await countRsvpsForInvite(invite.id) : { total: 0, attending: 0 };
      const tableCount = invite ? (await listTablesByInvite(invite.id)).length : 0;
      return { userId: c.id, username: c.username, createdAt: c.createdAt, invite, rsvpCounts, tableCount };
    })
  );
}

/** Every lead generated by any of this hall's clients' invites - same shape
 *  as the leads a hall would see for its own direct invite, just widened to
 *  "any invite belonging to one of my clients" via a join instead of one
 *  fixed sourceInviteId. */
export async function listLeadsForHall(hallUserId: number): Promise<StoredLead[]> {
  await ensureHallColumns();
  const res = await getPool().query(
    `SELECT leads.* FROM leads
     JOIN invites ON invites.id = leads.source_invite_id
     JOIN users ON users.id = invites.user_id
     WHERE users.hall_id = $1
     ORDER BY leads.created_at DESC`,
    [hallUserId]
  );
  return res.rows.map(rowToLead);
}

// AI design-generation quota - counts only genuinely new designs (the
// guided form and the AI-designer chat), never a text-only correction of an
// existing image (see /api/ai-invite's own baseImage check for why that
// split lives there, not here). Kept as a running per-account total with no
// reset - see MAX_IMAGE_REGENERATIONS in the route for the actual cap.
export async function getUserImageRegenerationsUsed(userId: number): Promise<number> {
  await ensureUserQuotaColumn();
  const res = await getPool().query("SELECT image_regenerations_used FROM users WHERE id = $1", [userId]);
  return res.rows[0]?.image_regenerations_used ?? 0;
}

export async function incrementUserImageRegenerations(userId: number): Promise<number> {
  await ensureUserQuotaColumn();
  const res = await getPool().query(
    "UPDATE users SET image_regenerations_used = image_regenerations_used + 1 WHERE id = $1 RETURNING image_regenerations_used",
    [userId]
  );
  return res.rows[0]?.image_regenerations_used ?? 0;
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

// Thrown by insertRsvp when a phone number already on file for this invite
// is being resubmitted under a different name - see the doc comment on
// insertRsvp for why this has to be a hard stop rather than a silent
// overwrite. The route layer turns this into the "that phone number is
// already registered" message.
export class RsvpPhoneConflictError extends Error {
  constructor() {
    super("Phone number already registered under a different name for this invite");
    this.name = "RsvpPhoneConflictError";
  }
}

function sameGuestIdentity(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// Resubmitting (someone changes their answer, or the page gets refreshed and
// re-sent) updates their existing response instead of adding a duplicate
// row - but ONLY when it's genuinely the same guest doing it. Name+phone
// together are that guest's identity for the rest of the event (the door
// scanner matches on both - see findRsvpByIdentity below), so once a phone
// number is on file here it can only ever be resubmitted under the exact
// same name; a different name with that phone is refused outright rather
// than quietly overwriting the original guest's row (and, worse, whatever
// table they'd already been assigned). The only sanctioned way to correct a
// guest's own name/phone/table after the fact is the event owner editing it
// directly in their dashboard (PATCH /api/rsvp/[rsvpId]), never this
// guest-facing endpoint.
export async function insertRsvp(rsvp: Omit<StoredRsvp, "id" | "createdAt" | "tableId">): Promise<StoredRsvp> {
  const phone = rsvp.phone?.trim();

  // The route layer requires a phone number before ever calling this - an
  // empty one here would make every blank-phone row (legacy data from
  // before phone was mandatory) match every other one via trim(phone)=''
  // below, so treat it as "no identity to match against" and just insert.
  if (!phone) {
    const res = await getPool().query(
      `INSERT INTO rsvps (invite_id, guest_name, family_name, phone, allergies, attending, guest_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [rsvp.inviteId, rsvp.guestName, rsvp.familyName, rsvp.phone, rsvp.allergies, rsvp.attending, rsvp.guestCount]
    );
    return rowToRsvp(res.rows[0]);
  }

  const existing = await getPool().query(
    "SELECT id, guest_name, family_name FROM rsvps WHERE invite_id = $1 AND trim(phone) = $2",
    [rsvp.inviteId, phone]
  );

  if (existing.rows[0]) {
    const row = existing.rows[0];
    if (!sameGuestIdentity(row.guest_name, rsvp.guestName) || !sameGuestIdentity(row.family_name, rsvp.familyName)) {
      throw new RsvpPhoneConflictError();
    }
    const res = await getPool().query(
      `UPDATE rsvps SET guest_name=$1, family_name=$2, phone=$3, allergies=$4, attending=$5, guest_count=$6
       WHERE id = $7 RETURNING *`,
      [rsvp.guestName, rsvp.familyName, rsvp.phone, rsvp.allergies, rsvp.attending, rsvp.guestCount, row.id]
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
// guest identifies themselves by name AND phone together to find their own
// seat - the same name+phone pair insertRsvp() locked in as their identity
// when they RSVP'd. Requiring all three to match (not name alone) is
// deliberate: it's the only thing stopping someone from typing in another
// guest's name with a different phone (or vice versa) and landing on that
// guest's table. A mismatch on any one field returns no rows, same as a
// mismatch on all three - the caller shows one generic "check what you
// typed" message either way, never which field was wrong.
export async function findRsvpByIdentity(
  inviteId: string,
  guestName: string,
  familyName: string,
  phone: string
): Promise<StoredRsvp[]> {
  const res = await getPool().query(
    `SELECT * FROM rsvps
     WHERE invite_id = $1 AND attending
       AND lower(trim(guest_name)) = lower(trim($2))
       AND lower(trim(family_name)) = lower(trim($3))
       AND trim(phone) = trim($4)`,
    [inviteId, guestName, familyName, phone]
  );
  return res.rows.map(rowToRsvp);
}

export async function assignRsvpTable(rsvpId: number, tableId: string | null): Promise<boolean> {
  const res = await getPool().query("UPDATE rsvps SET table_id = $1 WHERE id = $2", [tableId, rsvpId]);
  return (res.rowCount ?? 0) > 0;
}

// Admin-only raw edit/delete of a guest's own RSVP row - deliberately NOT
// routed through insertRsvp's name+phone identity lock (see its doc comment):
// that lock exists to stop a *guest* from silently overriding another
// guest's registration through the public RSVP form, not to stop the site
// operator's own support tool from fixing a typo or removing a duplicate on
// the event owner's behalf.
export async function updateRsvpDetails(
  rsvpId: number,
  updates: Partial<Pick<StoredRsvp, "guestName" | "familyName" | "phone" | "attending" | "guestCount">>
): Promise<StoredRsvp | undefined> {
  const fieldMap: Record<string, string> = {
    guestName: "guest_name",
    familyName: "family_name",
    phone: "phone",
    attending: "attending",
    guestCount: "guest_count",
  };
  const entries = Object.entries(updates).filter(([k]) => k in fieldMap);
  if (entries.length === 0) return findRsvpById(rsvpId);

  const setClauses: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of entries) {
    values.push(value);
    setClauses.push(`${fieldMap[key]} = $${values.length}`);
  }
  values.push(rsvpId);
  const res = await getPool().query(
    `UPDATE rsvps SET ${setClauses.join(", ")} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return res.rows[0] ? rowToRsvp(res.rows[0]) : undefined;
}

export async function deleteRsvp(rsvpId: number): Promise<boolean> {
  const res = await getPool().query("DELETE FROM rsvps WHERE id = $1", [rsvpId]);
  return (res.rowCount ?? 0) > 0;
}

// ---- Seating tables ----
export async function insertTable(inviteId: string, number: string, capacity?: number | null): Promise<StoredTable> {
  // Table ids were "t<counter>" strings in the old flat-file store - kept
  // the same shape here (per-invite sequence number) rather than switching
  // to a raw serial id, since it's a user-visible-ish identifier.
  const countRes = await getPool().query("SELECT count(*)::int AS n FROM tables WHERE invite_id = $1", [inviteId]);
  const id = `t${inviteId}-${countRes.rows[0].n + 1}`;
  const res = await getPool().query(
    "INSERT INTO tables (id, invite_id, number, capacity) VALUES ($1, $2, $3, $4) RETURNING *",
    [id, inviteId, number, capacity ?? null]
  );
  return rowToTable(res.rows[0]);
}

export async function updateTableCapacity(tableId: string, capacity: number | null): Promise<StoredTable | undefined> {
  const res = await getPool().query(
    "UPDATE tables SET capacity = $1 WHERE id = $2 RETURNING *",
    [capacity, tableId]
  );
  return res.rows[0] ? rowToTable(res.rows[0]) : undefined;
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
    "INSERT INTO leads (name, phone, source_invite_id, event_date, event_type, event_venue) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [lead.name, lead.phone, lead.sourceInviteId, lead.eventDate, lead.eventType, lead.eventVenue]
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
  aiAttempts: number;
}>> {
  await ensureUserQuotaColumn();
  const res = await getPool().query(`
    SELECT
      u.id, u.username, u.created_at, u.image_regenerations_used,
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
    aiAttempts: row.image_regenerations_used,
  }));
}

// Shared by getUserDetail (one account) and listAllUsersFullDetail (every
// account, for the main admin listing) so both surfaces show exactly the
// same shape of data - full RSVP rows and tables per invite (not just
// counts), plus every lead generated by any of this account's invites.
async function buildUserFullDetail(user: StoredUser, aiAttempts: number) {
  const invitesRes = await getPool().query("SELECT * FROM invites WHERE user_id = $1 ORDER BY created_at DESC", [
    user.id,
  ]);
  const invites = await Promise.all(
    invitesRes.rows.map(async (row) => {
      const inv = rowToInvite(row);
      const [rsvps, tables] = await Promise.all([listRsvpsByInvite(inv.id), listTablesByInvite(inv.id)]);
      const totalAttending = rsvps.filter((r) => r.attending).length;
      const totalGuests = rsvps.filter((r) => r.attending).reduce((sum, r) => sum + (r.guestCount ?? 1), 0);
      return {
        invite: inv,
        rsvps,
        tables,
        totalRsvps: rsvps.length,
        totalAttending,
        totalGuests,
        totalTables: tables.length,
      };
    })
  );

  const leadsRes = await getPool().query(
    `SELECT leads.* FROM leads
     JOIN invites ON invites.id = leads.source_invite_id
     WHERE invites.user_id = $1
     ORDER BY leads.created_at DESC`,
    [user.id]
  );
  const leads = leadsRes.rows.map(rowToLead);

  return {
    user: { id: user.id, username: user.username, createdAt: user.createdAt, aiAttempts },
    invites,
    leads,
  };
}

export type AdminUserFullDetail = Awaited<ReturnType<typeof buildUserFullDetail>>;

export async function getUserDetail(userId: number): Promise<AdminUserFullDetail | null> {
  await ensureUserQuotaColumn();
  const userRes = await getPool().query("SELECT * FROM users WHERE id = $1", [userId]);
  if (!userRes.rows[0]) return null;
  return buildUserFullDetail(rowToUser(userRes.rows[0]), userRes.rows[0].image_regenerations_used ?? 0);
}

// Powers the main admin listing - every account, each already carrying its
// full guest list/tables/leads so opening an accordion row needs no extra
// round trip. Fine to fetch eagerly for every account at once here: this is
// an internal operator tool, not guest-facing traffic.
export async function listAllUsersFullDetail(): Promise<AdminUserFullDetail[]> {
  await ensureUserQuotaColumn();
  const usersRes = await getPool().query("SELECT * FROM users ORDER BY created_at DESC");
  return Promise.all(
    usersRes.rows.map((row) => buildUserFullDetail(rowToUser(row), row.image_regenerations_used ?? 0))
  );
}

export async function adminUpdateUser(
  userId: number,
  updates: { username?: string; passwordHash?: string }
): Promise<boolean> {
  if (updates.username) {
    const taken = await getPool().query("SELECT 1 FROM users WHERE id <> $1 AND username = $2", [userId, updates.username]);
    // Stable code, not user-facing text - the route/page catching this picks
    // a Hebrew/English message for it based on the request's UI language.
    if (taken.rows.length > 0) throw new Error("USERNAME_TAKEN");
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

// Deletes the account itself and, via ON DELETE CASCADE, every invite it
// owns along with those invites' rsvps/tables/sessions - only the uploaded
// photo files (not represented by a DB row) need cleaning up explicitly
// here, same as the lazy 14-day sweep's purgeInvite() does per-invite.
export async function adminDeleteUser(userId: number): Promise<boolean> {
  const imagesRes = await getPool().query(
    "SELECT image_url FROM invites WHERE user_id = $1 AND image_url <> ''",
    [userId]
  );
  const res = await getPool().query("DELETE FROM users WHERE id = $1", [userId]);
  if ((res.rowCount ?? 0) === 0) return false;
  await Promise.all(imagesRes.rows.map((row) => deleteStoredImage(row.image_url)));
  return true;
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
