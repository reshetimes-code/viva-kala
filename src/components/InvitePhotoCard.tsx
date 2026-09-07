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
 *  legible-text-on-anything color/contrast problem too.
 *
 *  textStyle.photoPlacement switches to a different (non-overlapping) shape
 *  entirely - chosen by the guest themselves in AiDesignerChat's "how do you
 *  want your photo used?" step, so the photo and the text panel each get
 *  their own clear space instead of one sitting on top of the other. Stays
 *  undefined for every existing invite (both AI-drawn-text images and the
 *  older plain uploads), which keeps the original overlay-on-photo look
 *  exactly as it was for all of those. */
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
  const placement = textStyle?.photoPlacement;

  const details = (
    <>
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
    </>
  );

  if (placement) {
    return (
      <div className={`ipc-layout-card ipc-layout-${placement}`} style={{ color: style.accentColor }}>
        {placement === "round" ? (
          <div className="ipc-layout-content">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ipc-round-photo" src={imageUrl} alt="" />
            {details}
          </div>
        ) : placement === "quarter-bottom" ? (
          <>
            <div className="ipc-layout-content">{details}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ipc-layout-photo" src={imageUrl} alt="" />
          </>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ipc-layout-photo" src={imageUrl} alt="" />
            <div className="ipc-layout-content">{details}</div>
          </>
        )}
      </div>
    );
  }

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
        {details}
      </div>
    </div>
  );
}
