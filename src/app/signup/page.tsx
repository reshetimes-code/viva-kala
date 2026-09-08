"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AccountType = "individual" | "hall";

export default function SignupPage() {
  const router = useRouter();
  // Asked before the form itself, not a field inside it - the two account
  // types are different enough (a hall gets a client-management panel and
  // its guests see the lead-generation popups; a private client's guests
  // never see them - see InviteView's hallAffiliated gating) that picking
  // wrong isn't something to bury in a dropdown.
  const [accountType, setAccountType] = useState<AccountType | null>(null);
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
        body: JSON.stringify({ username, password, accountType }),
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

        {!accountType ? (
          <div className="account-type-picker">
            <button type="button" className="account-type-btn" onClick={() => setAccountType("individual")}>
              <span className="account-type-icon">💌</span>
              <span className="account-type-label">לקוח פרטי</span>
              <span className="account-type-sub">יוצר/ת הזמנה לאירוע שלי</span>
            </button>
            <button type="button" className="account-type-btn" onClick={() => setAccountType("hall")}>
              <span className="account-type-icon">🏛️</span>
              <span className="account-type-label">אולם אירועים</span>
              <span className="account-type-sub">פותח/ת חשבונות ללקוחות שלי</span>
            </button>
          </div>
        ) : (
        <form onSubmit={handleSubmit}>
          <button type="button" className="account-type-back" onClick={() => setAccountType(null)}>
            ← {accountType === "hall" ? "אולם אירועים" : "לקוח פרטי"}, לא נכון?
          </button>
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
        )}

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
