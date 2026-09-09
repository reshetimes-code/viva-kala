import type { EventCategory } from "@/lib/eventCategories";
import type { Locale } from "@/lib/i18n/locale";

export interface FieldDef {
  key: string;
  label: string;
  /** English rendering of `label`, shown instead of it when the site is in
   *  English UI mode - see fieldLabel()/fieldPlaceholder() below. Additive
   *  (label itself stays the source of truth for existing Hebrew-only
   *  callers) so this doesn't ripple into every consumer's types. */
  labelEn: string;
  type: "text" | "date" | "time" | "textarea";
  required?: boolean;
  placeholder?: string;
  placeholderEn?: string;
}

export function fieldLabel(def: FieldDef, locale: Locale): string {
  return locale === "en" ? def.labelEn : def.label;
}

export function fieldPlaceholder(def: FieldDef, locale: Locale): string | undefined {
  return locale === "en" ? def.placeholderEn ?? def.placeholder : def.placeholder;
}

// Only these categories get a tailored field set - חתונה, בר מצווה, בת
// מצווה (+ the retired combined בר/בת מצווה, kept only for invites saved
// before the split), חינה. "יום הולדת" and "אחר" intentionally have no
// entry here and keep today's existing generic form (celebrants[],
// invitedAs, willBe, ...) completely unchanged - CategoryFieldsForm falls
// back to that when a category has no definition below.
const BAR_BAT_MITZVAH_FIELDS_BASE: FieldDef[] = [
  { key: "familyName", label: "משפחת", labelEn: "Family name", type: "text" },
  { key: "parentsNames", label: "שמות ההורים (לא חובה)", labelEn: "Parents' names (optional)", type: "text" },
  { key: "siblingsNames", label: "שמות האחים (לא חובה)", labelEn: "Siblings' names (optional)", type: "text" },
  { key: "eventDate", label: "תאריך", labelEn: "Date", type: "date", required: true },
  { key: "eventStart", label: "שעת התחלת האירוע", labelEn: "Event start time", type: "time" },
  { key: "venue", label: "מיקום האירוע", labelEn: "Event venue", type: "text", required: true },
];

export const CATEGORY_FIELD_DEFS: Partial<Record<EventCategory, FieldDef[]>> = {
  "חתונה": [
    { key: "groomName", label: "שם החתן", labelEn: "Groom's name", type: "text", required: true },
    { key: "brideName", label: "שם הכלה", labelEn: "Bride's name", type: "text", required: true },
    { key: "eventDate", label: "תאריך", labelEn: "Date", type: "date", required: true },
    // Reception before ceremony, matching the real order of a wedding day
    // (guests arrive at קבלת פנים first, the חופה itself comes after).
    { key: "receptionTime", label: "שעת קבלת פנים", labelEn: "Reception time", type: "time" },
    { key: "ceremonyTime", label: "שעת טקס חופה וקידושין", labelEn: "Ceremony time", type: "time" },
    { key: "venue", label: "מיקום האירוע", labelEn: "Event venue", type: "text", required: true },
    { key: "groomParents", label: "שמות הורי החתן (לא חובה)", labelEn: "Groom's parents (optional)", type: "text" },
    { key: "brideParents", label: "שמות הורי הכלה (לא חובה)", labelEn: "Bride's parents (optional)", type: "text" },
  ],
  // Retired combined category - an invite saved before the בר/בת split
  // still loads and edits with the exact same fields it always had.
  "בר/בת מצווה": [
    { key: "celebrantName", label: "שם חתן/כלת המצווה", labelEn: "Celebrant's name", type: "text", required: true },
    { key: "celebrantAge", label: "בן/בת 12/13 (לא חובה)", labelEn: "Turning 12/13 (optional)", type: "text", placeholder: "לדוגמה: בן 13", placeholderEn: "e.g. turning 13" },
    ...BAR_BAT_MITZVAH_FIELDS_BASE,
  ],
  "בר מצווה": [
    { key: "celebrantName", label: "שם חתן המצווה", labelEn: "Celebrant's name", type: "text", required: true },
    { key: "celebrantAge", label: "גיל (לא חובה)", labelEn: "Age (optional)", type: "text", placeholder: "לדוגמה: בן 13", placeholderEn: "e.g. turning 13" },
    ...BAR_BAT_MITZVAH_FIELDS_BASE,
  ],
  "בת מצווה": [
    { key: "celebrantName", label: "שם בת המצווה", labelEn: "Celebrant's name", type: "text", required: true },
    { key: "celebrantAge", label: "גיל (לא חובה)", labelEn: "Age (optional)", type: "text", placeholder: "לדוגמה: בת 12", placeholderEn: "e.g. turning 12" },
    ...BAR_BAT_MITZVAH_FIELDS_BASE,
  ],
  "חינה": [
    { key: "groomName", label: "שם החתן", labelEn: "Groom's name", type: "text", required: true },
    { key: "brideName", label: "שם הכלה", labelEn: "Bride's name", type: "text", required: true },
    { key: "eventDate", label: "תאריך", labelEn: "Date", type: "date", required: true },
    { key: "eventStart", label: "שעת התחלה", labelEn: "Start time", type: "time" },
    { key: "venue", label: "מיקום האירוע", labelEn: "Event venue", type: "text", required: true },
  ],
};

export function hasCustomFields(category: EventCategory | undefined): boolean {
  return !!category && !!CATEGORY_FIELD_DEFS[category];
}

/** Checks every `required` field for the category has a non-empty value.
 *  Returns the label of the first missing one (for a plain-language error
 *  message), or null when everything required is filled. Shared by the
 *  client form and (defensively) the API route, so the rule lives in one
 *  place. `locale` only picks which language the returned label is in -
 *  defaults to Hebrew so existing callers that don't pass it are unchanged. */
export function findMissingRequiredField(
  category: EventCategory,
  values: Record<string, string>,
  locale: Locale = "he"
): string | null {
  const defs = CATEGORY_FIELD_DEFS[category] ?? [];
  for (const def of defs) {
    if (def.required && !values[def.key]?.trim()) return fieldLabel(def, locale);
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

const CATEGORY_SHARE_PHRASE: Partial<Record<EventCategory, string>> = {
  "חתונה": "לחתונה של",
  "חינה": "לחינה של",
  "בר/בת מצווה": "לבר/בת המצווה של",
  "בר מצווה": "לבר המצווה של",
  "בת מצווה": "לבת המצווה של",
  "יום הולדת": "ליום ההולדת של",
};

/** "ברוכים הבאים לחתונה של דניאל ואמה!" - the opening line of the WhatsApp
 *  share message, so a guest who taps a link forwarded to them (not the
 *  couple/family's own message) knows immediately whose event this is,
 *  instead of just a generic "you're invited" over a bare link. `names`
 *  is resolved by the caller (page.tsx) since it differs by mode/category -
 *  structured groom/bride or celebrant fields for the three tailored
 *  categories, the coded template's own title lines for mode "template",
 *  otherwise the legacy free-text celebrants list. Empty string (skip the
 *  line entirely) only when none of those produced an actual name. */
export function buildShareGreeting(category: EventCategory | undefined, names: string): string {
  // Individual name fields sometimes carry stray leading/trailing spaces
  // (a form field saved as-is) - collapsed here so joining two of them
  // ("X " + " ו" + "Y") can't leave a visible double space in the greeting.
  const cleanNames = names.replace(/\s+/g, " ").trim();
  if (!cleanNames) return "";
  const phrase = (category && CATEGORY_SHARE_PHRASE[category]) || "לאירוע של";
  return `ברוכים הבאים ${phrase} ${cleanNames}!`;
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
