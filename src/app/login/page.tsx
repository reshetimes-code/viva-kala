"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/LanguageProvider";

const COPY = {
  he: {
    tagline: "האירוע מתחיל כאן",
    title: "כניסה למערכת",
    subtitle: "התחברו ותתחילו ליצור הזמנות",
    usernamePlaceholder: "שם משתמש",
    passwordPlaceholder: "סיסמה",
    loading: "מתחבר...",
    submit: "התחברות למערכת",
    or: "או",
    signupLink: "הרשמה למערכת",
    genericError: "שגיאה בהתחברות",
    networkError: "שגיאת רשת - נסה שוב",
  },
  en: {
    tagline: "Where your event begins",
    title: "Sign in",
    subtitle: "Sign in and start creating invitations",
    usernamePlaceholder: "Username",
    passwordPlaceholder: "Password",
    loading: "Signing in...",
    submit: "Sign in",
    or: "or",
    signupLink: "Create one",
    genericError: "Sign-in error",
    networkError: "Network error - please try again",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = COPY[locale];
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
        setError(data.error || t.genericError);
        setLoading(false);
        return;
      }
      router.replace("/dashboard");
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
          <p>{t.tagline}</p>
        </div>

        <div className="login-header">
          <h2 className="login-title">{t.title}</h2>
          <p className="login-subtitle">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder={t.usernamePlaceholder}
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
              placeholder={t.passwordPlaceholder}
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
            {loading ? t.loading : t.submit}
          </button>
        </form>

        <div className="divider">
          <span>{t.or}</span>
        </div>

        <Link href="/signup" className="signup-button">
          {t.signupLink}
        </Link>
      </div>
    </div>
  );
}
