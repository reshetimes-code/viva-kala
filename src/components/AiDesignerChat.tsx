"use client";

import { useEffect, useRef, useState } from "react";

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

/** Where the guest's own uploaded photo sits relative to the designed text -
 *  matches the 4 layouts the user asked for. Kept separate from lib/templates
 *  PhotoPlacement (round/square/header/footer/side/background) - that set is
 *  for the coded template gallery's own chrome per-template; this one is
 *  rendered by InvitePhotoCard itself. */
export type UploadedPhotoPlacement = "round" | "half" | "quarter-top" | "quarter-bottom";

const PLACEMENT_CHOICES: { value: UploadedPhotoPlacement; label: string }[] = [
  { value: "round", label: "עיגול במרכז ההזמנה" },
  { value: "half", label: "חצי תמונה, חצי טקסט" },
  { value: "quarter-top", label: "רצועת תמונה למעלה" },
  { value: "quarter-bottom", label: "רצועת תמונה למטה" },
];

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

/** Replaces the old static guided-form AI generator with an actual back-
 *  and-forth "designer" - one short question at a time, answered with a
 *  tap (never required to type), because whoever fills this out might
 *  never have used an app before. A small free-text box is offered too,
 *  but it's the exception, not how this is meant to be used.
 *
 *  Once the style-preference chat itself is done (readyToGenerate), one
 *  more deterministic (not AI-authored) question is inserted before
 *  actually generating anything: whether to weave the guest's own photo
 *  into the design. "לא" falls straight through to the exact AI-generation
 *  flow this always had; "כן" skips AI generation entirely and hands the
 *  uploaded photo + chosen layout straight to onGenerated. */
export default function AiDesignerChat({
  eventCategory,
  categoryFields,
  onGenerated,
}: {
  eventCategory?: string;
  categoryFields?: Record<string, string>;
  onGenerated: (imageDataUrl: string, imagePrompt: string, uploadedPhotoPlacement?: UploadedPhotoPlacement) => void;
}) {
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

  // The deterministic photo step, entered once the chat itself is done.
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
        setError(data.error || "שגיאה בשיחה עם ה-AI");
        return;
      }
      setMessages(nextMessages);
      setTurn(data);
      if (data.readyToGenerate && data.imagePrompt) {
        setPendingPrompt(data.imagePrompt);
        setPhotoPhase("ask");
      }
    } catch {
      setError("שגיאת רשת - נסו שוב");
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
      setUploadedPhoto(reader.result as string);
      setPhotoPhase("placement");
    };
    reader.readAsDataURL(file);
  }

  function choosePlacement(placement: UploadedPhotoPlacement) {
    if (!uploadedPhoto) return;
    // No AI generation call at all for this path - it's the guest's real
    // photo, shown as-is with the designed text laid over it (same idea as
    // InvitePhotoCard everywhere else in the app), not something to hand to
    // an image model.
    onGenerated(uploadedPhoto, "", placement);
  }

  async function generateImage(prompt: string) {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/ai-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה ביצירת התמונה");
        return;
      }
      setResultUrl(data.imageDataUrl);
      setResultPrompt(prompt);
    } catch {
      setError("שגיאת רשת - נסו שוב");
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
        <img src={resultUrl} alt="תצוגה מקדימה שנוצרה ב-AI" className="ai-invite-result-img" />
        <div className="ai-invite-result-actions">
          <button type="button" className="ai-invite-use-btn" onClick={() => onGenerated(resultUrl, resultPrompt)}>
            ✓ מושלם, נשתמש בזה
          </button>
          <button type="button" className="ai-invite-retry-btn" onClick={tweakAgain}>
            🔄 שנו לי משהו
          </button>
        </div>
      </div>
    );
  }

  if (photoPhase === "ask") {
    return (
      <div className="ai-invite-form">
        <p className="ai-chat-question">רוצים לשלב תמונה משלכם בעיצוב?</p>
        <div className="ai-chat-options">
          <button type="button" className="ai-chat-option-btn" onClick={() => setPhotoPhase("upload")}>
            כן, יש לי תמונה
          </button>
          <button type="button" className="ai-chat-option-btn" onClick={declinePhoto}>
            לא, תיצרו לי עיצוב מקורי
          </button>
        </div>
      </div>
    );
  }

  if (photoPhase === "upload") {
    return (
      <div className="ai-invite-form">
        <p className="ai-chat-question">מעלים תמונה</p>
        {/* .image-upload-area's default dashed border/tint is styled for the
            dark create-flow page behind it - overridden here since this
            chat always sits inside a plain white SweetAlert popup instead. */}
        <label
          className="image-upload-area"
          style={{ display: "flex", minHeight: 90, border: "3px dashed #d4af7a", background: "#fbf6ec" }}
        >
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoFile} />
          <span className="upload-label" style={{ color: "#4a5568" }}>📤 לחצו כאן להעלאת תמונה</span>
        </label>
        <button
          type="button"
          className="ai-invite-retry-btn mt-3"
          onClick={() => setPhotoPhase("ask")}
        >
          חזרה
        </button>
      </div>
    );
  }

  if (photoPhase === "placement") {
    return (
      <div className="ai-invite-form">
        <p className="ai-chat-question">איך תרצו לשלב את התמונה?</p>
        <div className="ai-placement-grid">
          {PLACEMENT_CHOICES.map((choice) => (
            <button
              key={choice.value}
              type="button"
              className="ai-placement-btn"
              onClick={() => choosePlacement(choice.value)}
            >
              <PlacementIcon placement={choice.value} />
              <span>{choice.label}</span>
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
          <p className="ai-chat-question">{generating ? "יוצר/ת לכם עיצוב..." : "רגע, חושב/ת..."}</p>
        </div>
      ) : turn?.question ? (
        <>
          <p className="ai-chat-question">{turn.question}</p>
          <div className="ai-chat-options">
            {(turn.options ?? []).map((opt) => (
              <button key={opt} type="button" className="ai-chat-option-btn" onClick={() => chooseOption(opt)}>
                {opt}
              </button>
            ))}
          </div>
          <div className="ai-invite-field mt-3">
            <label>או שתכתבו לי בעצמכם (לא חובה)</label>
            <input value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder="ספרו לי מה בא לכם..." />
            {freeText.trim() && (
              <button type="button" className="ai-invite-generate-btn mt-2" onClick={sendFreeText}>
                שליחה
              </button>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
