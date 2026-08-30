import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { callGeminiJson, GeminiConfigError, GeminiRequestError } from "@/lib/gemini";

// Replaces the old static guided-form (src/components/AiInviteGenerator.tsx)
// with an actual back-and-forth: the model asks one simple, tap-friendly
// question at a time (never free typing required) and, once it has enough,
// hands back an assembled English prompt for the existing Imagen call in
// src/app/api/ai-invite/route.ts.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    question: { type: "STRING", description: "One short question in Hebrew, or omitted when ready" },
    options: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "3-4 short tappable Hebrew answers for the question, always including a 'תפתיעו אותי' option",
    },
    readyToGenerate: { type: "BOOLEAN" },
    imagePrompt: {
      type: "STRING",
      description: "Only when readyToGenerate: a complete English prompt for an Imagen background image",
    },
  },
  required: ["readyToGenerate"],
};

function buildSystemInstruction(eventCategory: string | undefined, categoryFields: Record<string, string> | undefined) {
  const knownDetails = categoryFields
    ? Object.entries(categoryFields)
        .filter(([, v]) => v?.trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
    : "";

  return [
    "אתה מעצב/ת גרפי/ת בכיר/ה, מומחה/ית בהזמנות דיגיטליות לאירועים, עם שנות ניסיון.",
    "המשתמש שמולך יכול להיות מישהו שלא מכיר אפליקציות בכלל - הכל חייב להיות פשוט ביותר.",
    "לכן: לעולם אל תבקש הקלדה חופשית. בכל תור, שאל שאלה אחת קצרה וברורה (צבעים? אווירה? רקע?) עם 3-4 תשובות קצרות וברורות ללחיצה, ותמיד תוסיף אופציה אחת שהיא 'תפתיעו אותי'.",
    "לכל היותר 3 שאלות בסך הכל - אחר כך readyToGenerate=true בלי לשאול יותר.",
    `סוג האירוע: ${eventCategory ?? "לא צוין"}.`,
    knownDetails && `פרטים שכבר יש לך על האירוע (אל תשאל עליהם שוב): ${knownDetails}.`,
    "כשאתה מוכן (readyToGenerate=true), כתוב ב-imagePrompt פרומפט מלא באנגלית לתמונת רקע להזמנה - איכות גבוהה, מקצועי, עם השראה מהצבעים/הסגנון שהמשתמש בחר, אבל בלי טקסט/אותיות/מספרים בתמונה עצמה (הטקסט מתווסף בנפרד).",
    "כל שאלה ותשובה אתה כותב בעברית בלבד.",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const messages: Array<{ role: "user" | "model"; text: string }> = Array.isArray(body?.messages) ? body.messages : [];
  const eventCategory = typeof body?.eventCategory === "string" ? body.eventCategory : undefined;
  const categoryFields =
    body?.categoryFields && typeof body.categoryFields === "object" ? body.categoryFields : undefined;

  try {
    const result = await callGeminiJson<{
      question?: string;
      options?: string[];
      readyToGenerate: boolean;
      imagePrompt?: string;
    }>({
      systemInstruction: buildSystemInstruction(eventCategory, categoryFields),
      contents:
        messages.length > 0
          ? messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }))
          : [{ role: "user", parts: [{ text: "בואו נתחיל לעצב את ההזמנה." }] }],
      responseSchema: RESPONSE_SCHEMA,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof GeminiConfigError) {
      return NextResponse.json({ error: "יצירת עיצוב ב-AI לא הוגדרה עדיין במערכת (חסר מפתח API)" }, { status: 503 });
    }
    if (err instanceof GeminiRequestError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json({ error: "שגיאה לא צפויה" }, { status: 500 });
  }
}
