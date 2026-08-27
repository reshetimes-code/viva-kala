"use client";

import { useState } from "react";

export default function EditUserForm({ userId, currentUsername }: { userId: number; currentUsername: string }) {
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
        setMessage({ type: "error", text: data.error || "שגיאה בעדכון" });
      } else {
        setMessage({ type: "ok", text: "נשמר בהצלחה" });
        setPassword("");
      }
    } catch {
      setMessage({ type: "error", text: "שגיאת רשת" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-edit-form" onSubmit={handleSave}>
      <div className="admin-edit-field">
        <label>שם משתמש</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="admin-edit-field">
        <label>סיסמה חדשה (השאירו ריק כדי לא לשנות)</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
      </div>
      <button type="submit" className="admin-save-btn" disabled={saving}>
        {saving ? "שומר..." : "שמירת שינויים"}
      </button>
      {message && <p className={`admin-edit-msg admin-edit-msg-${message.type}`}>{message.text}</p>}
    </form>
  );
}
