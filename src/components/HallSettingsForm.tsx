"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/LanguageProvider";

const COPY = {
  he: {
    youtubeLabel: "קישור סרטון YouTube (לא חובה)",
    tourLabel: "קישור לאתר האולם / דף פרסום (לא חובה)",
    saving: "שומר...",
    saved: "✓ נשמר",
    save: "שמירה",
  },
  en: {
    youtubeLabel: "YouTube video link (optional)",
    tourLabel: "Venue website / listing page link (optional)",
    saving: "Saving...",
    saved: "✓ Saved",
    save: "Save",
  },
};

export default function HallSettingsForm({
  initialYoutubeUrl,
  initialTourUrl,
}: {
  initialYoutubeUrl: string;
  initialTourUrl: string;
}) {
  const { locale } = useLocale();
  const t = COPY[locale];
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
        <label>{t.youtubeLabel}</label>
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
        <label>{t.tourLabel}</label>
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
        {saving ? t.saving : saved ? t.saved : t.save}
      </button>
    </div>
  );
}
