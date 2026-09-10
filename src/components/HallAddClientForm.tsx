"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/LanguageProvider";
import { clientAccountWhatsappHref } from "@/lib/waContact";

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
    createdTitle: "✓ החשבון נוצר!",
    createdHint: "עכשיו שלחו ללקוח את הפרטים כדי שיוכל להיכנס ולהתחיל ליצור הזמנה ושולחנות.",
    sendWhatsapp: "💬 שליחת הפרטים בוואטסאפ",
    done: "סיימתי",
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
    createdTitle: "✓ Account created!",
    createdHint: "Now send the client their details so they can log in and start creating an invitation and tables.",
    sendWhatsapp: "💬 Send details via WhatsApp",
    done: "Done",
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
  // Kept after a successful create so the WhatsApp-send step below still has
  // the credentials to put in the message, even once the form fields
  // themselves are cleared for next time.
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null);

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
      setCreated({ username, password });
      setUsername("");
      setPassword("");
      router.refresh();
    } catch {
      setError(t.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDone() {
    setCreated(null);
    setOpen(false);
  }

  if (created) {
    return (
      <div className="hall-add-client-form hall-client-created">
        <p className="hall-client-created-title">{t.createdTitle}</p>
        <p className="hall-client-created-hint">{t.createdHint}</p>
        <a
          className="hall-save-btn hall-client-wa-btn"
          href={clientAccountWhatsappHref(created.username, created.password, locale)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.sendWhatsapp}
        </a>
        <button type="button" className="hall-cancel-btn" onClick={handleDone}>
          {t.done}
        </button>
      </div>
    );
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
