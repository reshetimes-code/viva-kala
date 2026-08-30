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

  return (
    <div className="category-section basic-info-section">
      <h3 className="category-title">📋 הפרטים של האירוע</h3>
      <p className="upper-section-text" style={{ fontSize: 13, opacity: 0.75, marginBottom: 16 }}>
        רק כמה פרטים - את/ה ממלא/ת, ואנחנו מעצבים את זה יפה בשבילך.
      </p>

      {required.map((def) => (
        <FieldInput key={def.key} def={def} value={values[def.key] ?? ""} onChange={(v) => setField(def.key, v)} />
      ))}

      {optional.length > 0 && (
        <div className="mt-3">
          {!showOptional ? (
            <button type="button" className="ai-invite-retry-btn" onClick={() => setShowOptional(true)}>
              ➕ עוד פרטים (לא חובה)
            </button>
          ) : (
            <div className="celebrate-box mt-2">
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
