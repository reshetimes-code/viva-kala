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

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new GeminiRequestError("לא התקבלה תשובה מה-AI");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new GeminiRequestError("תשובת ה-AI לא הייתה בפורמט תקין");
  }
}
