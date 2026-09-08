"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** "האולם יפתח ללקוח חשבון דרך הפאנל הפנימי שלו" - the hall types in a
 *  username+password for the client right here (handed to the client
 *  outside this app, by the hall itself) instead of the client ever seeing
 *  a signup form. */
export default function HallAddClientForm() {
  const router = useRouter();
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
        setError(data.error || "שגיאה ביצירת חשבון");
        setSubmitting(false);
        return;
      }
      setUsername("");
      setPassword("");
      setOpen(false);
      router.refresh();
    } catch {
      setError("שגיאת רשת - נסה שוב");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="hall-add-client-btn" onClick={() => setOpen(true)}>
        ➕ פתיחת חשבון ללקוח חדש
      </button>
    );
  }

  return (
    <form className="hall-add-client-form" onSubmit={handleSubmit}>
      <div className="admin-edit-field">
        <label>שם משתמש ללקוח</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
      </div>
      <div className="admin-edit-field">
        <label>סיסמה (לפחות 4 תווים)</label>
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
          {submitting ? "יוצר..." : "יצירת חשבון"}
        </button>
        <button type="button" className="hall-cancel-btn" onClick={() => setOpen(false)}>
          ביטול
        </button>
      </div>
    </form>
  );
}
