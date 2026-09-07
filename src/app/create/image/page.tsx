"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import DesktopPhoneWrapper from "@/components/DesktopPhoneWrapper";
import AiDesignerChat from "@/components/AiDesignerChat";
import DesignChangeChat from "@/components/DesignChangeChat";
import CategoryFieldsForm from "@/components/CategoryFieldsForm";
import InvitePhotoCard from "@/components/InvitePhotoCard";
import ImageCropModal from "@/components/ImageCropModal";
import { TemplateCard, type TemplateFields } from "@/lib/templates";
import { EVENT_CATEGORIES, isEventCategory, type EventCategory } from "@/lib/eventCategories";
import { CATEGORY_FIELD_DEFS, hasCustomFields, findMissingRequiredField, readCommonFields, buildHeadline, buildExtraDetailLines, formatEventDate } from "@/lib/categoryFields";
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
  // Set only via AiDesignerChat's "want to use your own photo?" step for a
  // wedding - real CSS/SVG text from the coded template gallery instead of
  // anything AI-drawn, so there's zero spelling-error risk. When set, this
  // invite is actually submitted as mode:"template" (see handleSubmit) -
  // imageDataUrl/categoryFields above still hold whatever was typed into
  // this page's own form, but the coded template's own fields are what
  // actually gets saved and shown to guests.
  const [codedTemplate, setCodedTemplate] = useState<{ templateId: string; templateFields: TemplateFields } | null>(null);
  // A snapshot of categoryFields at the exact moment the current baked-text
  // image was generated. Editing name/date/venue/parents afterwards doesn't
  // touch the image's actual pixels (the AI only draws what it was told at
  // generation time) - comparing against this snapshot is how the "your
  // edits changed the invitation" banner below knows the image is now
  // out of sync with the form, instead of silently letting someone save an
  // invite whose text fields don't match what guests will actually see.
  const [bakedFieldsSnapshot, setBakedFieldsSnapshot] = useState<Record<string, string> | undefined>(
    initialData?.textStyle?.imageHasText ? initialData?.categoryFields : undefined
  );
  // Same idea as bakedFieldsSnapshot, but for the category itself - changing
  // "מה חוגגים?" (e.g. בר מצווה -> בת מצווה, or -> חתונה) after the image was
  // generated didn't used to trip the staleness check at all whenever the
  // field VALUES happened to stay identical (categoryFields keys are shared
  // across the bar/bat-mitzvah categories) - the banner/button just silently
  // never appeared even though the baked image still shows the old category.
  const [bakedCategorySnapshot, setBakedCategorySnapshot] = useState<EventCategory | undefined>(
    initialData?.textStyle?.imageHasText ? initialData?.eventCategory : undefined
  );
  // The FIXED anchor a correction is always built from - the very first
  // prompt/fields for this image, set once and never touched again. Every
  // "🪄 עדכון התמונה" diffs the current fields against originalFieldsSnapshot
  // (not against whatever a previous correction happened to change) and
  // sends baseImagePrompt + one clean correction list - never a correction
  // stacked on top of a previous correction. Falls back to the older
  // lastImagePrompt field for invites saved before this existed.
  const [baseImagePrompt, setBaseImagePrompt] = useState<string | undefined>(
    initialData?.textStyle?.baseImagePrompt ?? initialData?.textStyle?.lastImagePrompt
  );
  const [originalFieldsSnapshot, setOriginalFieldsSnapshot] = useState<Record<string, string> | undefined>(
    initialData?.textStyle?.originalFieldsSnapshot ?? (initialData?.textStyle?.imageHasText ? initialData?.categoryFields : undefined)
  );
  const [quickUpdating, setQuickUpdating] = useState(false);
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

  // How many of the 10 AI design-generations/design-chat-edits are left
  // for this account (quickUpdateImage's plain field fixes never touch
  // this - see MAX_IMAGE_REGENERATIONS in api/ai-invite/route.ts). null
  // until the first fetch resolves, so the bubble below simply doesn't
  // render rather than flashing "0" first.
  const [regenerationsRemaining, setRegenerationsRemaining] = useState<number | null>(null);
  async function refreshRegenerationsRemaining() {
    try {
      const res = await fetch("/api/ai-invite");
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.regenerationsRemaining === "number") setRegenerationsRemaining(data.regenerationsRemaining);
    } catch {
      // Non-critical display-only counter - a failed fetch just leaves
      // whatever was already shown (or nothing yet).
    }
  }
  useEffect(() => {
    refreshRegenerationsRemaining();
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // True while categoryFields (or the category itself) have drifted away
  // from whatever was baked into the current AI-generated image - see
  // bakedFieldsSnapshot/bakedCategorySnapshot above.
  const imageIsStale =
    imageHasBakedText &&
    !!bakedFieldsSnapshot &&
    (JSON.stringify(categoryFields) !== JSON.stringify(bakedFieldsSnapshot) || eventCategory !== bakedCategorySnapshot);

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

    // One-time explainer, its own separate step - not sitting inline atop
    // every single question turn inside the chat itself (which is what
    // AiDesignerChat used to render it as, every re-render for the whole
    // conversation).
    Swal.fire({
      icon: "info",
      title: "מעצב/ת ה-AI",
      text: "המעצב/ת הדיגיטלי/ת שלנו שואל/ת כמה שאלות קצרות - פשוט לוחצים על התשובה שהכי מתאימה לכם.",
      confirmButtonText: "בואו נתחיל",
      confirmButtonColor: "#d4af7a",
      background: "#1f2a33",
      color: "#fff",
    }).then(() => openAiDesignerChat());
  }

  function openAiDesignerChat() {
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
              onGenerated={(url, prompt, codedTemplateResult) => {
                if (codedTemplateResult) {
                  // The guest's own photo, used as-is by a coded template's
                  // real CSS/SVG text - no AI drawing involved, so none of
                  // the AI-regeneration staleness tracking below applies.
                  setCodedTemplate(codedTemplateResult);
                  setImageDataUrl(url);
                  setImageHasBakedText(false);
                  Swal.close();
                  return;
                }
                // Its own prompt asked Gemini to draw the event's text right
                // into the image (whether or not the guest's own photo was
                // folded into that same prompt+generation) - InvitePhotoCard's
                // separate panel would just duplicate that, so it's marked
                // here to be skipped.
                setCodedTemplate(null);
                setImageHasBakedText(true);
                const fieldsNow = { ...categoryFields };
                setTextStyle({
                  ...DEFAULT_TEXT_STYLE,
                  imageHasText: true,
                  baseImagePrompt: prompt,
                  originalFieldsSnapshot: fieldsNow,
                  lastImagePrompt: prompt,
                });
                setImageDataUrl(url);
                // This is a brand-new base image (whether it's the very
                // first one, or the user picked "🔄 יצירה מחדש" to start
                // over) - both anchors reset to right now, same as the
                // "in sync" baseline the staleness check below compares
                // future edits against.
                setBaseImagePrompt(prompt);
                setOriginalFieldsSnapshot(fieldsNow);
                setBakedFieldsSnapshot(fieldsNow);
                setBakedCategorySnapshot(eventCategory);
                refreshRegenerationsRemaining();
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

  // Handed to DesignChangeChat so it can complete a vague/partial request
  // ("add 'הנכם מוזמנים ל...'") sensibly instead of inserting exactly that
  // literal, dangling text - see the prompt in DesignChangeChat itself for
  // why that matters (a real production failure, not a hypothetical one).
  function buildEventDetailsSummaryForChat(): string {
    const parts: string[] = [];
    if (eventCategory) parts.push(`סוג אירוע: ${eventCategory}`);
    if (usesCustomFields) {
      const common = readCommonFields(categoryFields);
      const name =
        categoryFields.celebrantName || [categoryFields.groomName, categoryFields.brideName].filter(Boolean).join(" ו");
      if (name) parts.push(`חוגג/ת: ${name}`);
      if (categoryFields.familyName) parts.push(`משפחת ${categoryFields.familyName}`);
      if (common.eventDate) parts.push(`תאריך: ${formatEventDate(common.eventDate)}`);
      if (common.venue) parts.push(`מקום: ${common.venue}`);
    } else {
      const names = celebrants.map((c) => c.name).filter(Boolean).join(", ");
      if (names) parts.push(`חוגג/ת: ${names}`);
      if (eventDate) parts.push(`תאריך: ${formatEventDate(eventDate)}`);
      if (address) parts.push(`מקום: ${address}`);
    }
    return parts.join(". ");
  }

  // "💬 בקשו שינוי בצ'אט" - free-text design requests on the CURRENT image
  // ("add a sentence above the name", "make the background blue"), as
  // opposed to quickUpdateImage's structured field-only fixes. A real
  // visual edit, so unlike that one it counts against the shared AI-design
  // quota (see MAX_IMAGE_REGENERATIONS in api/ai-invite/route.ts) - the
  // component itself sends baseImage without the freeCorrection flag.
  function openDesignChangeChat() {
    if (!imageDataUrl) return;
    // The full explanation used to sit as inline text inside the chat
    // itself - moved to its own notice, shown once before the chat opens,
    // so it actually gets read instead of blending into the form as fine
    // print. Kept short on purpose (the quota rule alone, not a full essay).
    Swal.fire({
      icon: "warning",
      title: "שימו לב - חשוב לקרוא",
      html:
        'כתבו כל בקשת שינוי עיצובי - למשל "הוסיפו משפט מעל השם" או "שנו את הרקע לגוון כחול".<br><br>' +
        "<b>כל בקשה כאן נספרת</b> במסגרת 10 שינויי העיצוב לחשבון (בשונה מתיקון שם/תאריך/כתובת/שעה, שתמיד חינם וללא הגבלה).",
      confirmButtonText: "הבנתי, בואו נתחיל",
      confirmButtonColor: "#d4af7a",
      background: "#1f2a33",
      color: "#fff",
    }).then((result) => {
      if (result.isConfirmed) openDesignChangeChatModal();
    });
  }

  function openDesignChangeChatModal() {
    if (!imageDataUrl) return;
    const container = document.createElement("div");
    Swal.fire({
      html: container,
      showConfirmButton: false,
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
            <DesignChangeChat
              imageUrl={imageDataUrl}
              eventDetails={buildEventDetailsSummaryForChat()}
              onUse={(newUrl) => {
                setImageDataUrl(newUrl);
                Swal.close();
              }}
              onClose={() => Swal.close()}
            />
          </>
        );
      },
      willClose: () => {
        aiModalRootRef.current?.unmount();
        aiModalRootRef.current = null;
        // Refreshed on close regardless of how (used/canceled/×) - simpler
        // and just as accurate as threading the count through every one of
        // DesignChangeChat's own successful-edit callbacks individually.
        refreshRegenerationsRemaining();
      },
    });
  }

  // "🪄 עדכון התמונה" after editing a field - regenerates in ONE direct call,
  // no chat, no questions. Always built from the FIXED baseImagePrompt/
  // originalFieldsSnapshot (never from a previous correction) - a real bug
  // found in production: the earlier version kept appending a new
  // "IMPORTANT CORRECTION" block onto whatever the previous correction had
  // already produced, and a quick add-then-undo edit (a stray character
  // typed and immediately deleted) became TWO contradictory correction
  // blocks stacked on each other ("change X to Y" ... "change Y back to
  // X") - which is exactly what corrupted a name into gibberish in the
  // generated image. Diffing against the one original snapshot instead
  // means the correction list sent to Gemini is always the true, current,
  // non-contradictory cumulative diff - never edit-of-an-edit history.
  // Editing an existing (already-saved) invite starts with imageDataUrl
  // pointing at a stored image URL (Google Cloud Storage), not a data: URL -
  // the AI edit call needs the actual base64 bytes to attach as an image
  // input. That conversion happens SERVER-SIDE (see /api/ai-invite) rather
  // than fetching it here in the browser first: a stored invite's photo
  // lives on storage.googleapis.com, a different origin than this app, and
  // the bucket has no CORS policy allowing a page on this origin to read it
  // via fetch() - every "quick update" on an already-saved invite failed
  // with a browser-console CORS error (surfacing here only as a generic
  // "שגיאת רשת") before this moved server-side, where CORS doesn't apply at
  // all. A freshly-generated-this-session image is already a data: URL, so
  // the server just uses it as-is either way.

  async function quickUpdateImage() {
    if (!baseImagePrompt || !originalFieldsSnapshot || !imageDataUrl) {
      openAiDesigner();
      return;
    }
    const defs = eventCategory ? CATEGORY_FIELD_DEFS[eventCategory] ?? [] : [];
    const corrections: string[] = [];
    for (const key of Object.keys(categoryFields)) {
      const oldVal = (originalFieldsSnapshot[key] ?? "").trim();
      const newVal = (categoryFields[key] ?? "").trim();
      if (!newVal || oldVal === newVal) continue;
      const label = defs.find((d) => d.key === key)?.label.replace(/\s*\(לא חובה\)\s*$/, "") ?? key;
      corrections.push(
        oldVal
          ? `The "${label}" text must read exactly "${newVal}" (not "${oldVal}").`
          : `Add the "${label}" text, exactly: "${newVal}".`
      );
    }
    // The category itself (e.g. בר מצווה -> בת מצווה, or -> חתונה) can
    // change with the field VALUES staying identical (the bar/bat-mitzvah
    // categories share the same field keys) - that wouldn't show up in the
    // per-field diff above at all, so it's checked separately against
    // bakedCategorySnapshot (what the image currently baked-in reflects,
    // not the very first generation's category).
    const categoryChanged = eventCategory !== bakedCategorySnapshot;
    if (categoryChanged && eventCategory && bakedCategorySnapshot) {
      corrections.push(
        `This was designed for a "${bakedCategorySnapshot}" event - it is now a "${eventCategory}" event instead. Update any category-specific wording, labels, or symbols in the image accordingly.`
      );
    }
    if (corrections.length === 0) {
      // Fields (and category) are back to exactly what they were at the
      // original generation - the base prompt alone already matches,
      // nothing to ask Gemini to change.
      setBakedFieldsSnapshot({ ...categoryFields });
      setBakedCategorySnapshot(eventCategory);
      return;
    }

    // The actual current image is attached below (as `baseImage`) so this is
    // a true edit of those exact pixels, not a blind re-describe-and-
    // regenerate from text alone - a from-scratch generation model has no
    // way to reproduce the same background/colors/fonts twice from a prompt
    // alone, which is exactly what used to make a plain typo fix come back
    // with a randomly different-looking design. With the real image in
    // hand, the model only needs to touch the specific text called out
    // below, not reconstruct the whole thing from a description.
    const updatedPrompt = [
      "This is the exact current invitation image, attached. Edit ONLY the specific text corrections listed below - keep every other pixel unchanged: same style, colors, layout, composition, background, decorative elements and typography. Render every Hebrew word with perfect, exact spelling - check each one character by character against the quoted text before finalizing:",
      ...corrections,
    ].join("\n");

    setQuickUpdating(true);
    try {
      const res = await fetch("/api/ai-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: updatedPrompt, baseImage: imageDataUrl, freeCorrection: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        Swal.fire({
          icon: "error",
          title: "שגיאה בעדכון התמונה",
          text: data.error || "נסו שוב",
          confirmButtonText: "הבנתי",
          confirmButtonColor: "#d4af7a",
          background: "#1f2a33",
          color: "#fff",
        });
        return;
      }
      setImageDataUrl(data.imageDataUrl);
      setImageHasBakedText(true);
      // baseImagePrompt/originalFieldsSnapshot deliberately stay untouched -
      // only the "is the preview in sync" tracking moves forward.
      setTextStyle((prev) => ({
        ...(prev ?? DEFAULT_TEXT_STYLE),
        imageHasText: true,
        baseImagePrompt,
        originalFieldsSnapshot,
        lastImagePrompt: updatedPrompt,
      }));
      setBakedFieldsSnapshot({ ...categoryFields });
      setBakedCategorySnapshot(eventCategory);
    } catch {
      Swal.fire({
        icon: "error",
        title: "שגיאת רשת",
        text: "נסו שוב",
        confirmButtonText: "הבנתי",
        confirmButtonColor: "#d4af7a",
        background: "#1f2a33",
        color: "#fff",
      });
    } finally {
      setQuickUpdating(false);
    }
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
    if (imageIsStale) {
      const { isConfirmed } = await Swal.fire({
        icon: "warning",
        title: "התמונה לא מעודכנת",
        text: "שיניתם פרטים אחרי שהתמונה נוצרה - השינוי לא יופיע בהזמנה עד שתעדכנו את התמונה.",
        confirmButtonText: "🪄 עדכון התמונה עכשיו",
        showCancelButton: true,
        cancelButtonText: "ביטול",
        confirmButtonColor: "#d4af7a",
        background: "#1f2a33",
        color: "#fff",
      });
      if (isConfirmed) quickUpdateImage();
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
          // Real CSS/SVG text via the coded template gallery instead of an
          // AI-drawn image - the API route stores/serves this exactly like
          // any invite made through /create/templates.
          ...(codedTemplate ? { mode: "template", templateId: codedTemplate.templateId, templateFields: codedTemplate.templateFields } : {}),
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
      {quickUpdating && (
        <div className="ai-fullscreen-loader" role="status" aria-live="polite">
          <span className="ai-fullscreen-loader-spinner" aria-hidden="true" />
          <p>מעדכן את התמונה עם הפרטים החדשים...</p>
        </div>
      )}
      {/* A sibling of .create-wrapper, not nested inside any
          .category-section - those have their own backdrop-filter, which
          would silently turn position:fixed here into "fixed to that
          scrolling card" instead of the real screen (the exact bug already
          hit once with the stale-image banner). Rendered directly under
          .create-page (no filter/transform of its own) needs no portal. */}
      {regenerationsRemaining !== null && eventCategory && (
        <div className="regen-bubble">
          נשאר עוד {regenerationsRemaining} שינויי{regenerationsRemaining === 1 ? " " : "ים "}עיצוב לחשבון
        </div>
      )}
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
            <CategoryFieldsForm
              category={eventCategory}
              values={categoryFields}
              onChange={setCategoryFields}
              imageIsStale={imageIsStale}
              quickUpdating={quickUpdating}
              onUpdateImage={quickUpdateImage}
            />
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
              {/* defaultValue, not value - a controlled type="date"/type="time"
                  input forces React to reassign .value on every keystroke
                  elsewhere in this (large) form's re-renders, and on iOS
                  Safari that fights the native picker while it's open,
                  making it auto-confirm/close early. Same fix as
                  TemplateFillForm's date field and InviteView's lead-flow
                  date question. */}
              <input
                className="inputs-fields"
                type="date"
                defaultValue={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div className="mt-3">
              <label className="bottom-section-text">שעת התחלה</label>
              <input
                className="inputs-fields"
                type="time"
                defaultValue={eventStart}
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageSelect}
            />

            {/* The image itself is already shown right below in the "ככה
                ההזמנה תראה אצל האורחים" preview, alongside "יצירה מחדש"/
                "שינוי בצ'אט" - nothing to show here once there's an image. */}
            {!imageDataUrl && (
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
                <p
                  className="upper-section-text"
                  style={{ fontSize: 17, fontWeight: 800, opacity: 0.95, textAlign: "center", fontFamily: "'Assistant', sans-serif" }}
                >
                  ככה ההזמנה תראה אצל האורחים
                </p>
                {/* The "⚠️ עדכון התמונה" banner itself now lives inside
                    CategoryFieldsForm (right by the fields that go stale) -
                    this preview just keeps the dimmed/desaturated look so
                    it's visually obvious the image shown here is outdated. */}
                <div
                  style={{
                    aspectRatio: "9 / 16", maxWidth: 260, margin: "12px auto 0", borderRadius: 16, overflow: "hidden",
                    opacity: imageIsStale ? 0.55 : 1, filter: imageIsStale ? "grayscale(.4)" : "none",
                  }}
                >
                  {codedTemplate ? (
                    <TemplateCard templateId={codedTemplate.templateId} fields={codedTemplate.templateFields} />
                  ) : imageHasBakedText ? (
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
                {/* Moved down here, right under the actual preview, next to
                    the new free-text design-change chat - both act on the
                    image people can actually see at this point, instead of
                    "יצירה מחדש" sitting alone up by the upload controls. */}
                <div className="design-actions-row mt-3">
                  {/* Design-chat edits an AI-drawn image's pixels - meaningless
                      for a coded template, which has no such image to edit. */}
                  {!codedTemplate && (
                    <button type="button" className="image-choice-btn image-choice-btn-ai" onClick={openDesignChangeChat}>
                      שינוי עיצובי בצ&apos;אט
                    </button>
                  )}
                  <button
                    type="button"
                    className="image-choice-btn"
                    onClick={() => {
                      setImageDataUrl(null);
                      setCodedTemplate(null);
                    }}
                  >
                    יצירה מחדש
                  </button>
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
