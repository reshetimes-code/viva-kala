export interface TextStyle {
  textColor: string;
  scrimColor: string;
  scrimOpacity: number;
  accentColor: string;
  anchor: "top" | "center" | "bottom";
  /** True when the image itself already has the event's name/date/venue
   *  designed and rendered right into it (the AI-designer chat's image
   *  prompt now asks for that, instead of a text-free background) - a real
   *  DB column would need a migration nobody can run without touching a
   *  secret DATABASE_URL, so this rides along on the already-flexible JSONB
   *  text_style column instead. When true, InvitePhotoCard's own text panel
   *  is skipped entirely (the caller just shows the photo) so the event
   *  details never end up rendered twice. */
  imageHasText?: boolean;
  /** The ORIGINAL raw English prompt from the very first generation for this
   *  image - set once and never touched again. Every later "🪄 עדכון התמונה"
   *  correction is built fresh from this same fixed base plus a single
   *  clean correction list (see quickUpdateImage in create/image/page.tsx),
   *  instead of stacking a new "IMPORTANT CORRECTION" block from the
   *  previous correction each time - stacking corrections onto corrections
   *  onto corrections (especially a pair that add then immediately undo the
   *  same edit) is exactly what confused the model into corrupting a name
   *  into gibberish once, so this field exists specifically to prevent a
   *  repeat. */
  baseImagePrompt?: string;
  /** categoryFields exactly as they were at that same original generation -
   *  the anchor every later correction diffs the CURRENT fields against
   *  (not against whatever the last correction happened to change), so the
   *  correction list sent to Gemini is always the true cumulative diff from
   *  the original, never a contradictory edit-of-an-edit history. */
  originalFieldsSnapshot?: Record<string, string>;
  /** The most recent prompt actually sent (base + that one clean correction
   *  list) - kept for reference/debugging only, never used as the base for
   *  a future correction (baseImagePrompt above always is). */
  lastImagePrompt?: string;
  /** Set only when the photo is the guest's own upload (never alongside
   *  imageHasText - the two are mutually exclusive: either the AI drew the
   *  whole design, or the guest's real photo gets InvitePhotoCard's layout
   *  treatment). Picked in AiDesignerChat's deterministic "want to use your
   *  own photo?" step; rides the same JSONB column as everything else here
   *  for the same reason (see imageHasText above). */
  photoPlacement?: "round" | "half" | "quarter-top" | "quarter-bottom";
}

// Used whenever a real analysis (heuristic below, or the AI-vision call
// Phase C adds) hasn't run yet - a safe, always-legible starting point so
// InvitePhotoCard never looks broken before the real value arrives.
export const DEFAULT_TEXT_STYLE: TextStyle = {
  textColor: "#ffffff",
  scrimColor: "#000000",
  scrimOpacity: 0.62,
  accentColor: "#d4af7a",
  anchor: "bottom",
};

/** Deterministic, free, instant fallback for "does the AI pick colors that
 *  actually read against this photo" - samples the region of the photo the
 *  text will sit over (the bottom third, matching DEFAULT_TEXT_STYLE's
 *  anchor) and picks light-text-on-dark-scrim or dark-text-on-light-scrim
 *  from its average brightness. This is intentionally simple (no face
 *  detection, no dominant-color extraction, fixed brand accent) - it's the
 *  safety net for when the Gemini-vision call (Phase C) fails or is slow,
 *  not the primary "AI designed this" path. */
export function computeTextStyleFromCanvas(canvas: HTMLCanvasElement): TextStyle {
  const sample = document.createElement("canvas");
  sample.width = 24;
  sample.height = 36;
  const ctx = sample.getContext("2d");
  if (!ctx) return DEFAULT_TEXT_STYLE;

  ctx.drawImage(canvas, 0, 0, sample.width, sample.height);

  const bottomThird = ctx.getImageData(0, Math.round(sample.height * (2 / 3)), sample.width, Math.round(sample.height / 3));
  const { data } = bottomThird;

  let total = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    total += 0.299 * r + 0.587 * g + 0.114 * b;
    count += 1;
  }
  const avgLuminance = count > 0 ? total / count : 128;

  const isBright = avgLuminance > 150;
  return {
    textColor: isBright ? "#1c1c1e" : "#ffffff",
    scrimColor: isBright ? "#ffffff" : "#000000",
    scrimOpacity: isBright ? 0.72 : 0.5,
    accentColor: "#d4af7a",
    anchor: "bottom",
  };
}
