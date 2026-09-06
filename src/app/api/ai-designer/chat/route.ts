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
    question: {
      type: "STRING",
      description:
        "One short question in Hebrew. When readyToGenerate is true this isn't asked anymore - just repeat a short closing line like 'מעולה, יוצר/ת את התמונה'.",
    },
    options: {
      type: "ARRAY",
      items: { type: "STRING" },
      minItems: 3,
      maxItems: 4,
      description:
        "REQUIRED, always 3-4 items, even when readyToGenerate is true (repeat any 3-4 short placeholder strings there - they're ignored once ready). Short tappable Hebrew answers for `question`, always including a 'תפתיעו אותי' option. Never leave this empty and never put the answers inside `question` instead.",
    },
    readyToGenerate: { type: "BOOLEAN" },
    imagePrompt: {
      type: "STRING",
      description:
        "Only when readyToGenerate: a complete English prompt describing the FULL finished invitation as one image, with all the event's Hebrew text (names, date, parents, venue/address) elegantly designed and rendered directly inside the image - not a text-free background.",
    },
  },
  required: ["question", "options", "readyToGenerate"],
};

// The model has, more than once, appended stray non-Hebrew debug/constraint-
// looking text to an otherwise-fine Hebrew question (e.g. a trailing
// "_TEST_NO_CONTROL_TOKENS_..." run, or English meta-commentary about the
// JSON constraints) - real question text here is Hebrew-only per the system
// instruction below, so any run of 3+ Latin letters is never legitimate
// content and gets cut, along with everything after it.
function stripContamination(text: string): string {
  return text.replace(/[a-zA-Z]{3,}[\s\S]*$/, "").trim();
}

// Professional convention per category - a color/mood palette that reads as
// "designed by someone who does this for a living" by default, before the
// user's own answers narrow it further. Without this the model has no
// grounding for what actually looks right for a bar mitzvah vs a henna vs a
// birthday, and tends toward one generic "elegant" look for everything.
const CATEGORY_STYLE_GUIDE: Record<string, string> = {
  "חתונה":
    "אלגנטי ורומנטי: זהב/שמפניה/קרם/לבן, גווני בורדו או נייבי כאקצנט, רקעים כמו הינומה מתנופפת, ים/שקיעה, פרחים לבנים, טקסטורת שיש.",
  "בר/בת מצווה":
    "חגיגי ומכובד, לא ילדותי: נייבי/שחור עם זהב מבריק, דפוסי גיאומטריה מודגשים, אפשר מגן דוד כמוטיב, ניצוצות/קונפטי מוזהב.",
  "בר מצווה":
    "חגיגי ומכובד, לא ילדותי: נייבי/שחור עם זהב מבריק, דפוסי גיאומטריה מודגשים, אפשר מגן דוד כמוטיב, ניצוצות/קונפטי מוזהב.",
  "בת מצווה":
    "חגיגי ומכובד, לא ילדותי: נייבי/שחור עם זהב מבריק, דפוסי גיאומטריה מודגשים, אפשר מגן דוד כמוטיב, ניצוצות/קונפטי מוזהב.",
  "חינה":
    "עשיר ומזרחי: זהב, בורדו/אדום עמוק, כתום, ירוק אזמרגד, דפוסי חינה/פייזלי, נרות, בדים רקומים.",
  "יום הולדת":
    "עליז וצבעוני: פלטה תלויה בגיל (פסטלים לילדים, זהב/שחור מודרני למבוגר), בלונים, קונפטי, גדלי טקסט משחקיים יותר.",
  "אחר":
    "נקי ומודרני כברירת מחדל, אבל תמיד תעדיף את מה שהמשתמש בפועל בוחר בתשובותיו על פני הנחת ברירת המחדל.",
};

function buildSystemInstruction(eventCategory: string | undefined, categoryFields: Record<string, string> | undefined) {
  const knownDetails = categoryFields
    ? Object.entries(categoryFields)
        .filter(([, v]) => v?.trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
    : "";
  const styleGuide = eventCategory ? CATEGORY_STYLE_GUIDE[eventCategory] : undefined;

  return [
    "אתה מעצב/ת גרפי/ת בכיר/ה, מומחה/ית בהזמנות דיגיטליות לאירועים, עם שנות ניסיון.",
    "המשתמש שמולך יכול להיות מישהו שלא מכיר אפליקציות בכלל - הכל חייב להיות פשוט ביותר.",
    "לכן: לעולם אל תבקש הקלדה חופשית. בכל תור, שאל שאלה אחת קצרה וברורה (צבעים? אווירה? רקע?) עם 3-4 תשובות קצרות וברורות ללחיצה, ותמיד תוסיף אופציה אחת שהיא 'תפתיעו אותי'.",
    "חשוב מאוד לגבי הפורמט: שדה question מכיל אך ורק את משפט השאלה עצמו, בלי שום דבר נוסף - לא רשימת אפשרויות, לא המילה 'options', לא סוגריים מרובעים. כל אפשרויות התשובה חייבות להופיע רק בשדה options כערכים נפרדים במערך, אף פעם לא כטקסט בתוך question. שדה options הוא חובה בכל תשובה, תמיד עם 3-4 מחרוזות קצרות בעברית - אף פעם לא ריק, גם אם readyToGenerate=true (במקרה הזה אפשר לשים בו כל 3-4 מחרוזות קצרות, הן לא יוצגו).",
    "לכל היותר 3 שאלות בסך הכל - אחר כך readyToGenerate=true בלי לשאול יותר.",
    `סוג האירוע: ${eventCategory ?? "לא צוין"}.`,
    styleGuide &&
      `כמעצב/ת מקצועי/ת, זו הפלטה/מוד המקובלים לסוג האירוע הזה - תשתמש בזה כברירת מחדל בשאלות ובעיצוב הסופי, אלא אם המשתמש בעצמו ביקש כיוון שונה בתשובותיו: ${styleGuide}`,
    knownDetails && `פרטים שכבר יש לך על האירוע (אל תשאל עליהם שוב): ${knownDetails}.`,
    "כשאתה מוכן (readyToGenerate=true), כתוב ב-imagePrompt פרומפט מלא באנגלית ליצירת ההזמנה השלמה כתמונה אחת מוגמרת - לא רק רקע. חובה לכלול הנחיה מפורשת שכל הטקסט הבא מעוצב ומשולב בתוך התמונה עצמה, באותיות עבריות אלגנטיות (לא תרגום לאנגלית, הטקסט חייב להיות בעברית בדיוק כמו שקיבלת אותו): שם/שמות החוגגים בגדול ובולט במרכז, תאריך האירוע, שמות ההורים אם יש, מקום האירוע וכתובת אם יש. תן לו הנחיה מפורטת על ההיררכיה הוויזואלית (מה גדול, מה קטן, סדר השורות), טיפוגרפיה מוזהבת/אלגנטית, ורקע מתאים לסגנון/צבעים שהמשתמש בחר (למשל רקע ים, פרחים, מרקם יוקרתי וכו' לפי מה שהוא ענה). ציין רק את **יחס הגובה-רוחב** כ-9:16 פורטרט אנכי - לעולם אל תזכיר 'טלפון', 'מסך', 'טיקטוק' או 'סטורי' בתור השראה ויזואלית, כי זה גורם למודל לצייר בטעות מסגרת טלפון/notch/סמלי אפליקציה כחלק מהתמונה עצמה. תוסיף במפורש: no phone frame, no device mockup, no screen bezel, no notch, no app UI elements anywhere in the image - a full-bleed flat graphic design only. קריטי לגבי איות: תוסיף גם משפט מפורש שמזהיר שכל מילה עברית חייבת להיות מאויתת באופן מדויק, אות-אות, בדיוק כמו שסופקה - למשל: 'Spell every Hebrew word with perfect, exact accuracy - copy each name/date/venue letter by letter exactly as given, do not invent, merge, drop, or add any letters.' חשוב באותה מידה: תוסיף גם הנחיה מפורשת שאסור להוסיף שום טקסט, מילה, כותרת-משנה או תווית שלא נתת לו את הנוסח המדויק שלה - כלומר אם לא ביקשת ממנו במפורש תווית 'בר/בת מצווה' או משפט פתיחה כלשהו, שלא ימציא כזה בעצמו - למשל: 'Do not add any text, label, subtitle, or greeting beyond exactly what is specified above - no invented category labels, no invented opening phrases.'",
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
    // question/options are Hebrew-only by instruction - imagePrompt is the
    // one field that's supposed to be English, so it's left untouched.
    return NextResponse.json({
      ...result,
      question: result.question ? stripContamination(result.question) : result.question,
      options: result.options?.map(stripContamination).filter(Boolean),
    });
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
