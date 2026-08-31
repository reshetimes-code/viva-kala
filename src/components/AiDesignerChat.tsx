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
  onGenerated: (imageDataUrl: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [turn, setTurn] = useState<ChatTurn | null>(null);
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const startedRef = useRef(false);

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
        await generateImage(data.imagePrompt);
      }
    } catch {
      setError("שגיאת רשת - נסו שוב");
    } finally {
      setLoading(false);
    }
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
          <button type="button" className="ai-invite-use-btn" onClick={() => onGenerated(resultUrl)}>
            ✓ מושלם, נשתמש בזה
          </button>
          <button type="button" className="ai-invite-retry-btn" onClick={tweakAgain}>
            🔄 שנו לי משהו
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-invite-form">
      <p className="ai-invite-note">✨ המעצב/ת הדיגיטלי/ת שלנו שואל/ת כמה שאלות קצרות - פשוט לוחצים על התשובה שהכי מתאימה לכם.</p>

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
