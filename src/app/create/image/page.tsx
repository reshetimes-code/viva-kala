"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import DesktopPhoneWrapper from "@/components/DesktopPhoneWrapper";
import AiDesignerChat from "@/components/AiDesignerChat";
import CategoryFieldsForm from "@/components/CategoryFieldsForm";
import InvitePhotoCard from "@/components/InvitePhotoCard";
import ImageCropModal from "@/components/ImageCropModal";
import { EVENT_CATEGORIES, isEventCategory, type EventCategory } from "@/lib/eventCategories";
import { hasCustomFields, findMissingRequiredField, readCommonFields, buildHeadline, buildExtraDetailLines, formatEventDate } from "@/lib/categoryFields";
import { computeTextStyleFromCanvas, DEFAULT_TEXT_STYLE, type TextStyle } from "@/lib/textStyleHeuristic";

// Background photos are shown full-bleed behind the invitation text, at the
// same tall aspect ratio as a TikTok/Reels/Story frame - cropping to it here
// (instead of showing whatever ratio the user's photo happened to be) keeps
// every invite's layout predictable.
const BACKGROUND_ASPECT_RATIO = 9 / 16;

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
  textStyle?: TextStyle;
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
    if (isEventCategory(fromUrl)) {
      setEventCategory(fromUrl);
      return;
    }
    // Arrived here with no category at all (e.g. "יצירת הזמנה" in the
    // dashboard/nav, not one of the landing page's category tiles) - ask up
    // front in a popup instead of silently falling back to the generic
    // form, so every invite still starts from a real category.
    Swal.fire({
      title: "מה חוגגים?",
      input: "select",
      inputOptions: Object.fromEntries(EVENT_CATEGORIES.map((c) => [c, c])),
      inputPlaceholder: "בחרו סוג אירוע",
      confirmButtonText: "המשך",
      confirmButtonColor: "#d4af7a",
      background: "#1f2a33",
      color: "#fff",
      allowOutsideClick: false,
      inputValidator: (value) => (value ? undefined : "יש לבחור סוג אירוע"),
    }).then((result) => {
      if (isEventCategory(result.value)) setEventCategory(result.value);
    });
  }, [initialData?.eventCategory]);

  const usesCustomFields = hasCustomFields(eventCategory);

  // No longer user-selectable (removed the "מוזמנים/מוזמנות" dropdown) -
  // always the default phrasing now, still edit-preserving for old invites.
  const [invitedAs] = useState(initialData?.invitedAs ?? "הנכם מוזמנים");
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
  // True once the AI designer generates an image whose own prompt asked for
  // the event text to be drawn right into it - InvitePhotoCard's separate
  // text panel is skipped for those so the details never render twice.
  const [imageHasBakedText, setImageHasBakedText] = useState(!!initialData?.textStyle?.imageHasText);
  const [rawUploadImage, setRawUploadImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiModalRootRef = useRef<Root | null>(null);
  const [textStyle, setTextStyle] = useState<TextStyle | undefined>(initialData?.textStyle);

  // Whenever the photo changes, work out how to lay text over it - this is
  // the "AI decides the design, not the user" piece: no color/font picker
  // ever shown, just a live preview of the result a moment later.
  useEffect(() => {
    if (!imageDataUrl) {
      setTextStyle(undefined);
      return;
    }
    // The image already carries its own designed text (see
    // imageHasBakedText) - no overlay is going to be shown at all, so
    // there's nothing for a color/scrim/anchor analysis to inform.
    if (imageHasBakedText) return;
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
  }, [imageDataUrl, imageHasBakedText]);

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

  // "לבד עם העלאת תמונה ברקע" - picks a file, then always crops it to the
  // TikTok/Story ratio before it becomes the invite's background (see
  // BACKGROUND_ASPECT_RATIO above) instead of using the raw photo as-is.
  function openUploadFlow() {
    fileInputRef.current?.click();
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawUploadImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleCropConfirm(dataUrl: string) {
    setImageHasBakedText(false); // an uploaded photo never has the event text drawn into it
    setImageDataUrl(dataUrl);
    setRawUploadImage(null);
  }

  // "עם מעצב ה-AI" - the chat now opens inside a SweetAlert popup instead of
  // inline in the page, so mount/unmount the existing AiDesignerChat React
  // tree into the DOM node SweetAlert hands us.
  function openAiDesigner() {
    // The AI designer builds its questions (and eventually the image
    // prompt) from the event's own details - opening it before those are
    // filled in means it has nothing to work with, so send the user back to
    // fill them in first instead of starting an empty chat.
    if (usesCustomFields && eventCategory) {
      const missing = findMissingRequiredField(eventCategory, categoryFields);
      if (missing) {
        alertMissingField(`נא למלא "${missing}" כדי שלמעצב ה-AI יהיה עם מה לעבוד`);
        return;
      }
    } else if (!celebrants.some((c) => c.name.trim()) || !eventDate || !eventStart) {
      alertMissingField("נא למלא את פרטי האירוע (שם, תאריך ושעה) כדי שלמעצב ה-AI יהיה עם מה לעבוד");
      return;
    }

    const container = document.createElement("div");
    Swal.fire({
      html: container,
      showConfirmButton: false,
      // SweetAlert2's own built-in close button kept showing up alongside
      // (not instead of) a custom one, doubled - one rendered here directly
      // instead, so there's exactly one, and its position isn't at the
      // mercy of Swal's own RTL-flipping logic.
      showCloseButton: false,
      width: "min(560px, 96vw)",
      padding: "1.6em 1.2em",
      background: "#fff",
      didOpen: () => {
        aiModalRootRef.current = createRoot(container);
        aiModalRootRef.current.render(
          <>
            <button
              type="button"
              onClick={() => Swal.close()}
              aria-label="סגירה"
              style={{
                position: "absolute", top: 10, right: 14, zIndex: 10,
                background: "none", border: "none", fontSize: "1.6rem", lineHeight: 1,
                color: "#999", cursor: "pointer", padding: 4,
              }}
            >
              ×
            </button>
            <AiDesignerChat
              eventCategory={eventCategory ?? partyType}
              categoryFields={usesCustomFields ? categoryFields : undefined}
              onGenerated={(url) => {
                // Its own prompt asked Gemini to draw the event's text right
                // into the image - InvitePhotoCard's separate panel would
                // just duplicate that, so it's marked here to be skipped.
                setImageHasBakedText(true);
                setTextStyle({ ...DEFAULT_TEXT_STYLE, imageHasText: true });
                setImageDataUrl(url);
                Swal.close();
              }}
            />
          </>
        );
      },
      willClose: () => {
        aiModalRootRef.current?.unmount();
        aiModalRootRef.current = null;
      },
    });
  }

  function alertMissingField(text: string) {
    Swal.fire({
      icon: "warning",
      title: "חסרים פרטים",
      text,
      confirmButtonText: "הבנתי",
      confirmButtonColor: "#d4af7a",
      background: "#1f2a33",
      color: "#fff",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (usesCustomFields && eventCategory) {
      const missing = findMissingRequiredField(eventCategory, categoryFields);
      if (missing) {
        alertMissingField(`חובה למלא "${missing}" כדי ליצור את ההזמנה`);
        return;
      }
    } else {
      if (!celebrants.some((c) => c.name.trim())) {
        alertMissingField("חובה להזין שם מלא לפחות לחוגג אחד כדי ליצור את ההזמנה");
        return;
      }
      if (!eventDate || !eventStart) {
        alertMissingField("חובה למלא תאריך ושעת התחלה כדי ליצור את ההזמנה");
        return;
      }
    }
    if (!imageDataUrl) {
      alertMissingField("חובה להעלות או ליצור תמונת הזמנה כדי ליצור את ההזמנה");
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

        <h2 className="create-title">יצירת הזמנה לארוע</h2>

        <form onSubmit={handleSubmit}>
          {/* Event category - already known from the landing page tile in
              the normal flow, shown as one simple chip instead of asking
              again. A tiny "שנה" link is the only way to change it, so the
              common case (arrived here from a category tile) needs zero
              extra taps. */}
          <div className="category-section" style={{ textAlign: "center", position: "relative" }}>
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
                🎉 {eventCategory}
                <button
                  type="button"
                  onClick={() => setEditingCategory(true)}
                  style={{
                    position: "absolute",
                    top: -14,
                    right: -10,
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: "none",
                    background: "#dc2626",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: ".85rem",
                    cursor: "pointer",
                  }}
                >
                  שנה
                </button>
              </p>
            )}
          </div>

          {/* Nothing below matters until a category is actually picked (via
              the popup above, the landing tiles, or the chip's "שנה") -
              showing the full generic form as a placeholder before that was
              just noise. */}
          {eventCategory && (
          <>
          {usesCustomFields ? (
            <CategoryFieldsForm category={eventCategory} values={categoryFields} onChange={setCategoryFields} />
          ) : (
          <>
          {/* Basic info */}
          <div className="category-section basic-info-section">
            <h3 className="category-title">📋 פרטים בסיסיים</h3>

            {/* eventCategory already answers "what kind of event" (chosen on
                the landing page or the chip above) for יום הולדת - asking
                again here with the same question is redundant, so this
                whole field is skipped and partyType just keeps its default
                ("יום ההולדת"). "אחר" and the no-category case still need it. */}
            {eventCategory !== "יום הולדת" && (
              <>
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
              </>
            )}

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
            <h3 className="category-title">🖼 איך תרצו לעצב את ההזמנה</h3>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageSelect}
            />

            {/* The image itself is already shown right below in the "ככה זה
                ייראה אצל האורחים" preview - no need to repeat it here in a
                second little box, just the way back to pick a different
                one. */}
            {imageDataUrl ? (
              <button type="button" className="image-choice-btn" onClick={() => setImageDataUrl(null)}>
                🔄 יצירה מחדש
              </button>
            ) : (
              <div className="image-choice-buttons">
                <button type="button" className="image-choice-btn image-choice-btn-ai" onClick={openAiDesigner}>
                  ✨ עם מעצב ה-AI
                </button>
                <button type="button" className="image-choice-btn" onClick={openUploadFlow}>
                  📤 לבד עם העלאת תמונה ברקע
                </button>
              </div>
            )}

            {rawUploadImage && (
              <ImageCropModal
                imageSrc={rawUploadImage}
                aspectRatio={BACKGROUND_ASPECT_RATIO}
                onConfirm={handleCropConfirm}
                onCancel={() => setRawUploadImage(null)}
              />
            )}

            {usesCustomFields && eventCategory && imageDataUrl && (
              <div className="mt-4">
                <p className="upper-section-text" style={{ fontSize: 13, opacity: 0.8, textAlign: "center" }}>
                  ✨ ככה זה ייראה אצל האורחים - הכל מתעצב לבד:
                </p>
                <div style={{ aspectRatio: "9 / 16", maxWidth: 260, margin: "12px auto 0", borderRadius: 16, overflow: "hidden" }}>
                  {imageHasBakedText ? (
                    // The AI already drew the event's text into the photo
                    // itself - showing it straight, no overlay panel on top
                    // that would just repeat the same details a second time.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageDataUrl} alt="תצוגה מקדימה" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <InvitePhotoCard
                      imageUrl={imageDataUrl}
                      headline={buildHeadline(eventCategory, categoryFields)}
                      dateText={[
                        readCommonFields(categoryFields).eventDate && formatEventDate(readCommonFields(categoryFields).eventDate),
                        readCommonFields(categoryFields).eventStart && `בשעה ${readCommonFields(categoryFields).eventStart}`,
                      ]
                        .filter(Boolean)
                        .join("\n")}
                      venueText={readCommonFields(categoryFields).venue}
                      extraLines={buildExtraDetailLines(eventCategory, categoryFields)}
                      textStyle={textStyle}
                    />
                  )}
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
          </>
          )}
        </form>
      </div>
    </div>
    </DesktopPhoneWrapper>
  );
}
