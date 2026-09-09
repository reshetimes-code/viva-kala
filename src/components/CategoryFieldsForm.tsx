"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CATEGORY_FIELD_DEFS, fieldLabel, fieldPlaceholder, type FieldDef } from "@/lib/categoryFields";
import type { EventCategory } from "@/lib/eventCategories";
import { useLocale } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";

const COPY = {
  he: {
    heading: "📋 הפרטים של האירוע",
    subheading: "רק כמה פרטים - את/ה ממלא/ת, ואנחנו מעצבים את זה יפה בשבילך.",
    addDetails: "➕ הוספת פרטים להזמנה",
    saving: "שומר...",
    saved: "✓ השינוי נשמר",
    staleBanner: "⚠️ שיניתם פרטים אחרי שהתמונה נוצרה - היא עדיין מציגה את הפרטים הישנים.",
    updatingImage: "מעדכן את התמונה...",
    updateImage: "🪄 עדכון התמונה עם הפרטים החדשים",
  },
  en: {
    heading: "📋 Event details",
    subheading: "Just a few details - you fill them in, and we'll design it beautifully for you.",
    addDetails: "➕ Add more details",
    saving: "Saving...",
    saved: "✓ Change saved",
    staleBanner: "⚠️ You changed details after the image was created - it still shows the old details.",
    updatingImage: "Updating the image...",
    updateImage: "🪄 Update the image with the new details",
  },
};

/** Renders only the fields a category actually needs (wedding/bar-bat-
 *  mitzvah/henna) - the required ones up front and big, anything optional
 *  tucked under one small "עוד פרטים (לא חובה)" toggle. The whole point is
 *  that filling this out should be simple enough for anyone: a handful of
 *  fields, one screen, no jargon - the AI designer (next step) is the one
 *  that does the hard part. */
export default function CategoryFieldsForm({
  category,
  values,
  onChange,
  imageIsStale,
  quickUpdating,
  onUpdateImage,
}: {
  category: EventCategory;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  /** True once a field here has drifted from what's actually baked into the
   *  AI-generated image - shows the "⚠️ עדכון התמונה" banner below, right
   *  in this form, instead of only down by the image preview. */
  imageIsStale?: boolean;
  quickUpdating?: boolean;
  onUpdateImage?: () => void;
}) {
  const { locale } = useLocale();
  const t = COPY[locale];
  const defs = CATEGORY_FIELD_DEFS[category] ?? [];
  const required = defs.filter((d) => d.required);
  const optional = defs.filter((d) => !d.required);
  const [showOptional, setShowOptional] = useState(false);

  // Same transient save confirmation as the seating page's table-assignment
  // badge (gm-saved-badge), but in two stages so the "save" itself actually
  // reads as an action happening, not just text appearing: a brief spinner
  // ("שומר...") the instant a field changes, then it flips to the "✓
  // השינוי נשמר" badge, which fades back out on its own a moment later.
  const [justSavedKey, setJustSavedKey] = useState<string | null>(null);
  const [savePhase, setSavePhase] = useState<"saving" | "saved">("saving");
  const [saveTick, setSaveTick] = useState(0);
  const savingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // document.body doesn't exist during SSR - the portal below only ever
  // renders once this has flipped true on the client, after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function setField(key: string, value: string) {
    onChange({ ...values, [key]: value });
    setJustSavedKey(key);
    setSavePhase("saving");
    setSaveTick((t) => t + 1);
    if (savingTimer.current) clearTimeout(savingTimer.current);
    if (doneTimer.current) clearTimeout(doneTimer.current);
    savingTimer.current = setTimeout(() => {
      setSavePhase((cur) => (cur === "saving" ? "saved" : cur));
    }, 450);
    doneTimer.current = setTimeout(() => {
      setJustSavedKey((cur) => (cur === key ? null : cur));
    }, 450 + 1600);
  }

  return (
    <div className="category-section basic-info-section">
      <h3 className="category-title">{t.heading}</h3>
      <p className="upper-section-text" style={{ fontSize: 13, opacity: 0.75, marginBottom: 16 }}>
        {t.subheading}
      </p>

      {required.map((def) => (
        <FieldInput
          key={def.key}
          def={def}
          locale={locale}
          value={values[def.key] ?? ""}
          onChange={(v) => setField(def.key, v)}
          justSavedTick={justSavedKey === def.key ? saveTick : null}
          savePhase={savePhase}
        />
      ))}

      {optional.length > 0 && (
        <div className="mt-3" style={{ textAlign: "center" }}>
          {!showOptional ? (
            <button
              type="button"
              onClick={() => setShowOptional(true)}
              style={{
                display: "inline-block",
                borderRadius: 999,
                border: "none",
                background: "#dc2626",
                color: "#fff",
                fontWeight: 700,
                fontSize: ".95rem",
                padding: "10px 20px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t.addDetails}
            </button>
          ) : (
            <div className="category-optional-fields mt-2">
              {optional.map((def) => (
                <FieldInput
                  key={def.key}
                  def={def}
                  locale={locale}
                  value={values[def.key] ?? ""}
                  onChange={(v) => setField(def.key, v)}
                  justSavedTick={justSavedKey === def.key ? saveTick : null}
                  savePhase={savePhase}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {imageIsStale &&
        mounted &&
        // Rendered via portal straight into <body>, not in normal flow here
        // - this card (.category-section) has its own backdrop-filter,
        // which (per spec) makes it the containing block for any
        // position:fixed DESCENDANT, silently turning "fixed to the
        // screen" into "fixed to this scrolling card" instead. The portal
        // sidesteps that entirely: no ancestor between this banner and the
        // real viewport can filter/transform it out from under it.
        // Gated on `mounted` because document.body doesn't exist during
        // SSR - createPortal would crash the render there otherwise.
        createPortal(
          <div className="stale-image-banner">
            <p>{t.staleBanner}</p>
            <button type="button" className="stale-image-update-btn" onClick={onUpdateImage} disabled={quickUpdating}>
              {quickUpdating ? (
                <>
                  <span className="stale-image-update-spinner" aria-hidden="true" />
                  {t.updatingImage}
                </>
              ) : (
                t.updateImage
              )}
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}

function FieldInput({
  def,
  locale,
  value,
  onChange,
  justSavedTick,
  savePhase,
}: {
  def: FieldDef;
  locale: Locale;
  value: string;
  onChange: (v: string) => void;
  /** Non-null exactly while this field is the one that just changed - its
   *  value changes on every edit (even to the same field again) so the
   *  indicator below remounts (via the `key`) and its animation replays
   *  instead of doing nothing on an already-mounted, already-finished
   *  element. */
  justSavedTick: number | null;
  /** "saving" for a brief moment right after the edit (spinner - makes the
   *  save actually read as an action happening), then "saved" (the ✓ badge,
   *  which fades itself out via CSS). */
  savePhase: "saving" | "saved";
}) {
  const t = COPY[locale];
  return (
    <div className="mt-3">
      <label className="bottom-section-text field-label-row">
        <span>{fieldLabel(def, locale)}</span>
        {justSavedTick != null && (
          <span key={justSavedTick}>
            {savePhase === "saving" ? (
              <span className="field-saving-indicator">
                <span className="field-saving-spinner" aria-hidden="true" />
                {t.saving}
              </span>
            ) : (
              <span className="field-saved-badge">{t.saved}</span>
            )}
          </span>
        )}
      </label>
      <input
        className="inputs-fields"
        type={def.type === "textarea" ? "text" : def.type}
        placeholder={fieldPlaceholder(def, locale)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
