"use client";

import { useState } from "react";

const STYLE_OPTIONS = ["אלגנטי", "מודרני", "כיפי וצבעוני", "רומנטי", "מינימליסטי", "בוהו"];

/** Guided form (+ optional free text) that asks the questions a designer
 *  would - color, background, elements, style - and turns the answers into
 *  an AI-generated background image, instead of picking from fixed templates.
 *  The image comes back with no text baked in (AI models can't reliably
 *  render accurate Hebrew), so it's a design/background to build on. */
export default function AiInviteGenerator({
  defaultEventType,
  onGenerated,
}: {
  defaultEventType?: string;
  onGenerated: (imageDataUrl: string) => void;
}) {
  const [eventType, setEventType] = useState(defaultEventType ?? "");
  const [color, setColor] = useState("");
  const [background, setBackground] = useState("");
  const [elements, setElements] = useState("");
  const [style, setStyle] = useState(STYLE_OPTIONS[0]);
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, color, background, elements, style, freeText }),
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
      setLoading(false);
    }
  }

  if (resultUrl) {
    return (
      <div className="ai-invite-result">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={resultUrl} alt="תצוגה מקדימה שנוצרה ב-AI" className="ai-invite-result-img" />
        <div className="ai-invite-result-actions">
          <button type="button" className="ai-invite-use-btn" onClick={() => onGenerated(resultUrl)}>
            ✓ השתמשו בתמונה הזאת
          </button>
          <button type="button" className="ai-invite-retry-btn" onClick={() => setResultUrl(null)}>
            🔄 נסו שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="ai-invite-form" onSubmit={handleGenerate}>
      <p className="ai-invite-note">
        עונים על כמה שאלות (או כותבים תיאור חופשי) וה-AI יוצר לכם רקע/עיצוב מקורי - בלי טקסט (שמות ותאריך
        ממלאים בהמשך), במקום לבחור מתוך תבניות קבועות.
      </p>

      <div className="ai-invite-field">
        <label>סוג האירוע</label>
        <input value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="חתונה, בר מצווה..." />
      </div>
      <div className="ai-invite-field">
        <label>צבעים מובילים</label>
        <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="זהב וורוד, טורקיז..." />
      </div>
      <div className="ai-invite-field">
        <label>סגנון רקע</label>
        <input
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          placeholder="מינימליסטי, כהה ומסתורי, בהיר וקליל..."
        />
      </div>
      <div className="ai-invite-field">
        <label>אלמנטים ופרחים</label>
        <input
          value={elements}
          onChange={(e) => setElements(e.target.value)}
          placeholder="פרחי פיאוני, קונפטי זהב, עלי דקל..."
        />
      </div>
      <div className="ai-invite-field">
        <label>סגנון כללי</label>
        <select value={style} onChange={(e) => setStyle(e.target.value)}>
          {STYLE_OPTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="ai-invite-field">
        <label>תיאור חופשי נוסף (רשות)</label>
        <textarea
          rows={3}
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="כל דבר נוסף שתרצו לספר על העיצוב שדמיינתם..."
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button type="submit" className="ai-invite-generate-btn" disabled={loading}>
        {loading ? "יוצר עיצוב..." : "✨ צרו לי עיצוב"}
      </button>
    </form>
  );
}
