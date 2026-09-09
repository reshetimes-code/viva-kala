"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TemplateCard,
  DEFAULT_TEMPLATE_FIELDS,
  PHOTO_PLACEMENTS,
  photoStyleLabel,
  type TemplateFields,
  type PhotoPlacement,
} from "@/lib/templates";
import { useLocale } from "@/lib/i18n/LanguageProvider";
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

const COPY = {
  he: {
    wrapperTitleEdit: "עריכת ההזמנה",
    wrapperTitleCreate: "יצירת הזמנה",
    headingEdit: "עריכת ההזמנה",
    headingCreate: "מילוי פרטים",
    subheading: "העיצוב מתעדכן בזמן אמת מימין",
    formTitle: "פרטי ההזמנה",
    titleLine1: "שם ראשון (למשל: שם החתן / שם החוגג)",
    titleLine2: "שם שני (אופציונלי - למשל שם הכלה)",
    subtitle: "כותרת משנה",
    dateText: "תאריך לתצוגה (למשל 3.7.2026)",
    eventDateIso: "תאריך אמיתי (ליומן/RSVP)",
    venueText: "מקום האירוע",
    address: "כתובת מדוייקת (לניווט)",
    addressPlaceholder: "לניווט ב-Waze",
    ceremonyTime: "שעת קבלת פנים",
    receptionTime: "שעת טקס / תחילת אירוע",
    footerNote: "שורת סיום (למשל: נשמח לראותכם)",
    photoPlacement: "מיקום התמונה בעיצוב",
    photoLabel: "תמונה (אופציונלי)",
    previewAlt: "תצוגה מקדימה",
    uploadPrompt: "📤 לחצו כאן להעלאת תמונה",
    recrop: "✂️ חיתוך מחדש",
    removeImage: "🗑 הסרת תמונה",
    errorNoName: "נא למלא לפחות שם אחד",
    errorSave: "שגיאה בשמירת ההזמנה",
    errorNetwork: "שגיאת רשת - נסה שוב",
    saving: "שומר...",
    submitEdit: "שמירת שינויים",
    submitCreate: "סיימתי לעצב, בו נמשיך",
  },
  en: {
    wrapperTitleEdit: "Edit invitation",
    wrapperTitleCreate: "Create invitation",
    headingEdit: "Edit invitation",
    headingCreate: "Fill in details",
    subheading: "The design updates live on the right",
    formTitle: "Invitation details",
    titleLine1: "First name (e.g. groom's name / guest of honor)",
    titleLine2: "Second name (optional - e.g. bride's name)",
    subtitle: "Subtitle",
    dateText: "Display date (e.g. 3.7.2026)",
    eventDateIso: "Actual date (for calendar/RSVP)",
    venueText: "Event venue",
    address: "Exact address (for navigation)",
    addressPlaceholder: "For Waze navigation",
    ceremonyTime: "Reception time",
    receptionTime: "Ceremony / event start time",
    footerNote: "Closing line (e.g. We'd love to see you)",
    photoPlacement: "Photo placement in design",
    photoLabel: "Photo (optional)",
    previewAlt: "Preview",
    uploadPrompt: "📤 Click here to upload a photo",
    recrop: "✂️ Re-crop",
    removeImage: "🗑 Remove photo",
    errorNoName: "Please fill in at least one name",
    errorSave: "Error saving the invitation",
    errorNetwork: "Network error - try again",
    saving: "Saving...",
    submitEdit: "Save changes",
    submitCreate: "Done designing, let's continue",
  },
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
  const { locale } = useLocale();
  const t = COPY[locale];
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
      setError(t.errorNoName);
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
        setError(data.error || t.errorSave);
        setSubmitting(false);
        return;
      }
      router.push(isEdit ? "/dashboard" : `/i/${data.id}`);
    } catch {
      setError(t.errorNetwork);
      setSubmitting(false);
    }
  }

  return (
    <DesktopPhoneWrapper title={editInviteId ? t.wrapperTitleEdit : t.wrapperTitleCreate}>
    <div className="tpl-fill-page">
      <div className="tpl-gallery-header">
        <h1>{editInviteId ? t.headingEdit : t.headingCreate} - {templateLabel}</h1>
        <p>{t.subheading}</p>
      </div>

      <div className="tpl-fill-grid">
        <form className="tpl-fill-form" onSubmit={handleSubmit}>
          <h2>{t.formTitle}</h2>

          <div className="tpl-fill-field">
            <label>{t.titleLine1}</label>
            <input value={fields.titleLine1} onChange={(e) => update("titleLine1", e.target.value)} />
          </div>
          <div className="tpl-fill-field">
            <label>{t.titleLine2}</label>
            <input value={fields.titleLine2} onChange={(e) => update("titleLine2", e.target.value)} />
          </div>
          <div className="tpl-fill-field">
            <label>{t.subtitle}</label>
            <input value={fields.subtitle} onChange={(e) => update("subtitle", e.target.value)} />
          </div>
          <div className="tpl-fill-field">
            <label>{t.dateText}</label>
            <input value={fields.dateText} onChange={(e) => update("dateText", e.target.value)} />
          </div>
          <div className="tpl-fill-field">
            <label>{t.eventDateIso}</label>
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
            <label>{t.venueText}</label>
            <input value={fields.venueText} onChange={(e) => update("venueText", e.target.value)} />
          </div>
          <div className="tpl-fill-field">
            <label>{t.address}</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t.addressPlaceholder} />
          </div>
          <div className="tpl-fill-field">
            <label>{t.ceremonyTime}</label>
            <input value={fields.ceremonyTime} onChange={(e) => update("ceremonyTime", e.target.value)} />
          </div>
          <div className="tpl-fill-field">
            <label>{t.receptionTime}</label>
            <input value={fields.receptionTime} onChange={(e) => update("receptionTime", e.target.value)} />
          </div>
          <div className="tpl-fill-field">
            <label>{t.footerNote}</label>
            <input value={fields.footerNote} onChange={(e) => update("footerNote", e.target.value)} />
          </div>

          <div className="tpl-fill-field">
            <label>{t.photoPlacement}</label>
            <select
              className="inputs-fields"
              style={{ background: "#fff", color: "#222", border: "1px solid #d6d9de" }}
              value={currentPlacement}
              onChange={(e) => setPlacement(e.target.value as PhotoPlacement)}
            >
              {PHOTO_PLACEMENTS.map((p) => (
                <option key={p} value={p}>
                  {photoStyleLabel(p, locale)}
                </option>
              ))}
            </select>
          </div>

          <div className="tpl-fill-field">
            <label>{t.photoLabel}</label>
            <label className="image-upload-area" style={{ display: "flex", minHeight: 90 }}>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
              {fields.imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fields.imageDataUrl}
                  alt={t.previewAlt}
                  style={{ maxWidth: "100%", maxHeight: 140, borderRadius: 8 }}
                />
              ) : (
                <span className="upload-label" style={{ color: "#4a5568" }}>{t.uploadPrompt}</span>
              )}
            </label>
            {fields.imageDataUrl && (
              <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setCropOpen(true)}
                  style={{ background: "none", border: "none", color: "#3f7ff0", cursor: "pointer", fontSize: ".85rem" }}
                >
                  {t.recrop}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    update("imageDataUrl", "");
                    setRawImage(null);
                  }}
                  style={{ background: "none", border: "none", color: "#e0473f", cursor: "pointer", fontSize: ".85rem" }}
                >
                  {t.removeImage}
                </button>
              </div>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="submit-btn" disabled={submitting}>
            <span>{submitting ? t.saving : editInviteId ? t.submitEdit : t.submitCreate}</span>
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
