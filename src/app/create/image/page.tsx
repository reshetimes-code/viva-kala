"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DesktopPhoneWrapper from "@/components/DesktopPhoneWrapper";
import AiDesignerChat from "@/components/AiDesignerChat";
import CategoryFieldsForm from "@/components/CategoryFieldsForm";
import InvitePhotoCard from "@/components/InvitePhotoCard";
import { EVENT_CATEGORIES, isEventCategory, type EventCategory } from "@/lib/eventCategories";
import { hasCustomFields, findMissingRequiredField, readCommonFields, buildHeadline } from "@/lib/categoryFields";
import { computeTextStyleFromCanvas, type TextStyle } from "@/lib/textStyleHeuristic";

const PARTY_TYPES = [
  "יום ההולדת", "מסיבה", "הצגה", "הפנינג", "יום גיבוש", "יום פעילות", "מופע",
  "סדנא", "הרצאה", "יום כיף", "בר המצווה", "בת מצווה", "ברית", "בריתה",
  "מסיבת חינה", "חינה", "חתונה", "מקווה", "הצעת נישואין", "מסיבת אירוסין",
  "מסיבת הודיה", "שבת חתן", "מסיבת הפתעה",
];

interface Celebrant {
  name: string;
  gender: string;
  age: string;
}

export interface ImageInviteInitialData {
  invitedAs: string;
  partyType: string;
  celebrants: Celebrant[];
  willBe: string;
  eventDate: string;
  eventStart: string;
  meetAt: string;
  address: string;
  showNavBtn: boolean;
  imgOrBe: string;
  gladSee: string;
  notes: string;
  imageUrl: string;
  wantRsvp: boolean;
  eventCategory?: EventCategory;
  categoryFields?: Record<string, string>;
}

export default function CreateInvitePage({
  editInviteId,
  initialData,
}: {
  editInviteId?: string;
  initialData?: ImageInviteInitialData;
}) {
  const router = useRouter();

  // The landing page's category tiles link here with ?category=..., so the
  // system already knows what's being celebrated - the user shouldn't have
  // to pick it again. Read from the URL once, after mount (kept out of the
  // initial render so server/client markup matches on first paint).
  const [eventCategory, setEventCategory] = useState<EventCategory | undefined>(initialData?.eventCategory);
  const [categoryFields, setCategoryFields] = useState<Record<string, string>>(initialData?.categoryFields ?? {});
  const [editingCategory, setEditingCategory] = useState(false);

  useEffect(() => {
    if (initialData?.eventCategory) return; // editing an existing invite - keep its category
    const fromUrl = new URLSearchParams(window.location.search).get("category");
    if (isEventCategory(fromUrl)) setEventCategory(fromUrl);
  }, [initialData?.eventCategory]);

  const usesCustomFields = hasCustomFields(eventCategory);

  const [invitedAs, setInvitedAs] = useState(initialData?.invitedAs ?? "הנכם מוזמנים");
  const [partyType, setPartyType] = useState(initialData?.partyType ?? PARTY_TYPES[0]);

  // "אחר" switches the field above from a dropdown to free text - the
  // dropdown's default ("יום ההולדת") would be a misleading pre-filled
  // answer there, so clear it once, the first time this category is picked
  // on a fresh (non-edit) invite.
  useEffect(() => {
    if (eventCategory === "אחר" && !initialData?.partyType && partyType === PARTY_TYPES[0]) {
      setPartyType("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventCategory]);
  const [celebrants, setCelebrants] = useState<Celebrant[]>(
    initialData?.celebrants && initialData.celebrants.length > 0
      ? initialData.celebrants
      : [{ name: "", gender: "", age: "" }]
  );
  const [willBe, setWillBe] = useState(initialData?.willBe ?? "שיתקיים");
  const [eventDate, setEventDate] = useState(initialData?.eventDate ?? "");
  const [eventStart, setEventStart] = useState(initialData?.eventStart ?? "");
  const [meetAt, setMeetAt] = useState(initialData?.meetAt ?? "נפגשים");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [imgOrBe, setImgOrBe] = useState(initialData?.imgOrBe ?? "עם");
  const [gladSee, setGladSee] = useState(initialData?.gladSee ?? "נשמח לראותך");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(initialData?.imageUrl ?? null);
  const [imageSource, setImageSource] = useState<"upload" | "ai">("upload");
  const [textStyle, setTextStyle] = useState<TextStyle | undefined>(undefined);

  // Whenever the photo changes, work out how to lay text over it - this is
  // the "AI decides the design, not the user" piece: no color/font picker
  // ever shown, just a live preview of the result a moment later.
  useEffect(() => {
    if (!imageDataUrl) {
      setTextStyle(undefined);
      return;
    }
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      try {
        setTextStyle(computeTextStyleFromCanvas(canvas));
      } catch {
        // Cross-origin or otherwise unreadable image data - keep the
        // previous style rather than breaking the preview.
      }
    };
    img.src = imageDataUrl;

    // The heuristic above is instant, so the preview never looks broken -
    // this quietly asks the AI to actually look at the photo (avoid faces,
    // pick real colors) and upgrades the style if/when it comes back.
    // Only worth doing for a freshly chosen photo (a data: URL); an
    // already-saved "/uploads/..." photo from editing an existing invite
    // keeps whatever style it already has.
    if (imageDataUrl.startsWith("data:")) {
      fetch("/api/ai-designer/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((aiStyle) => {
          if (!cancelled && aiStyle) setTextStyle(aiStyle);
        })
        .catch(() => {
          // Heuristic result already showing - nothing to do on failure.
        });
    }

    return () => {
      cancelled = true;
    };
  }, [imageDataUrl]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateCelebrant(i: number, field: keyof Celebrant, value: string) {
    setCelebrants((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  }

  function addCelebrant() {
    setCelebrants((prev) => [...prev, { name: "", gender: "", age: "" }]);
  }

  function removeCelebrant(i: number) {
    setCelebrants((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (usesCustomFields && eventCategory) {
      const missing = findMissingRequiredField(eventCategory, categoryFields);
      if (missing) {
        setError(`נא למלא "${missing}"`);
        return;
      }
    } else {
      if (!celebrants.some((c) => c.name.trim())) {
        setError("נא להזין שם מלא לפחות לחוגג אחד");
        return;
      }
      if (!eventDate || !eventStart) {
        setError("נא למלא תאריך ושעת התחלה");
        return;
      }
    }
    if (!imageDataUrl) {
      setError("נא להעלות תמונת הזמנה");
      return;
    }

    // The rest of the app (RSVP thank-you screen, the 14-day cleanup sweep,
    // Waze/Maps buttons, ...) all key off the flat eventDate/eventStart/
    // address fields - so a category-fields invite still fills those from
    // categoryFields, it just isn't the source of truth for them.
    const common = usesCustomFields ? readCommonFields(categoryFields) : null;

    setSubmitting(true);
    try {
      const isEdit = !!editInviteId;
      const res = await fetch(isEdit ? `/api/invites/${editInviteId}` : "/api/invites", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitedAs,
          partyType: usesCustomFields && eventCategory ? eventCategory : partyType,
          celebrants: celebrants.filter((c) => c.name.trim()),
          willBe,
          eventDate: common?.eventDate || eventDate,
          eventStart: common?.eventStart || eventStart,
          meetAt,
          address: common?.venue || address,
          showNavBtn: true,
          imgOrBe,
          gladSee,
          notes,
          imageDataUrl,
          wantRsvp: true,
          eventCategory,
          categoryFields: usesCustomFields ? categoryFields : undefined,
          textStyle: usesCustomFields ? textStyle : undefined,
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
    <div className="create-page">
      <div className="create-wrapper">
        <div className="mb-4">
          <a href="/dashboard" className="create-back-link">
            → חזרה
          </a>
        </div>

        <h2 className="create-title">יצירת הזמנת תמונה</h2>

        <form onSubmit={handleSubmit}>
          {/* Event category - already known from the landing page tile in
              the normal flow, shown as one simple chip instead of asking
              again. A tiny "שנה" link is the only way to change it, so the
              common case (arrived here from a category tile) needs zero
              extra taps. */}
          <div className="category-section" style={{ textAlign: "center" }}>
            {editingCategory || !eventCategory ? (
              <>
                <label className="upper-section-text">מה חוגגים?</label>
                <select
                  className="inputs-fields"
                  value={eventCategory ?? ""}
                  onChange={(e) => {
                    setEventCategory(e.target.value as EventCategory);
                    setEditingCategory(false);
                  }}
                >
                  <option value="" disabled>
                    בחרו סוג אירוע
                  </option>
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                🎉 {eventCategory}{" "}
                <button
                  type="button"
                  onClick={() => setEditingCategory(true)}
                  style={{ background: "none", border: "none", color: "#d4af7a", fontWeight: 700, cursor: "pointer", fontSize: ".9rem" }}
                >
                  (שנה)
                </button>
              </p>
            )}
          </div>

          {usesCustomFields && eventCategory ? (
            <CategoryFieldsForm category={eventCategory} values={categoryFields} onChange={setCategoryFields} />
          ) : (
          <>
          {/* Basic info */}
          <div className="category-section basic-info-section">
            <h3 className="category-title">📋 פרטים בסיסיים</h3>

            <div>
              <label className="upper-section-text">בחירה מוזמנים או מוזמנות</label>
              <select
                className="inputs-fields"
                value={invitedAs}
                onChange={(e) => setInvitedAs(e.target.value)}
              >
                <option>הנכם מוזמנים</option>
                <option>הנכן מוזמנות</option>
                <option>ילדי הגן מוזמנים</option>
                <option>ילדי הצהרון מוזמנים</option>
              </select>
            </div>

            <p className="my-3 text-center text-lg" style={{ opacity: 0.7 }}>ל</p>

            <div>
              <label className="upper-section-text">סוג ארוע</label>
              {eventCategory === "אחר" ? (
                // "אחר" means none of the fixed options fit - a free-text
                // field is simpler than making someone scan a long list for
                // something that isn't there.
                <input
                  className="inputs-fields"
                  type="text"
                  placeholder="למשל: יום גיבוש, מסיבת פרישה, כנס..."
                  value={partyType}
                  onChange={(e) => setPartyType(e.target.value)}
                />
              ) : (
                <select
                  className="inputs-fields"
                  value={partyType}
                  onChange={(e) => setPartyType(e.target.value)}
                >
                  {PARTY_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              )}
            </div>

            <p className="mt-4 mb-3 text-center text-lg" style={{ opacity: 0.7 }}>של</p>

            <div>
              {celebrants.map((c, i) => (
                <div key={i} className="celebrate-box">
                  <div>
                    <label className="bottom-section-text">שם מלא</label>
                    <input
                      className="inputs-fields"
                      type="text"
                      placeholder="שם מלא"
                      value={c.name}
                      onChange={(e) => updateCelebrant(i, "name", e.target.value)}
                    />
                  </div>
                  <div className="mt-3">
                    <label className="bottom-section-text">בן או בת? (אופציונלי)</label>
                    <select
                      className="inputs-fields"
                      value={c.gender}
                      onChange={(e) => updateCelebrant(i, "gender", e.target.value)}
                    >
                      <option value="">בחר אפשרות (אופציונלי)</option>
                      <option value="בן">בן</option>
                      <option value="בת">בת</option>
                      <option value="בני">בני</option>
                      <option value="בנות">בנות</option>
                    </select>
                  </div>
                  <div className="mt-3">
                    <label className="bottom-section-text">גיל (אופציונלי)</label>
                    <input
                      className="inputs-fields"
                      type="text"
                      placeholder="גיל"
                      value={c.age}
                      onChange={(e) => updateCelebrant(i, "age", e.target.value)}
                    />
                  </div>
                  {celebrants.length > 1 && (
                    <div className="mt-3 text-center">
                      <button type="button" className="del-celebrate-row" onClick={() => removeCelebrant(i)}>
                        🗑 מחיקת חוגג/ת
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className="btn-gradient-success" onClick={addCelebrant}>
              ➕ הוספת חוגג/ת
            </button>

            <div className="mt-3">
              <label className="bottom-section-text">שיתקיים או שתתקיים</label>
              <select className="inputs-fields" value={willBe} onChange={(e) => setWillBe(e.target.value)}>
                <option>שיתקיים</option>
                <option>שתתקיים</option>
              </select>
            </div>
          </div>

          {/* Date & time */}
          <div className="category-section datetime-section">
            <h3 className="category-title">📅 תאריך ושעה</h3>
            <div className="mt-3">
              <label className="bottom-section-text">מהו תאריך הארוע?</label>
              <input
                className="inputs-fields"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div className="mt-3">
              <label className="bottom-section-text">שעת התחלה</label>
              <input
                className="inputs-fields"
                type="time"
                value={eventStart}
                onChange={(e) => setEventStart(e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div className="category-section location-section">
            <h3 className="category-title">📍 מיקום ופרטי מפגש</h3>
            <div className="mt-3">
              <label className="bottom-section-text">נפגשים או נפגשות</label>
              <select className="inputs-fields" value={meetAt} onChange={(e) => setMeetAt(e.target.value)}>
                <option>נפגשים</option>
                <option>נפגשות</option>
              </select>
            </div>
            <div className="mt-3">
              <label className="bottom-section-text">
                כתובת מדוייקת של הארוע <span className="attention-text-color">(חשוב: לניווט ה-Waze)</span>
              </label>
              <input
                className="inputs-fields"
                type="text"
                placeholder="התחל להקליד כתובת..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="mt-3">
              <label className="bottom-section-text">עם או ב-</label>
              <select className="inputs-fields" value={imgOrBe} onChange={(e) => setImgOrBe(e.target.value)}>
                <option>עם</option>
                <option>ב-</option>
              </select>
            </div>
            <div className="mt-3">
              <label className="bottom-section-text">לראותך או לראותכם</label>
              <select className="inputs-fields" value={gladSee} onChange={(e) => setGladSee(e.target.value)}>
                <option>נשמח לראותך</option>
                <option>נשמח לראותכם</option>
                <option>נשמח לראותכן</option>
              </select>
            </div>
            <div className="mt-3">
              <label className="bottom-section-text">הערה לארוע (לא חובה)</label>
              <textarea
                className="inputs-fields"
                rows={3}
                placeholder="הערה לארוע"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          </>
          )}

          {/* Image */}
          <div className="category-section media-section">
            <h3 className="category-title">🖼 תמונת ההזמנה (חובה)</h3>

            <div className="image-source-toggle">
              <button
                type="button"
                className={`image-source-btn${imageSource === "upload" ? " is-active" : ""}`}
                onClick={() => setImageSource("upload")}
              >
                📤 העלאת תמונה
              </button>
              <button
                type="button"
                className={`image-source-btn${imageSource === "ai" ? " is-active" : ""}`}
                onClick={() => setImageSource("ai")}
              >
                ✨ יצירה עם AI
              </button>
            </div>

            {imageSource === "upload" ? (
              <>
                <p className="upper-section-text" style={{ fontSize: 13, opacity: 0.8 }}>
                  העלו את ההזמנה שעיצבתם כתמונה אחת. היא תוצג כפי שהיא, המערכת תתאים מסביב רקע ופייד עדינים.
                </p>
                <label className="image-upload-area">
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
                  {imageDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageDataUrl} alt="תצוגה מקדימה" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }} />
                  ) : (
                    <span className="upload-label">📤 לחצו כאן להעלאת תמונה</span>
                  )}
                </label>
              </>
            ) : imageDataUrl ? (
              <div className="image-upload-area">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageDataUrl} alt="תצוגה מקדימה" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }} />
                <button type="button" className="ai-invite-retry-btn" style={{ marginTop: 12 }} onClick={() => setImageDataUrl(null)}>
                  🔄 יצירה מחדש
                </button>
              </div>
            ) : (
              <AiDesignerChat
                eventCategory={eventCategory ?? partyType}
                categoryFields={usesCustomFields ? categoryFields : undefined}
                onGenerated={setImageDataUrl}
              />
            )}

            {usesCustomFields && eventCategory && imageDataUrl && (
              <div className="mt-4">
                <p className="upper-section-text" style={{ fontSize: 13, opacity: 0.8, textAlign: "center" }}>
                  ✨ ככה זה ייראה אצל האורחים - הכל מתעצב לבד:
                </p>
                <div style={{ aspectRatio: "9 / 16", maxWidth: 260, margin: "12px auto 0", borderRadius: 16, overflow: "hidden" }}>
                  <InvitePhotoCard
                    imageUrl={imageDataUrl}
                    headline={buildHeadline(eventCategory, categoryFields)}
                    dateText={[readCommonFields(categoryFields).eventDate, readCommonFields(categoryFields).eventStart && `בשעה ${readCommonFields(categoryFields).eventStart}`]
                      .filter(Boolean)
                      .join(" ")}
                    venueText={readCommonFields(categoryFields).venue}
                    textStyle={textStyle}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirmation */}
          <div className="category-section confirmation-section">
            {error && <div className="alert alert-error">{error}</div>}

            <button type="submit" className="submit-btn" disabled={submitting}>
              <span>{submitting ? "יוצר הזמנה..." : "מתחילים ליצור קסם!"}</span>
              <span className="submit-btn-arrow">›</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </DesktopPhoneWrapper>
  );
}
