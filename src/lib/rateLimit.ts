import type { NextRequest } from "next/server";

// Same in-memory, per-IP throttle already proven in production for the
// superadmin login (see superadmin.ts's own attempts map) - a factory here
// so the regular login route (which had NO throttling at all until this)
// gets its own independent counter without touching that working code.
// Safe under the same assumption: this service runs as a single Cloud Run
// instance (min=max=1), so an in-memory Map is as reliable as a DB table
// for as long as the instance stays up - worst case on a restart or a
// future multi-instance scale-out is a weaker limit, never a broken one
// (nothing here can throw or return anything other than true/false).
export function createRateLimiter(maxAttempts: number, windowMs: number) {
  const attempts = new Map<string, { count: number; resetAt: number }>();

  return {
    isLimited(key: string): boolean {
      const rec = attempts.get(key);
      if (!rec || rec.resetAt < Date.now()) return false;
      return rec.count >= maxAttempts;
    },
    recordFailure(key: string): void {
      const now = Date.now();
      const rec = attempts.get(key);
      if (!rec || rec.resetAt < now) {
        attempts.set(key, { count: 1, resetAt: now + windowMs });
      } else {
        rec.count += 1;
      }
    },
    clear(key: string): void {
      attempts.delete(key);
    },
  };
}

// Cloud Run sits behind Google's front end, which sets this - falls back to
// a constant bucket locally (dev never needs real per-IP throttling).
export function clientIp(req: NextRequest | Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
