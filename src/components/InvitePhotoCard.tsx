import type { HeadlineParts } from "@/lib/categoryFields";
import { DEFAULT_TEXT_STYLE, type TextStyle } from "@/lib/textStyleHeuristic";

/** The actual "AI designed this for you" payoff: a user's own photo with
 *  the event's name/date/venue laid over it - in a solid cream card (not
 *  free-floating text straight on the photo, which is what this used to
 *  be). Putting the text on its own controlled surface instead of directly
 *  on whatever the photo happens to be doing at that spot is what actually
 *  fixed "the text looks bad no matter what font/size/color I try" - the
 *  photo's own brightness/color/business was fighting the text every time,
 *  no matter how the type itself was tuned. anchor (from textStyle) still
 *  picks where the card sits, so a photo that's mostly empty at the bottom
 *  vs the top still gets used well - it just no longer has to double as a
 *  legible-text-on-anything color/contrast problem too. */
export default function InvitePhotoCard({
  imageUrl,
  headline,
  dateText,
  venueText,
  extraLines,
  textStyle,
}: {
  imageUrl: string;
  headline: HeadlineParts | null;
  dateText?: string;
  venueText?: string;
  /** Ceremony time, parents' names, and other optional category details
   *  that don't have their own spot on the card - see buildExtraDetailLines
   *  in categoryFields.ts. */
  extraLines?: string[];
  textStyle?: TextStyle;
}) {
  const style = textStyle ?? DEFAULT_TEXT_STYLE;

  return (
    <div className="ipc-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ipc-photo" src={imageUrl} alt="" />
      {/* The card itself stays a safe, always-legible cream surface, but
          its accent (divider, date pill) still comes from the per-photo
          color the heuristic/AI-vision analysis picked - so an upload gets
          a genuinely complementary color instead of the same flat gold on
          every single photo. */}
      <div className={`ipc-panel ipc-anchor-${style.anchor}`} style={{ color: style.accentColor }}>
        {headline?.intro && <div className="ipc-intro">{headline.intro}</div>}
        {headline?.line1 && <div className="ipc-line1">{headline.line1}</div>}
        {headline?.line2 && <div className="ipc-line2">{headline.line2}</div>}
        {(headline?.line1 || headline?.line2) && dateText && (
          <div className="ipc-divider">
            <span>✦</span>
          </div>
        )}
        {dateText && (
          <div className="ipc-date" style={{ borderColor: style.accentColor, whiteSpace: "pre-line" }}>
            {dateText}
          </div>
        )}
        {venueText && <div className="ipc-venue">{venueText}</div>}
        {extraLines && extraLines.length > 0 && (
          <div className="ipc-extra">
            {extraLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
