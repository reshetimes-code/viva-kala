// Shared text/vision call for Gemini's `:generateContent` REST endpoint -
// the AI-designer chat and the photo-design analysis both need "ask Gemini
// for structured JSON back", so the request-building/parsing lives here
// once. Reuses the same GEMINI_API_KEY / x-goog-api-key auth already used
// by src/app/api/ai-invite/route.ts for Imagen (a different endpoint,
// :predict, not :generateContent - this is the first text-model call in
// the app).
export interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

export class GeminiConfigError extends Error {}
export class GeminiRequestError extends Error {}

/** Calls Gemini with a JSON response schema and returns the parsed object.
 *  Throws GeminiConfigError when no API key is configured, GeminiRequestError
 *  on any network/API failure - callers decide how to surface or fall back
 *  on each. */
export async function callGeminiJson<T>(opts: {
  systemInstruction: string;
  contents: Array<{ role: "user" | "model"; parts: GeminiPart[] }>;
  responseSchema: object;
  model?: string;
}): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiConfigError("GEMINI_API_KEY לא מוגדר");
  }
  const model = opts.model || process.env.GEMINI_TEXT_MODEL || "gemini-2.0-flash";

  // Google's RECITATION filter (content judged too similar to existing
  // material) can trip on an unlucky sampling of an otherwise-fine prompt -
  // it's meant to be non-deterministic, so a couple of retries (a fresh
  // sample each time, temperature pushed up to make that more likely)
  // clears it far more often than not instead of dead-ending the chat.
  const MAX_ATTEMPTS = 3;
  let lastEmptyReason: string | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: opts.systemInstruction }] },
            contents: opts.contents,
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: opts.responseSchema,
              // Newer "thinking" models spend part of the output-token budget
              // on internal reasoning before the visible answer - a small
              // budget can finish with MAX_TOKENS and no visible text at all.
              // thinkingConfig would be the direct fix, but this model version
              // rejects that field outright ("invalid argument"), so a
              // generous ceiling is the safe way to leave room for both.
              maxOutputTokens: 8192,
              temperature: 1,
            },
          }),
        }
      );
    } catch {
      throw new GeminiRequestError("שגיאת רשת מול שירות ה-AI");
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new GeminiRequestError(data?.error?.message || "שגיאה בתקשורת עם ה-AI");
    }

    // "Thinking" models can return their reasoning as its own part (marked
    // thought: true) ahead of the real answer - blindly reading parts[0]
    // meant we were sometimes serving that internal scratch-work (garbled,
    // self-referential, part-English "let's satisfy the constraints..." text)
    // as if it were the answer. Skip any thought part and use the real one.
    const parts: Array<{ text?: string; thought?: boolean }> = data?.candidates?.[0]?.content?.parts ?? [];
    const answerPart = parts.find((p) => !p.thought && p.text) ?? parts[0];
    const text = answerPart?.text;

    if (text) {
      // responseMimeType: "application/json" is supposed to rule this out,
      // but a ```json ... ``` fence (or stray whitespace) around otherwise-
      // valid JSON has shown up in practice - strip that before giving up.
      const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
      try {
        return JSON.parse(cleaned) as T;
      } catch {
        // Malformed JSON is just as retryable as an empty response - log
        // the raw text (Cloud Run logs only) and let the loop try again
        // instead of failing the whole chat turn on one bad sample.
        console.error("[gemini] JSON.parse failed", JSON.stringify({ model, attempt, text: text.slice(0, 2000) }));
        lastEmptyReason = "PARSE_ERROR";
        continue;
      }
    }

    // Diagnostic only (Cloud Run logs, never shown to the user) - the
    // request came back 200 OK but with no usable text, so the interesting
    // part is *why*: blocked by promptFeedback, cut off by finishReason
    // (MAX_TOKENS/SAFETY/RECITATION), or a shape this code doesn't expect.
    lastEmptyReason = data?.candidates?.[0]?.finishReason;
    console.error(
      "[gemini] empty text in response",
      JSON.stringify({
        model,
        attempt,
        finishReason: lastEmptyReason,
        promptFeedback: data?.promptFeedback,
        candidate: data?.candidates?.[0],
      })
    );
  }

  throw new GeminiRequestError(
    lastEmptyReason === "RECITATION"
      ? "ה-AI סירב לענות בגלל דמיון לתוכן קיים - נסו לנסח את הבקשה קצת אחרת"
      : lastEmptyReason === "PARSE_ERROR"
        ? "תשובת ה-AI לא הייתה בפורמט תקין - נסו שוב"
        : "לא התקבלה תשובה מה-AI"
  );
}
