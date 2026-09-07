import { Fragment, type ReactNode } from "react";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/eventCategories";

// Re-exported for back-compat - every existing import of EventCategory/
// EVENT_CATEGORIES from "@/lib/templates" keeps working unchanged. The
// canonical definition now lives in eventCategories.ts so the photo-upload
// creation flow (src/app/create/image) can share it without importing this
// whole coded-template-gallery module.
export type { EventCategory };
export { EVENT_CATEGORIES };

export interface TemplateFields {
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  dateText: string;
  venueText: string;
  receptionTime: string;
  ceremonyTime: string;
  footerNote: string;
  imageDataUrl?: string;
  photoPlacement?: PhotoPlacement;
}

// English names in the sample data on purpose - Assistant/Heebo render both
// scripts cleanly, so the gallery preview shows the fonts working for both.
export const DEFAULT_TEMPLATE_FIELDS: TemplateFields = {
  titleLine1: "Daniel",
  titleLine2: "Emma",
  subtitle: "שמחים להזמינכם לחתונתנו",
  dateText: "3.7.2026",
  venueText: "מימלא - גן אירועים",
  receptionTime: "19:30",
  ceremonyTime: "20:30",
  footerNote: "נשמח לראותכם",
};

// A neutral gray silhouette placeholder, shown only in the template gallery
// so people can see where the photo lands - never persisted to a real invite.
const SAMPLE_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#c9ccd1"/><circle cx="100" cy="78" r="34" fill="#a7abb3"/><path d="M40 175c8-40 40-58 60-58s52 18 60 58" fill="#a7abb3"/></svg>`
  );

export type PhotoPlacement = "round" | "square" | "header" | "footer" | "side" | "background";

export const PHOTO_PLACEMENTS: PhotoPlacement[] = ["round", "square", "header", "footer", "side", "background"];

export const PHOTO_STYLE_LABEL: Record<PhotoPlacement, string> = {
  round: "עיגול במרכז",
  square: "ריבוע במרכז",
  header: "באנר בראש ההזמנה",
  footer: "באנר בתחתית ההזמנה",
  side: "רצועה בצד",
  background: "תמונת רקע מלאה",
};

export interface TemplateDef {
  id: string;
  label: string;
  swatch: string;
  photoStyle: PhotoPlacement;
  categories: EventCategory[];
}

export const TEMPLATES: TemplateDef[] = [
  { id: "cream-script", label: "סקריפט זהב על קרם", swatch: "linear-gradient(135deg,#f6efe2,#d9b96a)", photoStyle: "round", categories: ["חתונה"] },
  { id: "dark-gold", label: "כהה ומינימלי בזהב", swatch: "linear-gradient(135deg,#1b1b1f,#c9a24b)", photoStyle: "square", categories: ["חתונה", "בר/בת מצווה", "בר מצווה", "בת מצווה"] },
  { id: "floral-blush", label: "מסגרת פרחונית", swatch: "linear-gradient(135deg,#f7e3e6,#c98a93)", photoStyle: "header", categories: ["חתונה", "חינה"] },
  { id: "navy-bold", label: "נייבי מודגש", swatch: "linear-gradient(135deg,#12213f,#c9a24b)", photoStyle: "footer", categories: ["חתונה", "בר/בת מצווה", "בר מצווה", "בת מצווה", "אחר"] },
  { id: "line-frame", label: "מסגרת קווים דקה", swatch: "linear-gradient(135deg,#ffffff,#9aa0a8)", photoStyle: "side", categories: ["חתונה"] },
  { id: "botanical-green", label: "בוטני ירוק", swatch: "linear-gradient(135deg,#f3f1e6,#5c7a5c)", photoStyle: "background", categories: ["חתונה", "חינה"] },
  { id: "sunset-tropical", label: "שקיעה טרופית", swatch: "linear-gradient(135deg,#2f7c85,#f2a154)", photoStyle: "round", categories: ["חתונה"] },
  { id: "gold-ornate-dark", label: "זהב מהודר על כהה", swatch: "linear-gradient(135deg,#2a1240,#d4af37)", photoStyle: "square", categories: ["בר/בת מצווה", "בר מצווה", "בת מצווה", "חתונה"] },
  { id: "birthday-fun", label: "יום הולדת צבעוני", swatch: "linear-gradient(135deg,#e6379a,#ff8fc7)", photoStyle: "round", categories: ["יום הולדת"] },
  { id: "festive-balloons", label: "חגיגי עם בלונים", swatch: "linear-gradient(135deg,#f5efd8,#c9a24b)", photoStyle: "header", categories: ["יום הולדת", "בר/בת מצווה", "בר מצווה", "בת מצווה"] },
  { id: "gold-night", label: "רקע לילה זהוב", swatch: "linear-gradient(135deg,#0c0c10,#2a2418,#d9b969)", photoStyle: "background", categories: ["חתונה"] },
];

/** Per-template accent colors for UI chrome that sits OUTSIDE the card itself
 *  (the RSVP pull-tab bar) - picked to contrast against that template's own
 *  background rather than one fixed color for every design. */
export const TEMPLATE_CTA_COLORS: Record<string, { bg: string; color: string }> = {
  "cream-script": { bg: "rgba(122,106,63,0.92)", color: "#fdf8ee" },
  "dark-gold": { bg: "rgba(201,162,75,0.94)", color: "#1b1b1f" },
  "floral-blush": { bg: "rgba(165,102,114,0.92)", color: "#fff6f7" },
  "navy-bold": { bg: "rgba(201,162,75,0.94)", color: "#1b1b1f" },
  "line-frame": { bg: "rgba(43,43,43,0.92)", color: "#ffffff" },
  "botanical-green": { bg: "rgba(111,138,103,0.92)", color: "#f6faf4" },
  "sunset-tropical": { bg: "rgba(20,60,64,0.9)", color: "#fff3e6" },
  "gold-ornate-dark": { bg: "rgba(212,175,55,0.94)", color: "#2a1240" },
  "birthday-fun": { bg: "rgba(139,20,80,0.92)", color: "#fff0f8" },
  "festive-balloons": { bg: "rgba(40,40,40,0.9)", color: "#ffffff" },
  "gold-night": { bg: "rgba(217,185,105,0.94)", color: "#211a08" },
};

const CARD_CLASS: Record<string, string> = {
  "cream-script": "tpl-cream",
  "dark-gold": "tpl-dark-gold",
  "floral-blush": "tpl-floral",
  "navy-bold": "tpl-navy",
  "line-frame": "tpl-line",
  "botanical-green": "tpl-botanical",
  "sunset-tropical": "tpl-sunset",
  "gold-ornate-dark": "tpl-gold-ornate",
  "birthday-fun": "tpl-birthday",
  "festive-balloons": "tpl-balloons",
  "gold-night": "tpl-gold-night",
};

/** Elegant Latin-only fonts (no Hebrew glyphs) used for English names - the
 *  same fancy look as myinvite-style wedding cards. */
const LATIN_TITLE_FONT: Record<string, string> = {
  "cream-script": "'Petit Formal Script', cursive",
  "dark-gold": "'Playfair Display', serif",
  "floral-blush": "'Petit Formal Script', cursive",
  "navy-bold": "'Playfair Display', serif",
  "line-frame": "'Cormorant Garamond', serif",
  "botanical-green": "'Playfair Display', serif",
  "sunset-tropical": "'Playfair Display', serif",
  "gold-ornate-dark": "'Playfair Display', serif",
  "birthday-fun": "'Assistant', sans-serif",
  "festive-balloons": "'Assistant', sans-serif",
  "gold-night": "'Playfair Display', serif",
};

// Every LATIN_TITLE_FONT above is a Latin-only face with zero Hebrew glyph
// coverage - a Hebrew name used to fall through to plain 'Assistant' (the
// same base font as the rest of the card's body text) on every single
// formal/elegant template, so the "fancy" look only ever showed up for
// English names. Frank Ruhl Libre is a real Hebrew serif with the same
// elegant, high-contrast character the Latin scripts above are going for -
// this is what actually makes a Hebrew name (the common case for this app)
// read as "designed" instead of generic. The two playful/casual templates
// keep Assistant bold on purpose - a serif there would look formal, not fun.
const HEBREW_TITLE_FONT: Record<string, string> = {
  "cream-script": "'Frank Ruhl Libre', serif",
  "dark-gold": "'Frank Ruhl Libre', serif",
  "floral-blush": "'Frank Ruhl Libre', serif",
  "navy-bold": "'Frank Ruhl Libre', serif",
  "line-frame": "'Frank Ruhl Libre', serif",
  "botanical-green": "'Frank Ruhl Libre', serif",
  "sunset-tropical": "'Frank Ruhl Libre', serif",
  "gold-ornate-dark": "'Frank Ruhl Libre', serif",
  "gold-night": "'Frank Ruhl Libre', serif",
};

const HEBREW_CHAR_RANGE = new RegExp("[\\u0590-\\u05FF]");

function isLatinTitle(fields: TemplateFields): boolean {
  const text = `${fields.titleLine1}${fields.titleLine2}`;
  if (!text.trim()) return false;
  return !HEBREW_CHAR_RANGE.test(text) && /[A-Za-z]/.test(text);
}

function titleFontStyle(templateId: string, fields: TemplateFields): { fontFamily?: string } {
  if (isLatinTitle(fields)) {
    return { fontFamily: LATIN_TITLE_FONT[templateId] ?? "'Playfair Display', serif" };
  }
  const hebrewFont = HEBREW_TITLE_FONT[templateId];
  return hebrewFont ? { fontFamily: hebrewFont } : {};
}

/** Small clean line icons - kept as real vector shapes instead of emoji,
 *  which render inconsistently across platforms and read as unpolished. */
function PinIcon() {
  return (
    <svg className="tpl-balloons-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.4" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg className="tpl-balloons-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg className="tpl-balloons-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}
/** Two interlocking wedding rings - the gold-night template's detail-row
 *  icon for the חופה/ceremony line, and the larger decorative glyph above
 *  the title. Same real-vector-shape convention as the icons above. */
function RingsIcon() {
  return (
    <svg className="tpl-balloons-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="9" cy="14" r="5.5" />
      <circle cx="15" cy="14" r="5.5" />
    </svg>
  );
}

/** The decorative text/typography content for each template look - photo-agnostic. */
function renderContent(templateId: string, fields: TemplateFields) {
  const titleStyle = titleFontStyle(templateId, fields);
  switch (templateId) {
    case "dark-gold":
      return (
        <div className="tpl-dg-frame">
          <p className="tpl-dg-subtitle">{fields.subtitle}</p>
          <h2 className="tpl-dg-title" style={titleStyle}>
            {fields.titleLine1}
            <span className="tpl-dg-amp">&amp;</span>
            {fields.titleLine2}
          </h2>
          <div className="tpl-dg-rule" />
          <p className="tpl-dg-date">{fields.dateText}</p>
          <p className="tpl-dg-venue">{fields.venueText}</p>
          <div className="tpl-dg-times">
            {fields.ceremonyTime && <span>קבלת פנים {fields.ceremonyTime}</span>}
            {fields.receptionTime && <span>חופה וקידושין {fields.receptionTime}</span>}
          </div>
          <p className="tpl-dg-footer">{fields.footerNote}</p>
        </div>
      );

    case "floral-blush":
      return (
        <>
          <div className="tpl-floral-bouquet" aria-hidden="true" />
          <p className="tpl-floral-subtitle">{fields.subtitle}</p>
          <h2 className="tpl-floral-title" style={titleStyle}>
            {fields.titleLine1}
            <span className="tpl-floral-amp">&amp;</span>
            {fields.titleLine2}
          </h2>
          <div className="tpl-floral-swash" aria-hidden="true" />
          <p className="tpl-floral-date">
            <span className="tpl-floral-date-chip">{fields.dateText}</span>
          </p>
          <p className="tpl-floral-venue">{fields.venueText}</p>
          <p className="tpl-floral-times">
            {fields.ceremonyTime} · {fields.receptionTime}
          </p>
          <p className="tpl-floral-footer">{fields.footerNote}</p>
        </>
      );

    case "navy-bold":
      return (
        <>
          <span className="tpl-navy-corner tpl-navy-corner-tl" aria-hidden="true" />
          <span className="tpl-navy-corner tpl-navy-corner-tr" aria-hidden="true" />
          <span className="tpl-navy-corner tpl-navy-corner-bl" aria-hidden="true" />
          <span className="tpl-navy-corner tpl-navy-corner-br" aria-hidden="true" />
          <div className="tpl-navy-box">
            <p className="tpl-navy-subtitle">{fields.subtitle}</p>
            <h2 className="tpl-navy-title" style={titleStyle}>
              {fields.titleLine1}
              <span className="tpl-navy-amp">&amp;</span>
              {fields.titleLine2}
            </h2>
            <div className="tpl-navy-divider" />
            <p className="tpl-navy-date">{fields.dateText}</p>
            <p className="tpl-navy-venue">{fields.venueText}</p>
            <p className="tpl-navy-times">
              {fields.ceremonyTime && `חופה וקידושין ${fields.ceremonyTime}`}
              {fields.receptionTime && ` · קבלת פנים ${fields.receptionTime}`}
            </p>
          </div>
          <p className="tpl-navy-footer">{fields.footerNote}</p>
        </>
      );

    case "line-frame":
      return (
        <div className="tpl-line-inner">
          <p className="tpl-line-subtitle">{fields.subtitle}</p>
          <h2 className="tpl-line-title" style={titleStyle}>{fields.titleLine1}</h2>
          <span className="tpl-line-amp">&amp;</span>
          <h2 className="tpl-line-title" style={titleStyle}>{fields.titleLine2}</h2>
          <p className="tpl-line-date">{fields.dateText}</p>
          <div className="tpl-line-dots">• • •</div>
          <p className="tpl-line-venue">{fields.venueText}</p>
          <p className="tpl-line-times">
            {fields.ceremonyTime} | {fields.receptionTime}
          </p>
          <p className="tpl-line-footer">{fields.footerNote}</p>
        </div>
      );

    case "botanical-green":
      return (
        <>
          <div className="tpl-bot-branch tpl-bot-branch-top" aria-hidden="true" />
          <p className="tpl-bot-subtitle">{fields.subtitle}</p>
          <h2 className="tpl-bot-title" style={titleStyle}>
            {fields.titleLine1}
            <span className="tpl-bot-amp">&amp;</span>
            {fields.titleLine2}
          </h2>
          <p className="tpl-bot-date">{fields.dateText}</p>
          <p className="tpl-bot-venue">{fields.venueText}</p>
          <p className="tpl-bot-times">
            {fields.ceremonyTime} · {fields.receptionTime}
          </p>
          <p className="tpl-bot-footer">{fields.footerNote}</p>
          <div className="tpl-bot-branch tpl-bot-branch-bottom" aria-hidden="true" />
        </>
      );

    case "sunset-tropical":
      return (
        <>
          <div className="tpl-sunset-sun" aria-hidden="true" />
          <p className="tpl-sunset-subtitle">{fields.subtitle}</p>
          <h2 className="tpl-sunset-title" style={titleStyle}>
            {fields.titleLine1}
            <span className="tpl-sunset-amp">&amp;</span>
            {fields.titleLine2}
          </h2>
          <div className="tpl-sunset-date-badge">{fields.dateText}</div>
          <p className="tpl-sunset-venue">{fields.venueText}</p>
          <p className="tpl-sunset-times">
            {fields.ceremonyTime} · {fields.receptionTime}
          </p>
          <p className="tpl-sunset-footer">{fields.footerNote}</p>
        </>
      );

    case "gold-ornate-dark":
      return (
        <div className="tpl-go-frame">
          <div className="tpl-go-corner tpl-go-tl" aria-hidden="true" />
          <div className="tpl-go-corner tpl-go-tr" aria-hidden="true" />
          <div className="tpl-go-corner tpl-go-bl" aria-hidden="true" />
          <div className="tpl-go-corner tpl-go-br" aria-hidden="true" />
          <p className="tpl-go-subtitle">{fields.subtitle}</p>
          <h2 className="tpl-go-title" style={titleStyle}>
            {fields.titleLine1}
            <span className="tpl-go-amp">&amp;</span>
            {fields.titleLine2}
          </h2>
          <div className="tpl-go-rule" />
          <p className="tpl-go-date">{fields.dateText}</p>
          <p className="tpl-go-venue">{fields.venueText}</p>
          <p className="tpl-go-times">
            {fields.ceremonyTime} · {fields.receptionTime}
          </p>
          <p className="tpl-go-footer">{fields.footerNote}</p>
        </div>
      );

    case "birthday-fun":
      return (
        <>
          <div className="tpl-bday-confetti" aria-hidden="true">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className={`tpl-bday-dot tpl-bday-dot-${i % 4}`} />
            ))}
          </div>
          <p className="tpl-bday-subtitle">{fields.subtitle}</p>
          <h2 className="tpl-bday-title" style={titleStyle}>
            {fields.titleLine1}
            {fields.titleLine2 && <span className="tpl-bday-amp">&amp; {fields.titleLine2}</span>}
          </h2>
          <p className="tpl-bday-date">{fields.dateText}</p>
          <p className="tpl-bday-venue">{fields.venueText}</p>
          <p className="tpl-bday-times">
            {fields.ceremonyTime} · {fields.receptionTime}
          </p>
          <div className="tpl-bday-rule" />
          <p className="tpl-bday-footer">{fields.footerNote}</p>
        </>
      );

    case "festive-balloons":
      return (
        <>
          <h2 className="tpl-balloons-name" style={titleStyle}>
            {fields.titleLine1}
          </h2>
          {fields.titleLine2 && <p className="tpl-balloons-sub">{fields.titleLine2}</p>}
          <div className="tpl-balloons-dashes" />
          <div className="tpl-balloons-details">
            <div className="tpl-balloons-detail">
              <PinIcon />
              <span>{fields.venueText}</span>
            </div>
            <div className="tpl-balloons-detail">
              <ClockIcon />
              <span>{fields.ceremonyTime}</span>
            </div>
            <div className="tpl-balloons-detail">
              <CalendarIcon />
              <span>{fields.dateText}</span>
            </div>
          </div>
          <div className="tpl-balloons-dashes" />
          <p className="tpl-balloons-footer">{fields.footerNote}</p>
        </>
      );

    case "gold-night": {
      // Same "small icon + short text, thin gold divider between rows" shape
      // as festive-balloons' tpl-balloons-details, but rendered as stacked
      // rows (matching the reference: date / venue / חופה time, each on its
      // own line) instead of a horizontal row - built from whichever of
      // these four fields the user actually filled in, so a blank
      // receptionTime/ceremonyTime just skips that row instead of leaving
      // an empty one with a dangling divider.
      const detailRows: { icon: ReactNode; text: string }[] = [];
      if (fields.dateText) detailRows.push({ icon: <CalendarIcon />, text: fields.dateText });
      if (fields.venueText) detailRows.push({ icon: <PinIcon />, text: fields.venueText });
      if (fields.receptionTime) detailRows.push({ icon: <ClockIcon />, text: `קבלת פנים ${fields.receptionTime}` });
      if (fields.ceremonyTime) detailRows.push({ icon: <RingsIcon />, text: `חופה ב-${fields.ceremonyTime}` });
      return (
        <div className="tpl-gn-frame">
          <span className="tpl-gn-rings" aria-hidden="true">
            <RingsIcon />
          </span>
          <h2 className="tpl-gn-title" style={titleStyle}>
            {fields.titleLine1}
            <span className="tpl-gn-amp">&amp;</span>
            {fields.titleLine2}
          </h2>
          {fields.subtitle && <p className="tpl-gn-subtitle">{fields.subtitle}</p>}
          {detailRows.length > 0 && (
            <div className="tpl-gn-rows">
              {detailRows.map((row, i) => (
                <Fragment key={i}>
                  {i > 0 && <div className="tpl-gn-divider" aria-hidden="true" />}
                  <div className="tpl-gn-row">
                    {row.icon}
                    <span>{row.text}</span>
                  </div>
                </Fragment>
              ))}
            </div>
          )}
          <p className="tpl-gn-footer">{fields.footerNote}</p>
        </div>
      );
    }

    case "cream-script":
    default:
      return (
        <>
          <div className="tpl-cream-splash tpl-cream-splash-tl" />
          <div className="tpl-cream-splash tpl-cream-splash-br" />
          <p className="tpl-cream-subtitle">{fields.subtitle}</p>
          <h2 className="tpl-cream-title" style={titleStyle}>
            {fields.titleLine1}
            <span className="tpl-cream-amp">&amp;</span>
            {fields.titleLine2}
          </h2>
          <p className="tpl-cream-date">{fields.dateText}</p>
          <div className="tpl-cream-rule" />
          <p className="tpl-cream-venue">{fields.venueText}</p>
          <p className="tpl-cream-times">
            {fields.ceremonyTime} · {fields.receptionTime}
          </p>
          <p className="tpl-cream-footer">{fields.footerNote}</p>
        </>
      );
  }
}

export function TemplateCard({
  templateId,
  fields,
  useSampleImage = false,
}: {
  templateId: string;
  fields: TemplateFields;
  useSampleImage?: boolean;
}) {
  const cardClass = CARD_CLASS[templateId] ?? "tpl-cream";
  const def = TEMPLATES.find((t) => t.id === templateId);
  const placement: PhotoPlacement = fields.photoPlacement ?? def?.photoStyle ?? "round";
  const photo = fields.imageDataUrl || (useSampleImage ? SAMPLE_IMAGE : "");
  const content = renderContent(templateId, fields);

  if (!photo) {
    return (
      <div className={`tpl-card ${cardClass}`}>
        <div className="tpl-card-inner">{content}</div>
      </div>
    );
  }

  switch (placement) {
    case "square":
      return (
        <div className={`tpl-card ${cardClass}`}>
          <div className="tpl-card-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="tpl-photo-square" src={photo} alt="" />
            {content}
          </div>
        </div>
      );

    case "header":
      return (
        <div className={`tpl-card ${cardClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="tpl-photo-header" src={photo} alt="" />
          <div className="tpl-card-inner">{content}</div>
        </div>
      );

    case "footer":
      return (
        <div className={`tpl-card ${cardClass}`}>
          <div className="tpl-card-inner">{content}</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="tpl-photo-footer" src={photo} alt="" />
        </div>
      );

    case "side":
      return (
        <div className={`tpl-card ${cardClass} tpl-layout-side`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="tpl-photo-side" src={photo} alt="" />
          <div className="tpl-side-content">{content}</div>
        </div>
      );

    case "background":
      return (
        <div className={`tpl-card ${cardClass} tpl-layout-bg`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="tpl-photo-bg" src={photo} alt="" />
          <div className="tpl-bg-overlay" />
          <div className="tpl-bg-content">{content}</div>
        </div>
      );

    case "round":
    default:
      return (
        <div className={`tpl-card ${cardClass}`}>
          <div className="tpl-card-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="tpl-photo-round" src={photo} alt="" />
            {content}
          </div>
        </div>
      );
  }
}
