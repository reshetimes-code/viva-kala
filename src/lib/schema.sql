-- Postgres schema for kala-invites (VIVA), mirroring the shapes previously
-- kept in the flat data/store.json file (see src/lib/store.ts). IDs that the
-- app already generates itself (invites.id via crypto.randomBytes, tables.id
-- as "t<n>") stay app-generated TEXT primary keys rather than becoming
-- SERIAL, so nothing about how callers create rows has to change.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invites (
  id               TEXT PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode             TEXT NOT NULL,
  invited_as       TEXT NOT NULL DEFAULT '',
  party_type       TEXT NOT NULL DEFAULT '',
  celebrants       JSONB NOT NULL DEFAULT '[]',
  will_be          TEXT NOT NULL DEFAULT '',
  event_date       TEXT NOT NULL DEFAULT '',
  event_start      TEXT NOT NULL DEFAULT '',
  meet_at          TEXT NOT NULL DEFAULT '',
  address          TEXT NOT NULL DEFAULT '',
  show_nav_btn     BOOLEAN NOT NULL DEFAULT false,
  img_or_be        TEXT NOT NULL DEFAULT '',
  glad_see         TEXT NOT NULL DEFAULT '',
  notes            TEXT NOT NULL DEFAULT '',
  image_url        TEXT NOT NULL DEFAULT '',
  template_id      TEXT,
  template_fields  JSONB,
  want_rsvp        BOOLEAN NOT NULL DEFAULT false,
  event_category   TEXT,
  category_fields  JSONB,
  text_style       JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invites_user_id_idx ON invites(user_id);

CREATE TABLE IF NOT EXISTS rsvps (
  id           SERIAL PRIMARY KEY,
  invite_id    TEXT NOT NULL REFERENCES invites(id) ON DELETE CASCADE,
  guest_name   TEXT NOT NULL DEFAULT '',
  family_name  TEXT NOT NULL DEFAULT '',
  phone        TEXT NOT NULL DEFAULT '',
  allergies    TEXT NOT NULL DEFAULT '',
  attending    BOOLEAN NOT NULL DEFAULT false,
  guest_count  INTEGER NOT NULL DEFAULT 1,
  table_id     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rsvps_invite_id_idx ON rsvps(invite_id);

CREATE TABLE IF NOT EXISTS tables (
  id         TEXT PRIMARY KEY,
  invite_id  TEXT NOT NULL REFERENCES invites(id) ON DELETE CASCADE,
  number     TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tables_invite_id_idx ON tables(invite_id);

CREATE TABLE IF NOT EXISTS leads (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL DEFAULT '',
  phone            TEXT NOT NULL DEFAULT '',
  source_invite_id TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
