import type { EventCategory } from "@/lib/eventCategories";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "date" | "time" | "textarea";
  required?: boolean;
  placeholder?: string;
}

// Only these three categories get a tailored field set - חתונה, בר/בת מצווה,
// חינה. "יום הולדת" and "אחר" intentionally have no entry here and keep
// today's existing generic form (celebrants[], invitedAs, willBe, ...)
// completely unchanged - CategoryFieldsForm falls back to that when a
// category has no definition below.
export const CATEGORY_FIELD_DEFS: Partial<Record<EventCategory, FieldDef[]>> = {
  "חתונה": [
    { key: "groomName", label: "שם החתן", type: "text", required: true },
    { key: "brideName", label: "שם הכלה", type: "text", required: true },
    { key: "eventDate", label: "תאריך", type: "date", required: true },
    { key: "ceremonyTime", label: "שעת טקס חופה וקידושין", type: "time" },
    { key: "receptionTime", label: "שעת קבלת פנים", type: "time" },
    { key: "venue", label: "מיקום האירוע", type: "text", required: true },
    { key: "groomParents", label: "שמות הורי החתן (לא חובה)", type: "text" },
    { key: "brideParents", label: "שמות הורי הכלה (לא חובה)", type: "text" },
  ],
  "בר/בת מצווה": [
    { key: "celebrantName", label: "שם חתן/כלת המצווה", type: "text", required: true },
    { key: "celebrantAge", label: "בן/בת 12/13 (לא חובה)", type: "text", placeholder: "לדוגמה: בן 13" },
    { key: "familyName", label: "משפחת", type: "text" },
    { key: "parentsNames", label: "שמות ההורים (לא חובה)", type: "text" },
    { key: "siblingsNames", label: "שמות האחים (לא חובה)", type: "text" },
    { key: "eventDate", label: "תאריך", type: "date", required: true },
    { key: "eventStart", label: "שעת התחלת האירוע", type: "time" },
    { key: "venue", label: "מיקום האירוע", type: "text", required: true },
  ],
  "חינה": [
    { key: "groomName", label: "שם החתן", type: "text", required: true },
    { key: "brideName", label: "שם הכלה", type: "text", required: true },
    { key: "eventDate", label: "תאריך", type: "date", required: true },
    { key: "eventStart", label: "שעת התחלה", type: "time" },
    { key: "venue", label: "מיקום האירוע", type: "text", required: true },
  ],
};

export function hasCustomFields(category: EventCategory | undefined): boolean {
  return !!category && !!CATEGORY_FIELD_DEFS[category];
}

/** Checks every `required` field for the category has a non-empty value.
 *  Returns the label of the first missing one (for a plain-language error
 *  message), or null when everything required is filled. Shared by the
 *  client form and (defensively) the API route, so the rule lives in one
 *  place. */
export function findMissingRequiredField(
  category: EventCategory,
  values: Record<string, string>
): string | null {
  const defs = CATEGORY_FIELD_DEFS[category] ?? [];
  for (const def of defs) {
    if (def.required && !values[def.key]?.trim()) return def.label;
  }
  return null;
}

export interface HeadlineParts {
  line1: string;
  line2?: string;
}

/** Builds the "who/what" headline from structured category fields, for the
 *  three tailored categories. Returns null when there isn't enough data
 *  (missing category/fields, or a category without a tailored field set) -
 *  callers fall back to the legacy free-text headline builder in that case
 *  (see src/app/i/[id]/page.tsx). */
export function buildHeadline(
  category: EventCategory | undefined,
  fields: Record<string, string> | undefined
): HeadlineParts | null {
  if (!category || !fields) return null;

  switch (category) {
    case "חתונה":
    case "חינה": {
      const names = [fields.groomName, fields.brideName].filter(Boolean);
      if (names.length === 0) return null;
      return { line1: names.join(" ו") };
    }
    case "בר/בת מצווה": {
      if (!fields.celebrantName) return null;
      return {
        line1: fields.celebrantName,
        line2: fields.familyName ? `משפחת ${fields.familyName}` : undefined,
      };
    }
    default:
      return null;
  }
}

export function headlineToString(parts: HeadlineParts | null): string {
  if (!parts) return "";
  return [parts.line1, parts.line2].filter(Boolean).join(" - ");
}

/** venue/eventDate/eventStart live under different keys depending on
 *  category (see CATEGORY_FIELD_DEFS above) - this reads them uniformly so
 *  callers (InvitePhotoCard, the create-flow preview) don't need a switch
 *  of their own. */
export function readCommonFields(fields: Record<string, string> | undefined) {
  return {
    eventDate: fields?.eventDate ?? "",
    eventStart: fields?.eventStart ?? fields?.ceremonyTime ?? "",
    venue: fields?.venue ?? "",
  };
}
