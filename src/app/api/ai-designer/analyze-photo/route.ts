import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { callGeminiJson, GeminiConfigError, GeminiRequestError } from "@/lib/gemini";

// The real "AI looked at your photo and designed this" step (Phase B's
// primary path - textStyleHeuristic.ts is only the fallback for when this
// fails or GEMINI_API_KEY isn't set). Given the actual photo, Gemini picks
// where the text can sit without covering faces/important detail, and
// which colors will actually read against it - a plain average-brightness
// heuristic can't make either of those calls.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    textColor: { type: "STRING", description: "Hex color for the overlaid text, e.g. #ffffff" },
    scrimColor: { type: "STRING", description: "Hex color for the gradient scrim behind the text" },
    scrimOpacity: { type: "NUMBER", description: "0 to 1" },
    accentColor: { type: "STRING", description: "Hex color for the date badge border, e.g. #d4af7a" },
    anchor: { type: "STRING", enum: ["top", "center", "bottom"], description: "Where the text can sit without covering faces or the busiest part of the photo" },
  },
  required: ["textColor", "scrimColor", "scrimOpacity", "accentColor", "anchor"],
};

const SYSTEM_INSTRUCTION = [
  "You are a professional graphic designer laying event-invitation text (a couple's/celebrant's name, a date, a venue) over a user's photo.",
  "Look at the photo and decide: where is the emptiest/least busy area (avoid covering faces), and what text/scrim colors will read clearly against that area.",
  "Respond only with the JSON fields requested - no explanation.",
].join(" ");

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const imageDataUrl = typeof body?.imageDataUrl === "string" ? body.imageDataUrl : "";
  const match = /^data:([^;]+);base64,(.+)$/.exec(imageDataUrl);
  if (!match) {
    return NextResponse.json({ error: "נדרשת תמונה תקינה" }, { status: 400 });
  }

  try {
    const result = await callGeminiJson({
      systemInstruction: SYSTEM_INSTRUCTION,
      contents: [
        {
          role: "user",
          parts: [
            { text: "Analyze this invitation photo and choose the text style." },
            { inlineData: { mimeType: match[1], data: match[2] } },
          ],
        },
      ],
      responseSchema: RESPONSE_SCHEMA,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof GeminiConfigError) {
      return NextResponse.json({ error: "לא הוגדר מפתח API" }, { status: 503 });
    }
    if (err instanceof GeminiRequestError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json({ error: "שגיאה לא צפויה" }, { status: 500 });
  }
}
