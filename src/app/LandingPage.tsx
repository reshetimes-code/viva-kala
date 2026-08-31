import Link from "next/link";
import { TemplateCard, DEFAULT_TEMPLATE_FIELDS } from "@/lib/templates";
import RevealOnScroll from "@/components/RevealOnScroll";
import HeroSlider from "@/components/HeroSlider";
import VivaIntro from "@/components/VivaIntro";

const SHOWCASE_IDS = ["cream-script", "floral-blush", "gold-ornate-dark", "botanical-green"];

// Free-license stock photos (Pexels) used only as tasteful gallery previews for
// each event category - never persisted into a real user invite.
const CATEGORIES = [
  {
    id: "cream-script",
    label: "חתונה",
    sampleImage: "https://images.pexels.com/photos/18517621/pexels-photo-18517621.png?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "gold-ornate-dark",
    label: "בר/בת מצווה",
    sampleImage: "/category/bar-bat-mitzvah.webp",
  },
  {
    id: "botanical-green",
    label: "חינה",
    sampleImage: "/category/henna.webp",
  },
  {
    id: "birthday-fun",
    label: "יום הולדת",
    sampleImage: "https://images.pexels.com/photos/8015132/pexels-photo-8015132.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "navy-bold",
    label: "אחר",
    sampleImage: "https://images.pexels.com/photos/4722577/pexels-photo-4722577.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

const FEATURES = [
  {
    icon: "ai",
    title: "מעצב AI אישי, לא גלריה",
    text: "מספרים לנו כמה מילים על האירוע - והמנוע שלנו יוצר לכם הזמנה מעוצבת ברמה מקצועית, כאילו הזמנתם מעצב/ת פרטי/ת.",
  },
  {
    icon: "upload",
    title: "או תעלו תמונה משלכם",
    text: "עיצבתם הזמנה בעצמכם? העלו אותה כתמונה אחת והמערכת תדאג לכל השאר.",
  },
  {
    icon: "rsvp",
    title: "אישורי הגעה חכמים",
    text: "האורחים מאשרים הגעה ישירות מתוך ההזמנה - שם, טלפון וכמות המגיעים, בלוח בקרה אחד ובזמן אמת.",
  },
  {
    icon: "seating",
    title: "סידורי הושבה חזותיים",
    text: "בונים שולחנות בלחיצה, והמערכת מציגה כל שולחן כשרטוט עגול עם שמות האורחים סביבו - בדיוק כמו שישבו באירוע.",
  },
  {
    icon: "qr",
    title: "קוד QR אחד לכל האולם",
    text: "מדפיסים קוד אחד ותולים בכניסה לאירוע - כל אורח סורק, מקליד את שמו, ומקבל מיד את מספר השולחן שלו.",
  },
  {
    icon: "share",
    title: "שיתוף מיידי",
    text: "קישור אחד לשיתוף בוואטסאפ או SMS - נפתח יפה בנייד ובמחשב כאחד.",
  },
];

const STEPS = [
  { n: "1", title: "נרשמים", text: "יצירת חשבון תוך חצי דקה" },
  { n: "2", title: "בוחרים עיצוב", text: "מהגלריה או מעלים תמונה משלכם" },
  { n: "3", title: "משתפים", text: "קישור מוכן לשליחה לכל האורחים" },
  { n: "4", title: "מסדרים הושבה", text: "משבצים לשולחנות ומדפיסים קוד לכניסה" },
];

const FOOTER_COLUMNS = [
  {
    title: "המוצר",
    links: [
      { label: "גלריית עיצובים", href: "/create/templates" },
      { label: "יצירת הזמנה", href: "/create/image" },
      { label: "לוח הבקרה", href: "/dashboard" },
    ],
  },
  {
    title: "סוגי אירועים",
    links: [
      { label: "הזמנות לחתונה", href: "/create/templates" },
      { label: "הזמנות לבר/בת מצווה", href: "/create/templates" },
      { label: "הזמנות לחינה", href: "/create/templates" },
      { label: "הזמנות ליום הולדת", href: "/create/templates" },
      { label: "הזמנות לאירועים אחרים", href: "/create/templates" },
    ],
  },
  {
    title: "חשבון",
    links: [
      { label: "התחברות", href: "/login" },
      { label: "הרשמה", href: "/signup" },
    ],
  },
];

function RibbonDoodle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 160 100" width="140" height="90" fill="none" aria-hidden="true">
      <path
        d="M80 60 C60 40 40 40 30 55 C22 66 32 78 48 74 C60 71 62 60 50 56 C42 53 34 60 40 68"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      />
      <path
        d="M80 60 C100 40 120 40 130 55 C138 66 128 78 112 74 C100 71 98 60 110 56"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      />
    </svg>
  );
}

/** Small, single-color line icons for the feature grid - deliberately not
 *  emoji, to keep the page feeling designed rather than decorated. */
function FeatureIcon({ type }: { type: string }) {
  const common = { viewBox: "0 0 32 32", width: 26, height: 26, fill: "none", "aria-hidden": true } as const;
  switch (type) {
    case "ai":
      return (
        <svg {...common}>
          <path
            d="M16 4l2.4 8.6L27 15l-8.6 2.4L16 26l-2.4-8.6L5 15l8.6-2.4L16 4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="25" cy="7" r="1.6" fill="currentColor" />
        </svg>
      );
    case "gallery":
      return (
        <svg {...common}>
          <rect x="5" y="9" width="16" height="18" rx="2.5" stroke="currentColor" strokeWidth="2" />
          <rect x="11" y="4" width="16" height="18" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "upload":
      return (
        <svg {...common}>
          <path d="M16 21V6M16 6l-6 6M16 6l6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 24v2.5A1.5 1.5 0 0 0 7.5 28h17a1.5 1.5 0 0 0 1.5-1.5V24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case "rsvp":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="11.5" stroke="currentColor" strokeWidth="2.2" />
          <path d="M11 16.5l3.3 3.3L21.5 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "seating":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="6.5" stroke="currentColor" strokeWidth="2" />
          {Array.from({ length: 6 }).map((_, i) => {
            const a = (i / 6) * 2 * Math.PI;
            const x = 16 + 12.5 * Math.cos(a);
            const y = 16 + 12.5 * Math.sin(a);
            return <circle key={i} cx={x} cy={y} r="2" fill="currentColor" />;
          })}
        </svg>
      );
    case "qr":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="19" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="4" y="19" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="2" />
          <rect x="20.5" y="20.5" width="6" height="6" fill="currentColor" />
        </svg>
      );
    case "share":
      return (
        <svg {...common}>
          <circle cx="8" cy="16" r="3.2" stroke="currentColor" strokeWidth="2" />
          <circle cx="24" cy="7" r="3.2" stroke="currentColor" strokeWidth="2" />
          <circle cx="24" cy="25" r="3.2" stroke="currentColor" strokeWidth="2" />
          <path d="M10.8 14.3L21.2 8.7M10.8 17.7L21.2 23.3" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    default:
      return null;
  }
}

/** Round-table doodle for the seating/QR band - a plain circle with seats
 *  around it, echoing the real seating chart guests see in the dashboard. */
function SeatingDoodle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" width="180" height="180" fill="none" aria-hidden="true">
      <circle cx="100" cy="100" r="44" stroke="currentColor" strokeWidth="2.5" />
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 7) * 2 * Math.PI;
        const x = 100 + 76 * Math.cos(a);
        const y = 100 + 76 * Math.sin(a);
        return <circle key={i} cx={x} cy={y} r="8.5" stroke="currentColor" strokeWidth="2.5" />;
      })}
    </svg>
  );
}

function QrDoodle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" width="78" height="78" fill="none" aria-hidden="true">
      <rect x="6" y="6" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="4" />
      <rect x="66" y="6" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="4" />
      <rect x="6" y="66" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="4" />
      <rect x="16" y="16" width="8" height="8" fill="currentColor" />
      <rect x="76" y="16" width="8" height="8" fill="currentColor" />
      <rect x="16" y="76" width="8" height="8" fill="currentColor" />
      <rect x="46" y="46" width="10" height="10" fill="currentColor" />
      <rect x="46" y="6" width="10" height="10" fill="currentColor" />
      <rect x="66" y="46" width="10" height="10" fill="currentColor" />
      <rect x="46" y="66" width="10" height="10" fill="currentColor" />
    </svg>
  );
}

export default function LandingPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <div className="landing-page">
      <VivaIntro />
      <HeroSlider>
        <header className="landing-nav hero-nav landing-fade-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logoViva-white.png" alt="VIVA" className="landing-logo-img" />
        </header>

        <section className="landing-hero hero-slide-hero">
          <h1 className="landing-fade-in landing-fade-in-delay-1">הזמנות דיגיטליות מרשימות, תוך דקות</h1>
          <p className="landing-fade-in landing-fade-in-delay-2">
            בחרו עיצוב מוכן או העלו הזמנה משלכם, מלאו פרטים, ושתפו קישור אחד -
            עם אישורי הגעה, סידורי הושבה וקוד QR לאולם לכל האורחים שלכם.
          </p>
          <div className="landing-fade-in landing-fade-in-delay-3">
            <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="landing-hero-cta">
              {isLoggedIn ? "לוח הבקרה שלי" : "התחילו בחינם"}
            </Link>
          </div>
        </section>
      </HeroSlider>

      <section className="landing-showcase">
        <RevealOnScroll className="landing-showcase-grid">
          {SHOWCASE_IDS.map((id, i) => (
            <div key={id} className="landing-showcase-item" style={{ transitionDelay: `${i * 90}ms` }}>
              <TemplateCard templateId={id} fields={DEFAULT_TEMPLATE_FIELDS} useSampleImage />
            </div>
          ))}
        </RevealOnScroll>
      </section>

      {/* "אז מה חוגגים?" - category tiles, each a full-bleed themed photo as the preview */}
      <section className="landing-categories">
        <RevealOnScroll>
          <h2>אז מה חוגגים?</h2>
        </RevealOnScroll>
        <RevealOnScroll className="landing-categories-grid">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.id}
              href={`/create/image?category=${encodeURIComponent(c.label)}`}
              className="landing-category-tile"
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <div className="landing-category-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.sampleImage} alt={c.label} loading="lazy" />
              </div>
              <div className="landing-category-label">{c.label}</div>
            </Link>
          ))}
        </RevealOnScroll>
        <RibbonDoodle className="landing-ribbon landing-ribbon-left" />
        <RibbonDoodle className="landing-ribbon landing-ribbon-right" />
      </section>

      {/* Colored feature band with a phone mockup - matches the "gift cards / RSVP" style band */}
      <section className="landing-band">
        <RevealOnScroll className="landing-band-inner">
          <div className="landing-band-text">
            <h2>שליחה ואישורי הגעה בלחיצה אחת</h2>
            <ul>
              <li>שליחת קישור להזמנה בוואטסאפ או SMS ישירות לאורחים שלכם</li>
              <li>האורחים מאשרים הגעה מתוך ההזמנה עצמה - בלי אפליקציה נוספת</li>
              <li>כל אורח מציין כמה אנשים מגיעים איתו, לא רק אישור בודד</li>
              <li>לוח בקרה אחד לכל ההזמנות והאישורים שלכם, בזמן אמת</li>
            </ul>
            <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="landing-outline-btn landing-outline-btn-light">
              לפרטים נוספים
            </Link>
          </div>
          <div className="landing-band-mockup">
            <div className="mobile-frame landing-mockup-frame">
              <div className="mobile-screen">
                <TemplateCard templateId="floral-blush" fields={DEFAULT_TEMPLATE_FIELDS} useSampleImage />
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* Second band, reversed layout and a different palette - the seating
          chart + hall QR feature is what makes VIVA stand out, so it gets
          its own dedicated showcase instead of hiding in the feature grid. */}
      <section className="landing-band landing-band-alt">
        <RevealOnScroll className="landing-band-inner landing-band-inner-reverse">
          <div className="landing-band-text">
            <h2>הושבה מסודרת, בלי בלגן ביום האירוע</h2>
            <ul>
              <li>יוצרים שולחנות ומשבצים אליהם אורחים בכמה קליקים</li>
              <li>כל שולחן מוצג כשרטוט עגול עם שמות האורחים סביבו - בדיוק כמו שישבו באירוע</li>
              <li>קוד QR אחד להדפסה ותלייה בכניסה לאולם</li>
              <li>כל אורח סורק, מקליד את שמו, ומוצא את השולחן שלו לבד - בלי לעמוד עם רשימות ביד</li>
            </ul>
            <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="landing-outline-btn landing-outline-btn-light">
              לפרטים נוספים
            </Link>
          </div>
          <div className="landing-band-mockup landing-seating-visual">
            <SeatingDoodle className="landing-seating-doodle" />
            <QrDoodle className="landing-seating-qr" />
          </div>
        </RevealOnScroll>
      </section>

      <section className="landing-features">
        <RevealOnScroll>
          <h2>הכל במקום אחד</h2>
        </RevealOnScroll>
        <RevealOnScroll className="landing-features-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="landing-feature-card" style={{ transitionDelay: `${i * 90}ms` }}>
              <div className="landing-feature-icon">
                <FeatureIcon type={f.icon} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </RevealOnScroll>
      </section>

      <section className="landing-steps">
        <RevealOnScroll>
          <h2>איך זה עובד</h2>
        </RevealOnScroll>
        <RevealOnScroll className="landing-steps-row">
          {STEPS.map((s, i) => (
            <div key={s.n} className="landing-step" style={{ transitionDelay: `${i * 120}ms` }}>
              <div className="landing-step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </RevealOnScroll>
      </section>

      <RevealOnScroll className="landing-final-cta">
        <h2>מוכנים ליצור את ההזמנה שלכם?</h2>
        <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="landing-hero-cta">
          {isLoggedIn ? "לוח הבקרה שלי" : "הרשמה חינם"}
        </Link>
      </RevealOnScroll>

      <footer className="landing-footer">
        <div className="landing-footer-top">
          <div className="landing-footer-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logoViva-white.png" alt="VIVA" className="landing-footer-logo-img" />
            <p>האירוע מתחיל כאן</p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="landing-footer-col">
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="landing-footer-bottom">
          <span>VIVA © 2026 - כל הזכויות שמורות</span>
        </div>
      </footer>
    </div>
  );
}
