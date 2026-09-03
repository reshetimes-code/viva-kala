"use client";

import { useState } from "react";
import { CATEGORY_FIELD_DEFS, type FieldDef } from "@/lib/categoryFields";
import type { EventCategory } from "@/lib/eventCategories";

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
}: {
  category: EventCategory;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}) {
  const defs = CATEGORY_FIELD_DEFS[category] ?? [];
  const required = defs.filter((d) => d.required);
  const optional = defs.filter((d) => !d.required);
  const [showOptional, setShowOptional] = useState(false);

  function setField(key: string, value: string) {
    onChange({ ...values, [key]: value });
  }

  // Dev/testing convenience only - fills every field (required + optional)
  // with plausible dummy data in one click, so re-testing the flow doesn't
  // mean re-typing the same names/date/venue every single time.
  function fillTestData() {
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 30);
    const isoDate = testDate.toISOString().slice(0, 10);
    const TEST_VALUES: Record<string, string> = {
      groomName: "אורן",
      brideName: "שני",
      celebrantName: "אורן",
      celebrantAge: "בן 13",
      familyName: "כהן",
      parentsNames: "יוסי ורונית",
      siblingsNames: "דניאל ונועה",
      groomParents: "משה ורחל",
      brideParents: "דוד ומיכל",
      venue: "אולמי הבדיקה",
    };
    const filled: Record<string, string> = {};
    for (const d of defs) {
      if (d.type === "date") filled[d.key] = isoDate;
      else if (d.type === "time") filled[d.key] = "19:00";
      else filled[d.key] = TEST_VALUES[d.key] ?? "בדיקה";
    }
    onChange({ ...values, ...filled });
  }

  return (
    <div className="category-section basic-info-section">
      <h3 className="category-title">📋 הפרטים של האירוע</h3>
      <p className="upper-section-text" style={{ fontSize: 13, opacity: 0.75, marginBottom: 16 }}>
        רק כמה פרטים - את/ה ממלא/ת, ואנחנו מעצבים את זה יפה בשבילך.
      </p>

      <button
        type="button"
        onClick={fillTestData}
        style={{
          display: "block", margin: "0 0 16px", padding: "8px 16px", borderRadius: 999,
          border: "1.5px dashed rgba(255,255,255,0.4)", background: "none", color: "#fff",
          fontSize: ".85rem", cursor: "pointer", opacity: 0.75,
        }}
      >
        🧪 מלא נתוני בדיקה
      </button>

      {required.map((def) => (
        <FieldInput key={def.key} def={def} value={values[def.key] ?? ""} onChange={(v) => setField(def.key, v)} />
      ))}

      {optional.length > 0 && (
        <div className="mt-3" style={{ textAlign: "right" }}>
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
                fontSize: "1.4rem",
                padding: "18px 27px",
                cursor: "pointer",
              }}
            >
              ➕ הוספת פרטים להזמנה
            </button>
          ) : (
            <div className="category-optional-fields mt-2">
              {optional.map((def) => (
                <FieldInput
                  key={def.key}
                  def={def}
                  value={values[def.key] ?? ""}
                  onChange={(v) => setField(def.key, v)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FieldInput({ def, value, onChange }: { def: FieldDef; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-3">
      <label className="bottom-section-text">{def.label}</label>
      <input
        className="inputs-fields"
        type={def.type === "textarea" ? "text" : def.type}
        placeholder={def.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
