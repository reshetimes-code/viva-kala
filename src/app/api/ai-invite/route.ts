import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Generates an invitation background/design image via Google's Imagen model
// (through the Gemini Developer API) from a guided form + optional free
// text - image models can't reliably render accurate Hebrew names/dates, so
// this produces a design/background only, not the full finished invitation.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "יצירת תמונות ב-AI לא הוגדרה עדיין במערכת (חסר מפתח API)" },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const eventType = typeof body?.eventType === "string" ? body.eventType.trim() : "";
  const color = typeof body?.color === "string" ? body.color.trim() : "";
  const background = typeof body?.background === "string" ? body.background.trim() : "";
  const elements = typeof body?.elements === "string" ? body.elements.trim() : "";
  const style = typeof body?.style === "string" ? body.style.trim() : "";
  const freeText = typeof body?.freeText === "string" ? body.freeText.trim() : "";

  if (!eventType && !color && !background && !elements && !style && !freeText) {
    return NextResponse.json({ error: "יש למלא לפחות פרט אחד" }, { status: 400 });
  }

  const promptParts = [
    `An elegant, professional digital invitation background design${eventType ? ` for a ${eventType}` : ""}.`,
    color && `Color palette: ${color}.`,
    background && `Background style: ${background}.`,
    elements && `Decorative elements: ${elements}.`,
    style && `Overall mood and style: ${style}.`,
    freeText,
    "Portrait orientation, high-end graphic design, tasteful negative space in the center and lower area for text to be added later, absolutely no text, no letters, no words, no numbers in the image.",
  ].filter(Boolean);
  const prompt = promptParts.join(" ");

  const model = process.env.GEMINI_IMAGE_MODEL || "imagen-3.0-generate-002";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: "3:4" },
        }),
      }
    );

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "שגיאה ביצירת התמונה" },
        { status: 502 }
      );
    }

    const prediction = data?.predictions?.[0];
    const base64 = prediction?.bytesBase64Encoded;
    if (!base64) {
      return NextResponse.json({ error: "לא התקבלה תמונה מהשירות" }, { status: 502 });
    }

    const mimeType = prediction?.mimeType || "image/png";
    return NextResponse.json({ imageDataUrl: `data:${mimeType};base64,${base64}` });
  } catch {
    return NextResponse.json({ error: "שגיאת רשת מול שירות ה-AI" }, { status: 502 });
  }
}
