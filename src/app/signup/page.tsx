"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה בהרשמה");
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
          <h2 className="login-title">יצירת חשבון</h2>
          <p className="login-subtitle">הרשמו כדי להתחיל ליצור הזמנות</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="בחר שם משתמש"
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
              placeholder="בחר סיסמה (לפחות 4 תווים)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={4}
              required
            />
            <i className="input-icon">🔒</i>
          </div>

          <div className="form-group">
            <input
              type="password"
              className="form-input"
              placeholder="אימות סיסמה"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={4}
              required
            />
            <i className="input-icon">🔒</i>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "יוצר חשבון..." : "הרשמה"}
          </button>
        </form>

        <div className="divider">
          <span>או</span>
        </div>

        <div className="register-link-row">
          כבר יש לך חשבון? <Link href="/login">התחברות</Link>
        </div>
      </div>
    </div>
  );
}
