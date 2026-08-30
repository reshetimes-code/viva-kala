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
