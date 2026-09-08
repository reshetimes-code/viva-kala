"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TemplateCard,
  DEFAULT_TEMPLATE_FIELDS,
  PHOTO_STYLE_LABEL,
  PHOTO_PLACEMENTS,
  type TemplateFields,
  type PhotoPlacement,
} from "@/lib/templates";
import ImageCropModal from "@/components/ImageCropModal";
import DesktopPhoneWrapper from "@/components/DesktopPhoneWrapper";

const PLACEMENT_ASPECT: Record<PhotoPlacement, number> = {
  round: 1,
  square: 1,
  header: 2.4,
  footer: 2.4,
  side: 0.42,
  background: 0.62,
};

export default function TemplateFillForm({
  templateId,
  templateLabel,
  photoStyle,
  editInviteId,
  initialFields,
  initialAddress,
  initialEventDate,
}: {
  templateId: string;
  templateLabel: string;
  photoStyle: PhotoPlacement;
  editInviteId?: string;
  initialFields?: TemplateFields;
  initialAddress?: string;
  initialEventDate?: string;
}) {
  const router = useRouter();
  const [fields, setFields] = useState<TemplateFields>(
    initialFields ?? { ...DEFAULT_TEMPLATE_FIELDS, photoPlacement: photoStyle }
  );
  const [address, setAddress] = useState(initialAddress ?? "");
  const [eventDateIso, setEventDateIso] = useState(initialEventDate ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  function update<K extends keyof TemplateFields>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function setPlacement(p: PhotoPlacement) {
    setFields((prev) => ({ ...prev, photoPlacement: p }));
    // Re-crop is needed since the target aspect ratio changed - the old
    // crop (round/square) would look wrong stretched into a header banner.
    if (rawImage) setCropOpen(true);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawImage(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  }

  function handleCropConfirm(dataUrl: string) {
    update("imageDataUrl", dataUrl);
    setCropOpen(false);
  }

  const currentPlacement = fields.photoPlacement ?? photoStyle;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fields.titleLine1.trim()) {
      setError("נא למלא לפחות שם אחד");
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = !!editInviteId;
      const res = await fetch(isEdit ? `/api/invites/${editInviteId}` : "/api/invites", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "template",
          templateId,
          templateFields: fields,
          eventDate: eventDateIso,
          address,
          wantRsvp: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה בשמירת ההזמנה");
        setSubmitting(false);
        return;
      }
      router.push(isEdit ? "/dashboard" : `/i/${data.id}`);
    } catch {
      setError("שגיאת רשת - נסה שוב");
      setSubmitting(false);
    }
  }

  return (
    <DesktopPhoneWrapper title={editInviteId ? "עריכת ההזמנה" : "יצירת הזמנה"}>
    <div className="tpl-fill-page">
      <div className="tpl-gallery-header">
        <h1>{editInviteId ? "עריכת ההזמנה" : "מילוי פרטים"} - {templateLabel}</h1>
        <p>העיצוב מתעדכן בזמן אמת מימין</p>
      </div>

      <div className="tpl-fill-grid">
        <form className="tpl-fill-form" onSubmit={handleSubmit}>
          <h2>פרטי ההזמנה</h2>

          <div className="tpl-fill-field">
            <label>שם ראשון (למשל: שם החתן / שם החוגג)</label>
            <input value={fields.titleLine1} onChange={(e) => update("titleLine1", e.target.value)} />
          </div>
          <div className="tpl-fill-field">
            <label>שם שני (אופציונלי - למשל שם הכלה)</label>
            <input value={fields.titleLine2} onChange={(e) => update("titleLine2", e.target.value)} />
          </div>
          <div className="tpl-fill-field">
            <label>כותרת משנה</label>
            <input value={fields.subtitle} onChange={(e) => update("subtitle", e.target.value)} />
          </div>
          <div className="tpl-fill-field">
            <label>תאריך לתצוגה (למשל 3.7.2026)</label>
            <input value={fields.dateText} onChange={(e) => update("dateText", e.target.value)} />
          </div>
          <div className="tpl-fill-field">
            <label>תאריך אמיתי (ליומן/RSVP)</label>
            {/* Uncontrolled (defaultValue, not value) on purpose - a controlled
                date input forces React to re-assign .value on every render,
                and on iOS Safari that programmatic write while the native
                wheel picker is open makes it think the user is done and
                auto-confirms/closes it after the very first tick (often
                landing on "today"). Reading the final value only via
                onChange avoids fighting the native picker mid-interaction. */}
            <input
              type="date"
              defaultValue={eventDateIso}
              onChange={(e) => setEventDateIso(e.target.value)}
            />
          </div>
          <div className="tpl-fill-field">
            <label>מקום האירוע</label>
            <input value={fields.venueText} onChange={(e) => update("venueText", e.target.value)} />
          </div>
          <div className="tpl-fill-field">
            <label>כתובת מדוייקת (לניווט)</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="לניווט ב-Waze" />
          </div>
          <div className="tpl-fill-field">
            <label>שעת קבלת פנים</label>
            <input value={fields.ceremonyTime} onChange={(e) => update("ceremonyTime", e.target.value)} />
          </div>
          <div className="tpl-fill-field">
            <label>שעת טקס / תחילת אירוע</label>
            <input value={fields.receptionTime} onChange={(e) => update("receptionTime", e.target.value)} />
          </div>
          <div className="tpl-fill-field">
            <label>שורת סיום (למשל: נשמח לראותכם)</label>
            <input value={fields.footerNote} onChange={(e) => update("footerNote", e.target.value)} />
          </div>

          <div className="tpl-fill-field">
            <label>מיקום התמונה בעיצוב</label>
            <select
              className="inputs-fields"
              style={{ background: "#fff", color: "#222", border: "1px solid #d6d9de" }}
              value={currentPlacement}
              onChange={(e) => setPlacement(e.target.value as PhotoPlacement)}
            >
              {PHOTO_PLACEMENTS.map((p) => (
                <option key={p} value={p}>
                  {PHOTO_STYLE_LABEL[p]}
                </option>
              ))}
            </select>
          </div>

          <div className="tpl-fill-field">
            <label>תמונה (אופציונלי)</label>
            <label className="image-upload-area" style={{ display: "flex", minHeight: 90 }}>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
              {fields.imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fields.imageDataUrl}
                  alt="תצוגה מקדימה"
                  style={{ maxWidth: "100%", maxHeight: 140, borderRadius: 8 }}
                />
              ) : (
                <span className="upload-label" style={{ color: "#4a5568" }}>📤 לחצו כאן להעלאת תמונה</span>
              )}
            </label>
            {fields.imageDataUrl && (
              <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setCropOpen(true)}
                  style={{ background: "none", border: "none", color: "#3f7ff0", cursor: "pointer", fontSize: ".85rem" }}
                >
                  ✂️ חיתוך מחדש
                </button>
                <button
                  type="button"
                  onClick={() => {
                    update("imageDataUrl", "");
                    setRawImage(null);
                  }}
                  style={{ background: "none", border: "none", color: "#e0473f", cursor: "pointer", fontSize: ".85rem" }}
                >
                  🗑 הסרת תמונה
                </button>
              </div>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="submit-btn" disabled={submitting}>
            <span>{submitting ? "שומר..." : editInviteId ? "שמירת שינויים" : "סיימתי לעצב, בו נמשיך"}</span>
            <span className="submit-btn-arrow">›</span>
          </button>
        </form>

        <div className="tpl-preview-sticky">
          <div className="tpl-preview-frame">
            <TemplateCard templateId={templateId} fields={fields} />
          </div>
        </div>
      </div>

      {cropOpen && rawImage && (
        <ImageCropModal
          imageSrc={rawImage}
          aspectRatio={PLACEMENT_ASPECT[currentPlacement]}
          roundPreview={currentPlacement === "round"}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropOpen(false)}
        />
      )}
    </div>
    </DesktopPhoneWrapper>
  );
}
