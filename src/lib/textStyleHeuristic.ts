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
