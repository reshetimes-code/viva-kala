import type { HeadlineParts } from "@/lib/categoryFields";
import { DEFAULT_TEXT_STYLE, type TextStyle } from "@/lib/textStyleHeuristic";

/** The actual "AI designed this for you" payoff: a user's own photo with
 *  the event's name/date/venue laid over it automatically - color, scrim
 *  and position chosen by textStyle (computed once, at save time, either
 *  by the heuristic in textStyleHeuristic.ts or the Gemini-vision call in
 *  Phase C) instead of the user ever touching a font or color picker.
 *  Used identically in the create-flow live preview and the guest-facing
 *  view - what the user approves is exactly what guests see. */
export default function InvitePhotoCard({
  imageUrl,
  headline,
  dateText,
  venueText,
  textStyle,
}: {
  imageUrl: string;
  headline: HeadlineParts | null;
  dateText?: string;
  venueText?: string;
  textStyle?: TextStyle;
}) {
  const style = textStyle ?? DEFAULT_TEXT_STYLE;
  const scrimRgb = hexToRgb(style.scrimColor);

  const scrimGradient =
    style.anchor === "top"
      ? `linear-gradient(to bottom, rgba(${scrimRgb},${style.scrimOpacity}) 0%, rgba(${scrimRgb},${style.scrimOpacity * 0.4}) 45%, transparent 75%)`
      : style.anchor === "center"
      ? `rgba(${scrimRgb},${style.scrimOpacity})`
      : `linear-gradient(to top, rgba(${scrimRgb},${style.scrimOpacity}) 0%, rgba(${scrimRgb},${style.scrimOpacity * 0.4}) 45%, transparent 75%)`;

  return (
    <div className="ipc-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ipc-photo" src={imageUrl} alt="" />
      <div className="ipc-scrim" style={{ background: scrimGradient }} />
      <div className={`ipc-content ipc-anchor-${style.anchor}`} style={{ color: style.textColor }}>
        {headline?.line1 && <div className="ipc-line1">{headline.line1}</div>}
        {headline?.line2 && <div className="ipc-line2">{headline.line2}</div>}
        {dateText && (
          <div className="ipc-date" style={{ borderColor: style.accentColor }}>
            {dateText}
          </div>
        )}
        {venueText && <div className="ipc-venue">{venueText}</div>}
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r},${g},${b}`;
}
