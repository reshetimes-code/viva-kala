// Shared across the coded-template gallery (src/lib/templates.tsx) and the
// photo-upload creation flow (src/app/create/image) - one union so a
// category picked on the landing page means the same thing everywhere
// downstream, instead of two parallel "type of event" concepts drifting
// apart.
//
// "בר/בת מצווה" used to be one combined choice - split into "בר מצווה" and
// "בת מצווה" so the celebrant's actual gender is known up front (correct
// wording in the headline/fields) instead of a generic "חתן/כלת המצווה"
// guess. The combined value stays a valid EventCategory (kept out of
// EVENT_CATEGORIES below, so it's never offered as a new choice) purely so
// an invite saved before this split keeps loading/rendering exactly as it
// always did - CATEGORY_FIELD_DEFS/buildHeadline in categoryFields.ts still
// have an entry for it.
export type EventCategory = "חתונה" | "בר/בת מצווה" | "בר מצווה" | "בת מצווה" | "חינה" | "יום הולדת" | "אחר";

export const EVENT_CATEGORIES: EventCategory[] = ["חתונה", "בר מצווה", "בת מצווה", "חינה", "יום הולדת", "אחר"];

// Every value that has ever been a real EventCategory, including the
// retired combined one - this is what actually validates an incoming
// value (e.g. an existing invite's stored category), NOT the picker list
// above (which only offers new choices going forward).
const ALL_EVENT_CATEGORIES: EventCategory[] = ["חתונה", "בר/בת מצווה", "בר מצווה", "בת מצווה", "חינה", "יום הולדת", "אחר"];

export function isEventCategory(value: unknown): value is EventCategory {
  return typeof value === "string" && (ALL_EVENT_CATEGORIES as string[]).includes(value);
}

// EventCategory itself stays Hebrew - it's the value stored on every invite
// in the DB, not UI copy, so changing it would be a data migration, not a
// translation. This is purely a *display* label for English UI mode -
// wherever a category name is shown to the person operating the site (the
// template gallery filter, the photo-upload flow's category picker, ...),
// look it up here instead of rendering the raw EventCategory string.
const EVENT_CATEGORY_LABEL_EN: Record<EventCategory, string> = {
  "חתונה": "Wedding",
  "בר/בת מצווה": "Bar/Bat Mitzvah",
  "בר מצווה": "Bar Mitzvah",
  "בת מצווה": "Bat Mitzvah",
  "חינה": "Henna",
  "יום הולדת": "Birthday",
  "אחר": "Other",
};

export function eventCategoryLabel(category: EventCategory, locale: "he" | "en"): string {
  return locale === "en" ? EVENT_CATEGORY_LABEL_EN[category] : category;
}
