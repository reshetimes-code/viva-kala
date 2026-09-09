"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/LanguageProvider";

const COPY = {
  he: {
    brandTagline: "כניסת סופר-אדמין",
    title: "כניסת סופר-אדמין",
    subtitle: "גישה ישירה לפאנל ניהול המערכת",
    passwordPlaceholder: "סיסמת סופר-אדמין",
    loading: "בודק...",
    submit: "כניסה לפאנל הניהול",
    loginError: "שגיאה בהתחברות",
    networkError: "שגיאת רשת - נסה שוב",
  },
  en: {
    brandTagline: "Super-admin login",
    title: "Super-admin login",
    subtitle: "Direct access to the system management panel",
    passwordPlaceholder: "Super-admin password",
    loading: "Checking...",
    submit: "Sign in to the admin panel",
    loginError: "Login error",
    networkError: "Network error - please try again",
  },
};

/** A second, independent front door into the admin panel: no username, just
 *  the one shared super-admin password (see src/lib/superadmin.ts) - lands
 *  on /admin on success, same as logging in as the oren account does. */
export default function SuperadminLoginPage() {
  const { locale } = useLocale();
  const t = COPY[locale];
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
        setError(data.error || t.loginError);
        setLoading(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError(t.networkError);
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logoViva-white.png" alt="VIVA" className="auth-logo" />
          <p>{t.brandTagline}</p>
        </div>

        <div className="login-header">
          <h2 className="login-title">{t.title}</h2>
          <p className="login-subtitle">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="password"
              className="form-input"
              placeholder={t.passwordPlaceholder}
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
            {loading ? t.loading : t.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
