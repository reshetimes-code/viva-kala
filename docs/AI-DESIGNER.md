# מעצב ה-AI (Gemini) - הגדרות ושחזור

מסמך זה נשמר ב-git כדי שההגדרות לא יאבדו גם אם האתר לא פעיל תקופה.
גרסה יציבה מתויגת ב-git: `ai-designer-v1` (קומיט 30cb535).

## איפה הכול נמצא בקוד
| מה | קובץ |
|---|---|
| שיחת המעצב (שאלות/תשובות, בניית פרומפט התמונה), סגנונות לכל קטגוריה (`CATEGORY_STYLE_GUIDE`), הוראת "רמת עיצוב יוצאת דופן" | `src/app/api/ai-designer/chat/route.ts` |
| יצירת התמונה עצמה (Gemini Interactions API), יחס 9:19.5, איסור מסגרת טלפון, מכסה 10 יצירות לחשבון | `src/app/api/ai-invite/route.ts` |
| קריאה למודל הטקסט (JSON, ניסיונות חוזרים) | `src/lib/gemini.ts` |
| ממשק השיחה, שילוב תמונה (`photoBlendInstruction` לחתונה / בר-בת מצווה / אחר) | `src/components/AiDesignerChat.tsx` |
| קטגוריות ושדות (כולל "ברית") | `src/lib/eventCategories.ts`, `src/lib/categoryFields.ts` |
| מדריך הסגנון היוקרתי | `.claude/skills/luxury-invite-style/SKILL.md` |

## משתני סביבה (ב-Cloud Run, השירות `ciel`) - ללא ערכים סודיים
- `GEMINI_API_KEY` - סוד, לא נשמר כאן
- `GEMINI_TEXT_MODEL` = `gemini-3.6-flash`
- `GEMINI_IMAGE_MODEL` = `gemini-3.1-flash-image`
- `DATABASE_URL`, `SUPERADMIN_PASSWORD_HASH` - סודות

## החלטות עיצוב חשובות (לא למחוק)
- ללא תמונה: תמיד עיצוב AI מלא מהתשובות (לא תבנית קבועה).
- עם תמונה: התמונה משתלבת בתוך הסצנה (חתונה: זוג למעלה בפייד; בר/בת מצווה: דמות חתוכה ליד לוח מקושת).
- ההנחיה לתמונה לא מזכירה "smartphone/phone screen" - כי זה גרם ל-AI לצייר מסגרת טלפון.
- סגנונות ייחוס: חתונה (חופה בלילה, טבעות, זהב מטאלי, אייקונים), בת מצווה (לוח מקושת + פרחים), ברית (לוח מקושת, כתר, דובי, טלית, גביע).

## פריסה לפרודקשן
- פרויקט GCP: `silver-503012`, שירות: `ciel`, אזור: `us-central1` (דומיין vivaa.co.il)
- `gcloud run deploy ciel --source . --region us-central1 --project silver-503012`

## שחזור גרסה יציבה
- קוד: `git checkout ai-designer-v1`
- או לנתב תנועה לרוויזיה ישנה: `gcloud run services update-traffic ciel --to-revisions=ciel-00212-wbk=100 --region us-central1 --project silver-503012`
