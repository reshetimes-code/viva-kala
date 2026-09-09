"use client";

import { useEffect, useRef, useState } from "react";
import { buildGoldNightFields } from "@/lib/categoryFields";
import type { TemplateFields } from "@/lib/templates";
import { useLocale } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";

// UI copy only. PLACEMENT_CHOICES' `instruction` strings, the tweakAgain()
// chat messages, and everything sent to /api/ai-designer/chat or
// /api/ai-invite (eventCategory, categoryFields, prompts) are AI prompt
// content, not UI chrome - deliberately left Hebrew-only in both locales.
// turn.question/turn.options are the AI backend's own dynamic responses
// (already Hebrew, since the questionnaire is about a Hebrew invitation) -
// rendered as-is, not translated here.
const COPY = {
  he: {
    placementRound: "עיגול במרכז ההזמנה",
    placementHalf: "חצי תמונה, חצי טקסט",
    placementQuarterTop: "רצועת תמונה למעלה",
    placementQuarterBottom: "רצועת תמונה למטה",
    chatError: "שגיאה בשיחה עם ה-AI",
    networkError: "שגיאת רשת - נסו שוב",
    imageError: "שגיאה ביצירת התמונה",
    resultAlt: "תצוגה מקדימה שנוצרה ב-AI",
    useThis: "✓ מושלם, נשתמש בזה",
    tweakSomething: "🔄 שנו לי משהו",
    wantOwnPhoto: "רוצים לשלב תמונה משלכם בעיצוב?",
    yesHavePhoto: "כן, יש לי תמונה",
    noOriginalDesign: "לא, תיצרו לי עיצוב מקורי",
    uploadingPhoto: "מעלים תמונה",
    clickToUpload: "📤 לחצו כאן להעלאת תמונה",
    back: "חזרה",
    howToPlace: "איך תרצו לשלב את התמונה?",
    generatingDesign: "יוצר/ת לכם עיצוב...",
    thinking: "רגע, חושב/ת...",
    writeYourself: "או שתכתבו לי בעצמכם (לא חובה)",
    freeTextPlaceholder: "ספרו לי מה בא לכם...",
    send: "שליחה",
  },
  en: {
    placementRound: "Circle in the center of the invitation",
    placementHalf: "Half photo, half text",
    placementQuarterTop: "Photo strip on top",
    placementQuarterBottom: "Photo strip on bottom",
    chatError: "Error talking with the AI",
    networkError: "Network error - try again",
    imageError: "Error generating the image",
    resultAlt: "AI-generated preview",
    useThis: "✓ Perfect, let's use this",
    tweakSomething: "🔄 Change something for me",
    wantOwnPhoto: "Want to include your own photo in the design?",
    yesHavePhoto: "Yes, I have a photo",
    noOriginalDesign: "No, create an original design for me",
    uploadingPhoto: "Uploading a photo",
    clickToUpload: "📤 Click here to upload a photo",
    back: "Back",
    howToPlace: "How would you like to place the photo?",
    generatingDesign: "Creating your design...",
    thinking: "One moment, thinking...",
    writeYourself: "Or write it yourself (optional)",
    freeTextPlaceholder: "Tell me what you have in mind...",
    send: "Send",
  },
};

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

interface ChatTurn {
  question?: string;
  options?: string[];
  readyToGenerate: boolean;
  imagePrompt?: string;
}

/** Where the guest's own uploaded photo sits within the AI-designed image -
 *  each maps to an explicit English placement instruction folded into the
 *  same prompt (with all the style answers already in it) that would
 *  otherwise have generated a from-scratch design - so the photo becomes
 *  part of ONE AI-composed image, not a separate box glued on afterward. */
type UploadedPhotoPlacement = "round" | "half" | "quarter-top" | "quarter-bottom";

// The quality bar the client showed as a reference (a premium AI-made
// wedding invitation: a real couple photo blended into a night scene,
// a floral/string-light garland framing the WHOLE card - photo and text
// together as one piece, metallic gold Hebrew title, small icon+text detail
// rows with hairline gold dividers) - folded into every photo-placement
// instruction below so the result reliably reaches that level regardless
// of how the style-preference chat answers alone phrased it.
const PREMIUM_FINISH =
  "Keep the people/subject in the photo clearly recognizable and unaltered, but do subtly relight/color-grade the photo (tone, warmth, contrast) so it reads as naturally part of the same scene as the rest of the design instead of a flat pasted rectangle - the reference quality bar here is a real couple photo blended into a warm evening setting, not a raw unedited crop. Critically, the photo's edges must NOT be a hard cut: blend them into the surrounding design with a soft graduated fade/vignette (the photo gradually dissolving into the background color/texture at its border), the same way a professional poster composites a photo into its background - a visible straight rectangular edge around the photo is a failure. Frame the photo and the text together as ONE cohesive piece with a single decorative border wrapping the whole card (e.g. a floral garland with soft string lights for a romantic wedding, or a fitting motif for the event type) - not a decorated text area sitting separately below/beside a plain photo. Also match a premium, professionally-designed finish: a deep dark background (unless the user's own answers clearly asked for something light/pastel instead), an elegant metallic-gold Hebrew title with a subtle gradient/shine rather than flat color, thin gold hairline dividers between sections, and the event details laid out as small clean icon-plus-text rows (a small calendar icon before the date, a small location-pin icon before the venue, etc.) rather than plain paragraphs. Generous negative space, refined high-end typography throughout.";

const PLACEMENT_CHOICES: { value: UploadedPhotoPlacement; label: string; instruction: string }[] = [
  {
    value: "round",
    label: "עיגול במרכז ההזמנה",
    instruction: `Place the attached photo as a circular framed inset near the top-center of the design, and build the rest of the design (decorative elements, all the event text) around it. ${PREMIUM_FINISH}`,
  },
  {
    value: "half",
    label: "חצי תמונה, חצי טקסט",
    instruction: `Fill the top half of the image with the attached photo edge-to-edge, and design the bottom half with all the event text. ${PREMIUM_FINISH}`,
  },
  {
    value: "quarter-top",
    label: "רצועת תמונה למעלה",
    instruction: `Fill roughly the top quarter of the image with the attached photo as a wide banner strip, and design the rest below it with all the event text. ${PREMIUM_FINISH}`,
  },
  {
    value: "quarter-bottom",
    label: "רצועת תמונה למטה",
    instruction: `Fill roughly the bottom quarter of the image with the attached photo as a wide banner strip, and design the rest above it with all the event text. ${PREMIUM_FINISH}`,
  },
];

/** Display label for a PLACEMENT_CHOICES entry - the choice's own `label`
 *  field stays Hebrew (it's just an internal identity/default), the actual
 *  rendered text comes from COPY so it follows the dashboard's UI language.
 *  The `instruction` sent to the AI is separate and always English/Hebrew
 *  prompt content regardless of locale - untouched here. */
function placementLabel(value: UploadedPhotoPlacement, locale: Locale): string {
  const t = COPY[locale];
  switch (value) {
    case "round":
      return t.placementRound;
    case "half":
      return t.placementHalf;
    case "quarter-top":
      return t.placementQuarterTop;
    case "quarter-bottom":
      return t.placementQuarterBottom;
  }
}

/** Tiny sketch of each layout - a card outline with a filled block standing
 *  in for the photo and a few lines standing in for the text, so the option
 *  reads at a glance instead of needing the label alone to carry it. */
function PlacementIcon({ placement }: { placement: UploadedPhotoPlacement }) {
  const lineProps = { stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 32 40" width="30" height="38" fill="none">
      <rect x="1" y="1" width="30" height="38" rx="4" stroke="currentColor" strokeWidth="1.4" />
      {placement === "round" && (
        <>
          <circle cx="16" cy="13" r="7" fill="currentColor" opacity="0.35" />
          <line x1="8" y1="26" x2="24" y2="26" {...lineProps} />
          <line x1="10" y1="31" x2="22" y2="31" {...lineProps} />
        </>
      )}
      {placement === "half" && (
        <>
          <rect x="1" y="1" width="30" height="19" rx="4" fill="currentColor" opacity="0.35" />
          <line x1="7" y1="27" x2="25" y2="27" {...lineProps} />
          <line x1="9" y1="32" x2="23" y2="32" {...lineProps} />
        </>
      )}
      {placement === "quarter-top" && (
        <>
          <rect x="1" y="1" width="30" height="9" rx="3" fill="currentColor" opacity="0.35" />
          <line x1="7" y1="19" x2="25" y2="19" {...lineProps} />
          <line x1="9" y1="24" x2="23" y2="24" {...lineProps} />
          <line x1="10" y1="29" x2="22" y2="29" {...lineProps} />
        </>
      )}
      {placement === "quarter-bottom" && (
        <>
          <line x1="7" y1="9" x2="25" y2="9" {...lineProps} />
          <line x1="9" y1="14" x2="23" y2="14" {...lineProps} />
          <line x1="10" y1="19" x2="22" y2="19" {...lineProps} />
          <rect x="1" y="30" width="30" height="9" rx="3" fill="currentColor" opacity="0.35" />
        </>
      )}
    </svg>
  );
}

/** The AI's own option text often ends with a parenthetical clarifying
 *  example ("קלאסי ויוקרתי (זהב ושיש)") - left inline it wraps mid-word
 *  wherever the button happens to be narrow, splitting the parenthesis
 *  itself across two lines. Rendered as its own line under the main text
 *  instead, always a single clean unit regardless of button width. */
function OptionLabel({ text }: { text: string }) {
  const match = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(text);
  if (!match) return <>{text}</>;
  const [, main, parenthetical] = match;
  return (
    <>
      {main}
      <span className="ai-chat-option-sub">({parenthetical})</span>
    </>
  );
}

/** Replaces the old static guided-form AI generator with an actual back-
 *  and-forth "designer" - one short question at a time, answered with a
 *  tap (never required to type), because whoever fills this out might
 *  never have used an app before. A small free-text box is offered too,
 *  but it's the exception, not how this is meant to be used. */
export default function AiDesignerChat({
  eventCategory,
  categoryFields,
  onGenerated,
}: {
  eventCategory?: string;
  categoryFields?: Record<string, string>;
  /** The third argument, when present, means "render this via the coded
   *  template gallery's own component with these fields" instead of
   *  treating imageDataUrl as an AI-drawn finished image - see the
   *  gold-night branch in choosePlacement below for why. */
  onGenerated: (imageDataUrl: string, imagePrompt: string, codedTemplate?: { templateId: string; templateFields: TemplateFields }) => void;
}) {
  const { locale } = useLocale();
  const t = COPY[locale];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [turn, setTurn] = useState<ChatTurn | null>(null);
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  // The exact prompt that produced resultUrl - handed back to onGenerated
  // alongside the image so a later field edit can regenerate by
  // substituting just the changed values into this same prompt, instead of
  // re-running the whole style-preference chat.
  const [resultPrompt, setResultPrompt] = useState("");
  const startedRef = useRef(false);

  // The deterministic photo step, entered once the style chat itself is
  // done (readyToGenerate) - "לא" falls straight through to the exact
  // AI-generation call this always made; "כן" folds a placement
  // instruction into that SAME prompt (all the questionnaire answers still
  // in it) and sends the uploaded photo along as the base image, so the
  // result is one AI-composed design with the real photo in it - not a
  // separate design plus a plain box glued onto the photo afterward.
  const [photoPhase, setPhotoPhase] = useState<"none" | "ask" | "upload" | "placement">("none");
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);

  async function askChat(nextMessages: ChatMessage[]) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai-designer/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, eventCategory, categoryFields }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.chatError);
        return;
      }
      setMessages(nextMessages);
      setTurn(data);
      if (data.readyToGenerate && data.imagePrompt) {
        setPendingPrompt(data.imagePrompt);
        setPhotoPhase("ask");
      }
    } catch {
      setError(t.networkError);
    } finally {
      setLoading(false);
    }
  }

  function declinePhoto() {
    setPhotoPhase("none");
    generateImage(pendingPrompt);
  }

  function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // For a wedding, the coded "gold-night" template is a proven,
      // reference-quality match (real CSS/SVG text and icons, so - unlike
      // the AI-generation path below - there is zero risk of the model
      // hallucinating/misspelling a Hebrew word into the image) - skip the
      // AI entirely and use it directly with the guest's own photo as its
      // background, no placement question needed (gold-night only has the
      // one full-photo-background layout).
      const goldNightFields = eventCategory === "חתונה" ? buildGoldNightFields(categoryFields, dataUrl) : null;
      if (goldNightFields) {
        setPhotoPhase("none");
        onGenerated(dataUrl, "", { templateId: "gold-night", templateFields: goldNightFields });
        return;
      }
      setUploadedPhoto(dataUrl);
      setPhotoPhase("placement");
    };
    reader.readAsDataURL(file);
  }

  function choosePlacement(placement: UploadedPhotoPlacement) {
    if (!uploadedPhoto) return;
    setPhotoPhase("none");
    const instruction = PLACEMENT_CHOICES.find((c) => c.value === placement)?.instruction ?? "";
    generateImage(`${pendingPrompt} ${instruction}`, uploadedPhoto);
  }

  async function generateImage(prompt: string, baseImage?: string) {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/ai-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(baseImage ? { prompt, baseImage } : { prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.imageError);
        return;
      }
      setResultUrl(data.imageDataUrl);
      setResultPrompt(prompt);
    } catch {
      setError(t.networkError);
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    askChat([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chooseOption(option: string) {
    askChat([...messages, { role: "model", text: turn?.question ?? "" }, { role: "user", text: option }]);
  }

  function sendFreeText() {
    if (!freeText.trim()) return;
    askChat([...messages, { role: "model", text: turn?.question ?? "" }, { role: "user", text: freeText.trim() }]);
    setFreeText("");
  }

  function tweakAgain() {
    setResultUrl(null);
    askChat([
      ...messages,
      { role: "model", text: "הנה מה שיצרתי." },
      { role: "user", text: "אני רוצה לשנות משהו קטן בעיצוב, תשאל אותי מה." },
    ]);
  }

  if (resultUrl) {
    return (
      <div className="ai-invite-result">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={resultUrl} alt={t.resultAlt} className="ai-invite-result-img" />
        <div className="ai-invite-result-actions">
          <button type="button" className="ai-invite-use-btn" onClick={() => onGenerated(resultUrl, resultPrompt)}>
            {t.useThis}
          </button>
          <button type="button" className="ai-invite-retry-btn" onClick={tweakAgain}>
            {t.tweakSomething}
          </button>
        </div>
      </div>
    );
  }

  if (photoPhase === "ask") {
    return (
      <div className="ai-invite-form">
        <p className="ai-chat-question">{t.wantOwnPhoto}</p>
        <div className="ai-chat-options">
          <button type="button" className="ai-chat-option-btn" onClick={() => setPhotoPhase("upload")}>
            {t.yesHavePhoto}
          </button>
          <button type="button" className="ai-chat-option-btn" onClick={declinePhoto}>
            {t.noOriginalDesign}
          </button>
        </div>
      </div>
    );
  }

  if (photoPhase === "upload") {
    return (
      <div className="ai-invite-form">
        <p className="ai-chat-question">{t.uploadingPhoto}</p>
        {/* .image-upload-area's default dashed border/tint is styled for the
            dark create-flow page behind it - overridden here since this
            chat always sits inside a plain white SweetAlert popup instead. */}
        <label
          className="image-upload-area"
          style={{ display: "flex", minHeight: 90, border: "3px dashed #d4af7a", background: "#fbf6ec" }}
        >
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoFile} />
          <span className="upload-label" style={{ color: "#4a5568" }}>{t.clickToUpload}</span>
        </label>
        <button
          type="button"
          className="ai-invite-retry-btn mt-3"
          onClick={() => setPhotoPhase("ask")}
        >
          {t.back}
        </button>
      </div>
    );
  }

  if (photoPhase === "placement") {
    return (
      <div className="ai-invite-form">
        <p className="ai-chat-question">{t.howToPlace}</p>
        <div className="ai-placement-grid">
          {PLACEMENT_CHOICES.map((choice) => (
            <button
              key={choice.value}
              type="button"
              className="ai-placement-btn"
              onClick={() => choosePlacement(choice.value)}
            >
              <PlacementIcon placement={choice.value} />
              <span>{placementLabel(choice.value, locale)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ai-invite-form">
      {/* The "designer asks a few short questions" note used to live here,
          re-rendered atop every single turn of the whole conversation -
          it's now a one-time SweetAlert shown before this chat ever opens
          (see openAiDesigner in create/image/page.tsx). */}
      {error && <div className="alert alert-error">{error}</div>}

      {loading || generating ? (
        <div className="ai-chat-loading">
          <span className="ai-chat-spinner" aria-hidden="true" />
          <p className="ai-chat-question">{generating ? t.generatingDesign : t.thinking}</p>
        </div>
      ) : turn?.question ? (
        <>
          <p className="ai-chat-question">{turn.question}</p>
          <div className="ai-chat-options">
            {(turn.options ?? []).map((opt) => (
              <button key={opt} type="button" className="ai-chat-option-btn" onClick={() => chooseOption(opt)}>
                <OptionLabel text={opt} />
              </button>
            ))}
          </div>
          <div className="ai-invite-field mt-3">
            <label>
              <OptionLabel text={t.writeYourself} />
            </label>
            <input value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder={t.freeTextPlaceholder} />
            {freeText.trim() && (
              <button type="button" className="ai-invite-generate-btn mt-2" onClick={sendFreeText}>
                {t.send}
              </button>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
