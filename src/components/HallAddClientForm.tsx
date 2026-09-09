"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/LanguageProvider";

const COPY = {
  he: {
    openBtn: "➕ פתיחת חשבון ללקוח חדש",
    usernameLabel: "שם משתמש ללקוח",
    passwordLabel: "סיסמה (לפחות 4 תווים)",
    creating: "יוצר...",
    create: "יצירת חשבון",
    cancel: "ביטול",
    genericError: "שגיאה ביצירת חשבון",
    networkError: "שגיאת רשת - נסה שוב",
  },
  en: {
    openBtn: "➕ Open a new client account",
    usernameLabel: "Client username",
    passwordLabel: "Password (at least 4 characters)",
    creating: "Creating...",
    create: "Create account",
    cancel: "Cancel",
    genericError: "Error creating account",
    networkError: "Network error - please try again",
  },
};

/** "האולם יפתח ללקוח חשבון דרך הפאנל הפנימי שלו" - the hall types in a
 *  username+password for the client right here (handed to the client
 *  outside this app, by the hall itself) instead of the client ever seeing
 *  a signup form. */
export default function HallAddClientForm() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = COPY[locale];
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/hall/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.genericError);
        setSubmitting(false);
        return;
      }
      setUsername("");
      setPassword("");
      setOpen(false);
      router.refresh();
    } catch {
      setError(t.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="hall-add-client-btn" onClick={() => setOpen(true)}>
        {t.openBtn}
      </button>
    );
  }

  return (
    <form className="hall-add-client-form" onSubmit={handleSubmit}>
      <div className="admin-edit-field">
        <label>{t.usernameLabel}</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
      </div>
      <div className="admin-edit-field">
        <label>{t.passwordLabel}</label>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={4}
          required
        />
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="hall-add-client-actions">
        <button type="submit" className="hall-save-btn" disabled={submitting}>
          {submitting ? t.creating : t.create}
        </button>
        <button type="button" className="hall-cancel-btn" onClick={() => setOpen(false)}>
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
