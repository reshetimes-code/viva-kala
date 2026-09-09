"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/LanguageProvider";

type AccountType = "individual" | "hall";

const COPY = {
  he: {
    tagline: "האירוע מתחיל כאן",
    title: "יצירת חשבון",
    subtitle: "הרשמו כדי להתחיל ליצור הזמנות",
    individualLabel: "לקוח פרטי",
    individualSub: "יוצר/ת הזמנה לאירוע שלי",
    hallLabel: "אני בעל עסק בתחום הארועים",
    hallSub: "פותח/ת חשבונות ללקוחות שלי",
    signingUpAs: "נרשמים כ",
    changeSuffix: " - ← לשינוי",
    usernamePlaceholder: "בחר שם משתמש",
    passwordPlaceholder: "בחר סיסמה (לפחות 4 תווים)",
    confirmPlaceholder: "אימות סיסמה",
    leadHint: "מומלץ להוסיף את הקישורים הללו שיעזרו לכם ליצור",
    leadHintHighlight: "לידים",
    leadHintEnd: "חדשים",
    youtubePlaceholder: "הוסיפו כאן סרטון פרסום של האולם בקישור מיוטיוב (לא חובה)",
    tourPlaceholder: "קישור לאתר האולם / דף פרסום (לא חובה)",
    laterHint: "אפשר גם להוסיף/לשנות את אלה מאוחר יותר בפאנל האולם.",
    loading: "יוצר חשבון...",
    submit: "הרשמה",
    or: "או",
    haveAccount: "כבר יש לך חשבון?",
    loginLink: "התחברות",
    passwordMismatch: "הסיסמאות אינן תואמות",
    genericError: "שגיאה בהרשמה",
    networkError: "שגיאת רשת - נסה שוב",
  },
  en: {
    tagline: "Where your event begins",
    title: "Create an account",
    subtitle: "Sign up to start creating invitations",
    individualLabel: "Private client",
    individualSub: "Creating an invitation for my own event",
    hallLabel: "I run an events business",
    hallSub: "Opening accounts for my clients",
    signingUpAs: "Signing up as ",
    changeSuffix: " - ← Change",
    usernamePlaceholder: "Choose a username",
    passwordPlaceholder: "Choose a password (at least 4 characters)",
    confirmPlaceholder: "Confirm password",
    leadHint: "We recommend adding these links to help you generate new",
    leadHintHighlight: "leads",
    leadHintEnd: "",
    youtubePlaceholder: "Add a YouTube link to a promo video of your venue (optional)",
    tourPlaceholder: "Link to your venue's website / promo page (optional)",
    laterHint: "You can also add or change these later from the venue panel.",
    loading: "Creating account...",
    submit: "Sign up",
    or: "or",
    haveAccount: "Already have an account?",
    loginLink: "Sign in",
    passwordMismatch: "Passwords do not match",
    genericError: "Sign-up error",
    networkError: "Network error - please try again",
  },
};

export default function SignupPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = COPY[locale];
  // Asked before the form itself, not a field inside it - the two account
  // types are different enough (a hall gets a client-management panel and
  // its guests see the lead-generation popups; a private client's guests
  // never see them - see InviteView's hallAffiliated gating) that picking
  // wrong isn't something to bury in a dropdown.
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  // Hall-only, both optional - can also be set/changed later from
  // dashboard/hall's own settings section, this just saves a hall the trip
  // back there right after signing up if they already have the links handy.
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tourUrl, setTourUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          accountType,
          ...(accountType === "hall" ? { youtubeUrl, tourUrl } : {}),
        }),
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

        {!accountType ? (
          <div className="account-type-picker">
            <button type="button" className="account-type-btn" onClick={() => setAccountType("individual")}>
              <span className="account-type-icon">💌</span>
              <span className="account-type-label">{t.individualLabel}</span>
              <span className="account-type-sub">{t.individualSub}</span>
            </button>
            <button type="button" className="account-type-btn" onClick={() => setAccountType("hall")}>
              <span className="account-type-icon">🏛️</span>
              <span className="account-type-label">{t.hallLabel}</span>
              <span className="account-type-sub">{t.hallSub}</span>
            </button>
          </div>
        ) : (
        <form onSubmit={handleSubmit}>
          <button type="button" className="account-type-back" onClick={() => setAccountType(null)}>
            {t.signingUpAs}
            {accountType === "hall" ? t.hallLabel : t.individualLabel}
            {t.changeSuffix}
          </button>
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
              placeholder={t.confirmPlaceholder}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={4}
              required
            />
            <i className="input-icon">🔒</i>
          </div>

          {accountType === "hall" && (
            <>
              <p className="account-type-hint account-type-hint-lead">
                {t.leadHint} <span className="account-type-hint-highlight">{t.leadHintHighlight}</span> {t.leadHintEnd}
              </p>
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder={t.youtubePlaceholder}
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  dir="ltr"
                />
                <i className="input-icon">🎥</i>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder={t.tourPlaceholder}
                  value={tourUrl}
                  onChange={(e) => setTourUrl(e.target.value)}
                  dir="ltr"
                />
                <i className="input-icon">🔗</i>
              </div>
              {/* Both are also editable any time from ⚙️ הגדרות אולם in the
                  hall panel - saying so here so leaving them blank now
                  doesn't feel like a missed one-time chance. */}
              <p className="account-type-hint">{t.laterHint}</p>
            </>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? t.loading : t.submit}
          </button>
        </form>
        )}

        <div className="divider">
          <span>{t.or}</span>
        </div>

        <div className="register-link-row">
          {t.haveAccount} <Link href="/login">{t.loginLink}</Link>
        </div>
      </div>
    </div>
  );
}
