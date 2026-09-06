"use client";

import { useState } from "react";

/** Free-text "tell us what to change" chat for an already-generated
 *  invitation image - e.g. "add a sentence above the name" or "make the
 *  background blue". Unlike quickUpdateImage's structured field fixes
 *  (typo/name/date/address/time - free, unlimited), this is a genuine
 *  visual/design edit and counts against the same shared AI-generation
 *  quota as a brand-new design (see MAX_IMAGE_REGENERATIONS in
 *  api/ai-invite/route.ts) - every message sent here is one more use of
 *  it, whether or not it's the invite's very first design.
 *
 *  Each successful edit becomes the base for the NEXT one (currentImage),
 *  so a second request refines the result of the first rather than
 *  re-editing the original from scratch - "use this" then hands back
 *  whatever the latest successful edit produced. */
export default function DesignChangeChat({
  imageUrl,
  onUse,
  onClose,
}: {
  imageUrl: string;
  onUse: (newImageUrl: string) => void;
  onClose: () => void;
}) {
  const [currentImage, setCurrentImage] = useState(imageUrl);
  const [changed, setChanged] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [blocked, setBlocked] = useState(false);

  async function sendRequest() {
    const text = input.trim();
    if (!text || loading || blocked) return;
    setLoading(true);
    setError("");
    try {
      // Written defensively on purpose: the person typing this request is
      // not someone experienced at prompting an AI image model - in
      // testing, a plain "add a sentence above the name" made the model
      // DELETE the existing category label ("בר מצווה") entirely instead
      // of adding a new line above it untouched. Every existing element is
      // called out by name and explicitly protected, not just implied by
      // "keep everything else the same".
      const prompt = [
        "This is the exact current invitation image, attached. The person who made this invitation typed this one request, in their own words, describing ONE thing they want changed or added:",
        `"${text}"`,
        "Apply ONLY that one requested change. Do NOT remove, delete, retype, resize, move, or otherwise alter ANY text or element that already exists in the image, unless the request explicitly names that exact thing as what to change or remove. This absolutely includes: the event category label/headline (e.g. \"בר מצווה\", \"בת מצווה\", \"חתונה\", \"חינה\"), every name, the date, the time, the venue/address, and every decorative element - all of it must stay pixel-identical unless the request is specifically about that exact element. If the request asks to ADD something (a sentence, a line, a symbol), insert it as a brand new, separate element - make room for it by adjusting empty space or the overall composition, never by shrinking, replacing, or deleting an existing element to fit the new one in.",
        "Render every Hebrew word with perfect, exact spelling - copy any existing text exactly as it already appears in the image, character by character, do not invent, merge, drop, or add letters, and do not translate anything to English.",
      ].join("\n");
      const res = await fetch("/api/ai-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, baseImage: currentImage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה בביצוע השינוי");
        if (res.status === 403) setBlocked(true);
        return;
      }
      setCurrentImage(data.imageDataUrl);
      setChanged(true);
      setInput("");
      if (typeof data.regenerationsRemaining === "number") setRemaining(data.regenerationsRemaining);
    } catch {
      setError("שגיאת רשת - נסו שוב");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-invite-form">
      <p className="ai-invite-note">
        💬 כתבו כל בקשת שינוי עיצובי - למשל &quot;תוסיפו משפט מעל השם&quot; או &quot;תשנו את הרקע לגוון כחול&quot;. כל בקשה כאן
        נספרת במסגרת 10 שינויי העיצוב לחשבון (בשונה מתיקון שם/תאריך/כתובת/שעה, שתמיד חינם וללא הגבלה).
      </p>

      {remaining !== null && (
        <p className="ai-invite-note" style={{ fontWeight: 700, opacity: 0.85, marginBottom: 8 }}>
          נותרו {remaining} שינויי עיצוב לחשבון.
        </p>
      )}

      <div style={{ margin: "0 auto 16px", maxWidth: 220, borderRadius: 14, overflow: "hidden", aspectRatio: "9 / 16" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={currentImage} alt="תצוגה מקדימה" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="ai-chat-loading">
          <span className="ai-chat-spinner" aria-hidden="true" />
          <p className="ai-chat-question">מבצע את השינוי...</p>
        </div>
      ) : (
        !blocked && (
          <div className="ai-invite-field">
            <label>מה לשנות?</label>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="לדוגמה: תוסיפו משפט מעל השם..."
              onKeyDown={(e) => {
                if (e.key === "Enter") sendRequest();
              }}
            />
            {input.trim() && (
              <button type="button" className="ai-invite-generate-btn mt-2" onClick={sendRequest}>
                שליחה
              </button>
            )}
          </div>
        )
      )}

      <div className="ai-invite-result-actions" style={{ marginTop: 16 }}>
        {changed && (
          <button type="button" className="ai-invite-use-btn" onClick={() => onUse(currentImage)}>
            ✓ מושלם, נשתמש בזה
          </button>
        )}
        <button type="button" className="ai-invite-retry-btn" onClick={onClose}>
          {changed ? "ביטול" : "סגירה"}
        </button>
      </div>
    </div>
  );
}
