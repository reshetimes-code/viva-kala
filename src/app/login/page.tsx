"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה בהתחברות");
        setLoading(false);
        return;
      }
      router.replace("/dashboard");
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
          <p>האירוע מתחיל כאן</p>
        </div>

        <div className="login-header">
          <h2 className="login-title">כניסה למערכת</h2>
          <p className="login-subtitle">התחברו ותתחילו ליצור הזמנות</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="שם משתמש"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
            <i className="input-icon">👤</i>
          </div>

          <div className="form-group">
            <input
              type="password"
              className="form-input"
              placeholder="סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              minLength={4}
              required
            />
            <i className="input-icon">🔒</i>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "מתחבר..." : "התחברות למערכת"}
          </button>
        </form>

        <div className="divider">
          <span>או</span>
        </div>

        <div className="register-link-row">
          אין לך חשבון? <Link href="/signup">הרשמה למערכת</Link>
        </div>
      </div>
    </div>
  );
}
