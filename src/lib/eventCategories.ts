// Shared across the coded-template gallery (src/lib/templates.tsx) and the
// photo-upload creation flow (src/app/create/image) - one union so a
// category picked on the landing page means the same thing everywhere
// downstream, instead of two parallel "type of event" concepts drifting
// apart.
export type EventCategory = "חתונה" | "בר/בת מצווה" | "חינה" | "יום הולדת" | "אחר";

export const EVENT_CATEGORIES: EventCategory[] = ["חתונה", "בר/בת מצווה", "חינה", "יום הולדת", "אחר"];

export function isEventCategory(value: unknown): value is EventCategory {
  return typeof value === "string" && (EVENT_CATEGORIES as string[]).includes(value);
}
