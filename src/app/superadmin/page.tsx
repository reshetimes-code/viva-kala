"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** A second, independent front door into the admin panel: no username, just
 *  the one shared super-admin password (see src/lib/superadmin.ts) - lands
 *  on /admin on success, same as logging in as the oren account does. */
export default function SuperadminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה בהתחברות");
        setLoading(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("שגיאת רשת - נסה שוב");
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logoViva-white.png" alt="VIVA" className="auth-logo" />
          <p>כניסת סופר-אדמין</p>
        </div>

        <div className="login-header">
          <h2 className="login-title">כניסת סופר-אדמין</h2>
          <p className="login-subtitle">גישה ישירה לפאנל ניהול המערכת</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="password"
              className="form-input"
              placeholder="סיסמת סופר-אדמין"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
            <i className="input-icon">🔒</i>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "בודק..." : "כניסה לפאנל הניהול"}
          </button>
        </form>
      </div>
    </div>
  );
}
