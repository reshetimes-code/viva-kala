import type { EventCategory } from "@/lib/eventCategories";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "date" | "time" | "textarea";
  required?: boolean;
  placeholder?: string;
}

// Only these categories get a tailored field set - חתונה, בר מצווה, בת
// מצווה (+ the retired combined בר/בת מצווה, kept only for invites saved
// before the split), חינה. "יום הולדת" and "אחר" intentionally have no
// entry here and keep today's existing generic form (celebrants[],
// invitedAs, willBe, ...) completely unchanged - CategoryFieldsForm falls
// back to that when a category has no definition below.
const BAR_BAT_MITZVAH_FIELDS_BASE: FieldDef[] = [
  { key: "familyName", label: "משפחת", type: "text" },
  { key: "parentsNames", label: "שמות ההורים (לא חובה)", type: "text" },
  { key: "siblingsNames", label: "שמות האחים (לא חובה)", type: "text" },
  { key: "eventDate", label: "תאריך", type: "date", required: true },
  { key: "eventStart", label: "שעת התחלת האירוע", type: "time" },
  { key: "venue", label: "מיקום האירוע", type: "text", required: true },
];

export const CATEGORY_FIELD_DEFS: Partial<Record<EventCategory, FieldDef[]>> = {
  "חתונה": [
    { key: "groomName", label: "שם החתן", type: "text", required: true },
    { key: "brideName", label: "שם הכלה", type: "text", required: true },
    { key: "eventDate", label: "תאריך", type: "date", required: true },
    // Reception before ceremony, matching the real order of a wedding day
    // (guests arrive at קבלת פנים first, the חופה itself comes after).
    { key: "receptionTime", label: "שעת קבלת פנים", type: "time" },
    { key: "ceremonyTime", label: "שעת טקס חופה וקידושין", type: "time" },
    { key: "venue", label: "מיקום האירוע", type: "text", required: true },
    { key: "groomParents", label: "שמות הורי החתן (לא חובה)", type: "text" },
    { key: "brideParents", label: "שמות הורי הכלה (לא חובה)", type: "text" },
  ],
  // Retired combined category - an invite saved before the בר/בת split
  // still loads and edits with the exact same fields it always had.
  "בר/בת מצווה": [
    { key: "celebrantName", label: "שם חתן/כלת המצווה", type: "text", required: true },
    { key: "celebrantAge", label: "בן/בת 12/13 (לא חובה)", type: "text", placeholder: "לדוגמה: בן 13" },
    ...BAR_BAT_MITZVAH_FIELDS_BASE,
  ],
  "בר מצווה": [
    { key: "celebrantName", label: "שם חתן המצווה", type: "text", required: true },
    { key: "celebrantAge", label: "גיל (לא חובה)", type: "text", placeholder: "לדוגמה: בן 13" },
    ...BAR_BAT_MITZVAH_FIELDS_BASE,
  ],
  "בת מצווה": [
    { key: "celebrantName", label: "שם בת המצווה", type: "text", required: true },
    { key: "celebrantAge", label: "גיל (לא חובה)", type: "text", placeholder: "לדוגמה: בת 12" },
    ...BAR_BAT_MITZVAH_FIELDS_BASE,
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
  /** A short fixed opening line above the name ("שמחים להזמינכם...") - the
   *  reference invitations this app is trying to match almost always carry
   *  one, and it costs nothing to add since it's the same per category
   *  rather than something the user has to type. */
  intro?: string;
}

const CATEGORY_INTRO: Partial<Record<EventCategory, string>> = {
  "חתונה": "בשמחה ובאהבה אנו מזמינים אתכם לחגוג עמנו",
  "בר/בת מצווה": "בשמחה רבה אנו מזמינים אתכם לחגוג עמנו",
  "בר מצווה": "בשמחה רבה אנו מזמינים אתכם לחגוג עמנו",
  "בת מצווה": "בשמחה רבה אנו מזמינים אתכם לחגוג עמנו",
  "חינה": "מזמינים אתכם לחגוג עמנו את ליל החינה",
};

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

  const intro = CATEGORY_INTRO[category];

  switch (category) {
    case "חתונה":
    case "חינה": {
      const names = [fields.groomName, fields.brideName].filter(Boolean);
      if (names.length === 0) return null;
      return { line1: names.join(" ו"), intro };
    }
    case "בר/בת מצווה":
    case "בר מצווה":
    case "בת מצווה": {
      if (!fields.celebrantName) return null;
      return {
        line1: fields.celebrantName,
        line2: fields.familyName ? `משפחת ${fields.familyName}` : undefined,
        intro,
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

/** A native <input type="date"> always gives back "YYYY-MM-DD" - display
 *  that as "DD/MM/YYYY" instead everywhere a date reaches a guest/preview.
 *  Anything else (already-formatted, or free text on an older invite)
 *  passes through unchanged. */
export function formatEventDate(isoDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : isoDate;
}

// Fields already shown elsewhere on the guest card (headline, date/time
// line, venue line) - everything else a category collects (ceremony time,
// parents' names, sibling names, celebrant's age, ...) had no home on the
// card at all before this and just silently never reached a guest.
const SURFACED_ELSEWHERE = new Set([
  "groomName", "brideName", "celebrantName", "familyName",
  "eventDate", "eventStart", "venue",
]);

/** Every optional/extra category field that's actually been filled in,
 *  formatted as one short "label value" line each - for the small print
 *  under the venue on the guest card (ceremony time, parents' names, ...).
 *  Order follows CATEGORY_FIELD_DEFS so it's stable and matches the form. */
export function buildExtraDetailLines(
  category: EventCategory | undefined,
  fields: Record<string, string> | undefined
): string[] {
  if (!category || !fields) return [];
  const defs = CATEGORY_FIELD_DEFS[category] ?? [];
  return defs
    .filter((d) => !SURFACED_ELSEWHERE.has(d.key) && fields[d.key]?.trim())
    .map((d) => {
      const label = d.label.replace(/\s*\(לא חובה\)\s*$/, "");
      const value = fields[d.key].trim();
      return d.type === "time" ? `${label} ${value}` : `${label}: ${value}`;
    });
}

/** Maps a wedding's raw categoryFields onto the coded "gold-night" template's
 *  TemplateFields shape (see lib/templates.tsx) - real CSS/SVG text and
 *  icons, never AI-drawn pixels, so there is zero spelling-error risk. Used
 *  by the AI Designer chat's "want to use your own photo?" step: instead of
 *  asking Gemini to draw the whole invitation (including the Hebrew text)
 *  around the photo, the photo is just used as-is as gold-night's own photo
 *  background - no AI image call needed for this path at all. Returns null
 *  when there isn't enough data to build a real title from (mirrors
 *  buildHeadline's own null case for the same category). */
export function buildGoldNightFields(
  fields: Record<string, string> | undefined,
  imageDataUrl: string
): { titleLine1: string; titleLine2: string; subtitle: string; dateText: string; venueText: string; ceremonyTime: string; receptionTime: string; footerNote: string; imageDataUrl: string; photoPlacement: "background" } | null {
  if (!fields?.groomName || !fields?.brideName) return null;
  return {
    titleLine1: fields.groomName,
    titleLine2: fields.brideName,
    subtitle: "מתחתנים",
    dateText: fields.eventDate ? formatEventDate(fields.eventDate) : "",
    venueText: fields.venue ?? "",
    ceremonyTime: fields.ceremonyTime ?? "",
    receptionTime: fields.receptionTime ?? "",
    footerNote: "",
    imageDataUrl,
    photoPlacement: "background",
  };
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
