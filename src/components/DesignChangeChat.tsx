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
  eventDetails,
  onUse,
  onClose,
}: {
  imageUrl: string;
  /** One-line plain-language summary of what's already known about this
   *  event ("סוג אירוע: בר מצווה. חוגג/ת: אריאל לוי. תאריך: 30/09/2026...")
   *  - lets the model complete a vague/partial request sensibly (see
   *  sendRequest below) instead of inserting exactly the literal text
   *  typed, dangling mid-sentence. */
  eventDetails?: string;
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
  // Two independent attempts come back per request (one credit total, not
  // two - see variantCount in api/ai-invite/route.ts) - held here until the
  // client picks one; currentImage/changed only update once they do, so
  // "ביטול" at that point cleanly discards both without half-applying one.
  const [pendingVariants, setPendingVariants] = useState<string[] | null>(null);

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
        "You are a professional invitation graphic designer helping a client who is not experienced at writing AI prompts. This is the exact current invitation image, attached. The client typed this one request, in their own words, describing ONE thing they want changed or added:",
        `"${text}"`,
        eventDetails && `Known details about this event (use these to fill in context intelligently - see below): ${eventDetails}.`,
        // The actual production failure this guards against: a client
        // asked to add "הנכם מוזמנים ל..." (a template opening phrase that
        // trails off) and the model inserted that exact literal fragment,
        // dangling mid-sentence - a broken result the client would have
        // had to spend ANOTHER credit fixing. A real professional designer
        // would obviously complete it ("...לבר המצווה של אריאל") using the
        // event's own details, not transcribe a half-finished instruction.
        "If the request is a partial phrase, a template-like opening ('...', 'תוסיפו משפט כמו...', a sentence that trails off), or otherwise vague, use good professional judgment to complete it into a natural, polished, GRAMMATICALLY COMPLETE sentence using the known event details above (names, category, date, venue) and what's already visible in the image - never insert a literal half-finished fragment. The goal is the best-looking finished result in one try, the way a professional designer would interpret a client's brief - not a literal transcription of exactly the words typed.",
        // The follow-up failure this guards against: asked to add "הנכם
        // מוזמנים", the model correctly completed it to "הנכם מוזמנים
        // לרגל..." AND correctly left the existing "בר מצווה" label
        // untouched per the rule below - but the RESULT was two separate,
        // redundant lines sitting one under the other instead of one
        // sentence, because "untouched" was being read as "never even
        // reference/absorb it into the new sentence". A real designer
        // would obviously fold "בר מצווה" straight into the new opening
        // line ("הנכם מוזמנים לרגל בר המצווה של <name>") rather than leave
        // both. This is the one narrow exception to the preservation rule
        // right after it.
        "SPECIAL CASE - merging an opening phrase with the category label directly below/beside it: if the request adds an opening/introductory phrase (like \"הנכם מוזמנים\") AND the image already has a short category-label line (like \"בר מצווה\", \"בת מצווה\", \"חתונה\", \"חינה\") sitting immediately next to where that phrase belongs, do NOT leave them as two separate, redundant lines - REPLACE that short label by folding it directly into the new sentence as one natural, flowing phrase (e.g. \"הנכם מוזמנים לרגל בר המצווה של <name>\"), so the result reads as a single complete sentence, not two disconnected ones. This is the one deliberate exception to \"do not alter existing text\" below - it applies ONLY to that one short adjacent label being absorbed into the new sentence, never to anything else (names, date, venue, decorations all still stay exactly as they are).",
        "Apply ONLY that one requested change (now sensibly completed if needed, including the merge case above where it applies). Do NOT remove, delete, retype, resize, move, or otherwise alter ANY text or element that already exists in the image, unless the request explicitly names that exact thing as what to change or remove, or it is the one narrow merge case described above. This protection absolutely includes: every name, the date, the time, the venue/address, and every decorative element - all of it must stay pixel-identical unless the request is specifically about that exact element. If the request asks to ADD something (a sentence, a line, a symbol) with no adjacent label to merge into, insert it as a brand new, separate element - make room for it by adjusting empty space or the overall composition, never by shrinking, replacing, or deleting an existing element to fit the new one in.",
        "Render every Hebrew word with perfect, exact spelling - copy any existing text exactly as it already appears in the image, character by character, do not invent, merge, drop, or add letters, and do not translate anything to English.",
      ]
        .filter(Boolean)
        .join("\n");
      const res = await fetch("/api/ai-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, baseImage: currentImage, variantCount: 2 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה בביצוע השינוי");
        if (res.status === 403) setBlocked(true);
        return;
      }
      // variantCount:2 always gets `variants` back (even if only one made
      // it - the other failed) - see api/ai-invite/route.ts.
      setPendingVariants(data.variants ?? (data.imageDataUrl ? [data.imageDataUrl] : []));
      setInput("");
      if (typeof data.regenerationsRemaining === "number") setRemaining(data.regenerationsRemaining);
    } catch {
      setError("שגיאת רשת - נסו שוב");
    } finally {
      setLoading(false);
    }
  }

  function pickVariant(url: string) {
    setCurrentImage(url);
    setChanged(true);
    setPendingVariants(null);
  }

  if (pendingVariants && pendingVariants.length > 0) {
    return (
      <div className="ai-invite-form">
        <p className="ai-invite-note" style={{ fontWeight: 700 }}>
          {pendingVariants.length > 1 ? "בחרו את הגרסה שאהבתם יותר:" : "הנה התוצאה:"}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: pendingVariants.length > 1 ? "1fr 1fr" : "1fr",
            gap: 10,
            marginBottom: 16,
          }}
        >
          {pendingVariants.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => pickVariant(url)}
              style={{
                border: "2px solid #d4af7a", borderRadius: 14, overflow: "hidden", padding: 0, cursor: "pointer",
                background: "none", aspectRatio: "9 / 16", display: "block",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`אפשרות ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
        <button type="button" className="ai-invite-retry-btn" onClick={onClose} style={{ width: "100%" }}>
          ביטול
        </button>
      </div>
    );
  }

  return (
    <div className="ai-invite-form">
      {/* Full explanation moved to a SweetAlert notice shown before this
          modal even opens (see openDesignChangeChat in create/image/
          page.tsx) - it was easy to skip as fine print inline here. */}
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
          <p className="ai-chat-question">יוצר שתי אפשרויות לבחירה...</p>
        </div>
      ) : (
        !blocked && (
          <div className="ai-invite-field">
            <label>מה לשנות?</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="לדוגמה: תוסיפו משפט מעל השם..."
              rows={4}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter still adds a line break - a
                // plain <input> couldn't offer that at all, and a request
                // here is often more than one short line.
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendRequest();
                }
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
