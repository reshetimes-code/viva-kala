import { Pool } from "pg";

// Single shared pool for the whole server process. DATABASE_URL differs by
// environment but the app never needs to know which: locally (via the Cloud
// SQL Auth Proxy) it's a plain TCP connection string; on Cloud Run it's the
// Unix-socket form (postgresql://user:pass@/db?host=/cloudsql/CONNECTION_NAME).
let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = new Pool({ connectionString, max: 5 });
  }
  return pool;
}

// No migration runner exists in this app (schema.sql is only applied once,
// by hand, when a fresh database is provisioned) - a column added there
// after the fact never reaches an already-running production database.
// This lazily/idempotently adds it at runtime instead, so a fresh deploy of
// existing infrastructure self-heals without a manual `ALTER TABLE` step.
// Cached as a promise (not a boolean) so concurrent callers before the
// first one resolves all await the same in-flight query instead of each
// firing their own.
let userQuotaColumnReady: Promise<void> | undefined;

export function ensureUserQuotaColumn(): Promise<void> {
  if (!userQuotaColumnReady) {
    userQuotaColumnReady = getPool()
      .query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS image_regenerations_used INTEGER NOT NULL DEFAULT 0`)
      .then(() => undefined)
      .catch((err) => {
        // Don't cache a rejected promise - a transient DB error here
        // shouldn't permanently wedge every future call into failing.
        userQuotaColumnReady = undefined;
        throw err;
      });
  }
  return userQuotaColumnReady;
}

// Same lazy/idempotent self-heal as ensureUserQuotaColumn above, for the
// hall-account feature: account_type distinguishes a self-signed-up private
// client from an event hall; hall_id (set only on a client account a hall
// created through its own panel) is how a client's invite is traced back to
// "its" hall for the lead-popup gating and the hall's own client list;
// youtube_url/tour_url are the hall's own two optional settings (promo
// video, virtual-tour link) - meaningful only on a hall's own row, read via
// the client's hall_id.
let hallColumnsReady: Promise<void> | undefined;

export function ensureHallColumns(): Promise<void> {
  if (!hallColumnsReady) {
    hallColumnsReady = getPool()
      .query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'individual';
         ALTER TABLE users ADD COLUMN IF NOT EXISTS hall_id INTEGER REFERENCES users(id);
         ALTER TABLE users ADD COLUMN IF NOT EXISTS youtube_url TEXT;
         ALTER TABLE users ADD COLUMN IF NOT EXISTS tour_url TEXT;`
      )
      .then(() => undefined)
      .catch((err) => {
        hallColumnsReady = undefined;
        throw err;
      });
  }
  return hallColumnsReady;
}
