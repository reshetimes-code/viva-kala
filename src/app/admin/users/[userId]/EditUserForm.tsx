"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/LanguageProvider";

const COPY = {
  he: {
    updateError: "שגיאה בעדכון",
    savedOk: "נשמר בהצלחה",
    networkError: "שגיאת רשת",
    username: "שם משתמש",
    newPassword: "סיסמה חדשה (השאירו ריק כדי לא לשנות)",
    saving: "שומר...",
    save: "שמירת שינויים",
  },
  en: {
    updateError: "Error updating user",
    savedOk: "Saved successfully",
    networkError: "Network error",
    username: "Username",
    newPassword: "New password (leave blank to keep it unchanged)",
    saving: "Saving...",
    save: "Save changes",
  },
};

export default function EditUserForm({ userId, currentUsername }: { userId: number; currentUsername: string }) {
  const { locale } = useLocale();
  const t = COPY[locale];
  const [username, setUsername] = useState(currentUsername);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || t.updateError });
      } else {
        setMessage({ type: "ok", text: t.savedOk });
        setPassword("");
      }
    } catch {
      setMessage({ type: "error", text: t.networkError });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-edit-form" onSubmit={handleSave}>
      <div className="admin-edit-field">
        <label>{t.username}</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="admin-edit-field">
        <label>{t.newPassword}</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
      </div>
      <button type="submit" className="admin-save-btn" disabled={saving}>
        {saving ? t.saving : t.save}
      </button>
      {message && <p className={`admin-edit-msg admin-edit-msg-${message.type}`}>{message.text}</p>}
    </form>
  );
}
