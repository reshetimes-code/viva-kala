"use client";

import { useState } from "react";

export default function HallSettingsForm({
  initialYoutubeUrl,
  initialTourUrl,
}: {
  initialYoutubeUrl: string;
  initialTourUrl: string;
}) {
  const [youtubeUrl, setYoutubeUrl] = useState(initialYoutubeUrl);
  const [tourUrl, setTourUrl] = useState(initialTourUrl);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/hall/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl, tourUrl }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="hall-settings-form">
      <div className="admin-edit-field">
        <label>קישור סרטון YouTube (לא חובה)</label>
        <input
          value={youtubeUrl}
          onChange={(e) => {
            setYoutubeUrl(e.target.value);
            setSaved(false);
          }}
          placeholder="https://youtube.com/watch?v=..."
          dir="ltr"
        />
      </div>
      <div className="admin-edit-field">
        <label>קישור לאתר האולם / דף פרסום (לא חובה)</label>
        <input
          value={tourUrl}
          onChange={(e) => {
            setTourUrl(e.target.value);
            setSaved(false);
          }}
          placeholder="https://..."
          dir="ltr"
        />
      </div>
      <button type="button" className="hall-save-btn" onClick={handleSave} disabled={saving}>
        {saving ? "שומר..." : saved ? "✓ נשמר" : "שמירה"}
      </button>
    </div>
  );
}
