import Link from "next/link";
import RevealOnScroll from "@/components/RevealOnScroll";
import HeroSlider from "@/components/HeroSlider";
import VivaIntro from "@/components/VivaIntro";
import ShowcaseGallery from "@/components/ShowcaseGallery";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getServerLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/locale";

// Real, fully-designed invitations (not code-rendered template previews) used
// to showcase actual output quality on the homepage.
const SHOWCASE_EXAMPLES: Record<Locale, { src: string; alt: string }[]> = {
  he: [
    { src: "/examples/wedding-night-gold.webp", alt: "הזמנה לחתונה - עיצוב לילי בזהב" },
    { src: "/examples/bar-mitzvah-photo.webp", alt: "הזמנה לבר מצווה - עיצוב כחול-זהב" },
    { src: "/examples/bat-mitzvah-glam.webp", alt: "הזמנה לבת מצווה - עיצוב עם תמונה" },
    { src: "/examples/bat-mitzvah-cream.webp", alt: "הזמנה לחתונה - עיצוב כהה בזהב עם ורדים" },
    { src: "/examples/brit-baby-blue.webp", alt: "הזמנה לברית - עיצוב בכחול ולבן" },
  ],
  en: [
    { src: "/examples/wedding-night-gold.webp", alt: "Wedding invitation - night gold design" },
    { src: "/examples/bar-mitzvah-photo.webp", alt: "Bar mitzvah invitation - blue-gold design" },
    { src: "/examples/bat-mitzvah-glam.webp", alt: "Bat mitzvah invitation - photo design" },
    { src: "/examples/bat-mitzvah-cream.webp", alt: "Wedding invitation - dark gold design with roses" },
    { src: "/examples/brit-baby-blue.webp", alt: "Brit invitation - blue and white design" },
  ],
};

// Free-license stock photos (Pexels) used only as tasteful gallery previews for
// each event category - never persisted into a real user invite.
const CATEGORIES: Record<Locale, { id: string; label: string; sampleImage: string }[]> = {
  he: [
    { id: "cream-script", label: "חתונה", sampleImage: "https://images.pexels.com/photos/18517621/pexels-photo-18517621.png?auto=compress&cs=tinysrgb&w=800" },
    { id: "gold-ornate-dark", label: "בר/בת מצווה", sampleImage: "/category/bar-bat-mitzvah.webp" },
    { id: "botanical-green", label: "חינה", sampleImage: "/category/henna.webp" },
    { id: "birthday-fun", label: "יום הולדת", sampleImage: "https://images.pexels.com/photos/8015132/pexels-photo-8015132.jpeg?auto=compress&cs=tinysrgb&w=800" },
    { id: "navy-bold", label: "אחר", sampleImage: "https://images.pexels.com/photos/4722577/pexels-photo-4722577.jpeg?auto=compress&cs=tinysrgb&w=800" },
  ],
  en: [
    { id: "cream-script", label: "Wedding", sampleImage: "https://images.pexels.com/photos/18517621/pexels-photo-18517621.png?auto=compress&cs=tinysrgb&w=800" },
    { id: "gold-ornate-dark", label: "Bar/Bat Mitzvah", sampleImage: "/category/bar-bat-mitzvah.webp" },
    { id: "botanical-green", label: "Henna", sampleImage: "/category/henna.webp" },
    { id: "birthday-fun", label: "Birthday", sampleImage: "https://images.pexels.com/photos/8015132/pexels-photo-8015132.jpeg?auto=compress&cs=tinysrgb&w=800" },
    { id: "navy-bold", label: "Other", sampleImage: "https://images.pexels.com/photos/4722577/pexels-photo-4722577.jpeg?auto=compress&cs=tinysrgb&w=800" },
  ],
};

const FEATURES: Record<Locale, { icon: string; title: string; text: string }[]> = {
  he: [
    { icon: "ai", title: "מעצב AI אישי, לא גלריה", text: "מספרים לנו כמה מילים על האירוע - והמנוע שלנו יוצר לכם הזמנה מעוצבת ברמה מקצועית, כאילו הזמנתם מעצב/ת פרטי/ת." },
    { icon: "upload", title: "או תעלו תמונה משלכם", text: "עיצבתם הזמנה בעצמכם? העלו אותה כתמונה אחת והמערכת תדאג לכל השאר." },
    { icon: "rsvp", title: "אישורי הגעה חכמים", text: "האורחים מאשרים הגעה ישירות מתוך ההזמנה - שם, טלפון וכמות המגיעים, בלוח בקרה אחד ובזמן אמת." },
    { icon: "seating", title: "סידורי הושבה חזותיים", text: "בונים שולחנות בלחיצה, והמערכת מציגה כל שולחן כשרטוט עגול עם שמות האורחים סביבו - בדיוק כמו שישבו באירוע." },
    { icon: "qr", title: "קוד QR אחד לכל האולם", text: "מדפיסים קוד אחד ותולים בכניסה לאירוע - כל אורח סורק, מקליד את שמו, ומקבל מיד את מספר השולחן שלו." },
    { icon: "share", title: "שיתוף מיידי", text: "קישור אחד לשיתוף בוואטסאפ או SMS - נפתח יפה בנייד ובמחשב כאחד." },
  ],
  en: [
    { icon: "ai", title: "A personal AI designer, not a gallery", text: "Tell us a few words about your event, and our engine creates a professionally designed invitation for you - as if you'd hired a private designer." },
    { icon: "upload", title: "Or upload your own design", text: "Already designed your invitation? Upload it as a single image and the system takes care of the rest." },
    { icon: "rsvp", title: "Smart RSVPs", text: "Guests confirm attendance right from the invitation - name, phone and party size, in one real-time dashboard." },
    { icon: "seating", title: "Visual seating charts", text: "Build tables with a click, and the system shows each table as a round diagram with guest names around it - just like they'll sit at the event." },
    { icon: "qr", title: "One QR code for the whole hall", text: "Print one code and hang it at the entrance - every guest scans it, types their name, and instantly gets their table number." },
    { icon: "share", title: "Instant sharing", text: "One link to share on WhatsApp or SMS - opens beautifully on both mobile and desktop." },
  ],
};

const STEPS: Record<Locale, { n: string; title: string; text: string }[]> = {
  he: [
    { n: "1", title: "נרשמים", text: "יצירת חשבון תוך חצי דקה" },
    { n: "2", title: "בוחרים עיצוב", text: "מהגלריה או מעלים תמונה משלכם" },
    { n: "3", title: "משתפים", text: "קישור מוכן לשליחה לכל האורחים" },
    { n: "4", title: "מסדרים הושבה", text: "משבצים לשולחנות ומדפיסים קוד לכניסה" },
  ],
  en: [
    { n: "1", title: "Sign up", text: "Create an account in half a minute" },
    { n: "2", title: "Choose a design", text: "From the gallery or upload your own image" },
    { n: "3", title: "Share", text: "A link ready to send to all your guests" },
    { n: "4", title: "Arrange seating", text: "Assign tables and print a code for the entrance" },
  ],
};

const FOOTER_COLUMNS: Record<Locale, { title: string; links: { label: string; href: string }[] }[]> = {
  he: [
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
    {
      title: "משפטי",
      links: [
        { label: "הצהרת נגישות", href: "/accessibility" },
        { label: "מדיניות פרטיות", href: "/privacy" },
      ],
    },
  ],
  en: [
    {
      title: "Product",
      links: [
        { label: "Design gallery", href: "/create/templates" },
        { label: "Create an invitation", href: "/create/image" },
        { label: "Dashboard", href: "/dashboard" },
      ],
    },
    {
      title: "Event types",
      links: [
        { label: "Wedding invitations", href: "/create/templates" },
        { label: "Bar/Bat Mitzvah invitations", href: "/create/templates" },
        { label: "Henna invitations", href: "/create/templates" },
        { label: "Birthday invitations", href: "/create/templates" },
        { label: "Other event invitations", href: "/create/templates" },
      ],
    },
    {
      title: "Account",
      links: [
        { label: "Log in", href: "/login" },
        { label: "Sign up", href: "/signup" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Accessibility statement", href: "/accessibility" },
        { label: "Privacy policy", href: "/privacy" },
      ],
    },
  ],
};

const COPY: Record<
  Locale,
  {
    heroKicker: string;
    heroTitle: string;
    heroText: string;
    ctaDashboard: string;
    ctaStart: string;
    showcaseHeading: string;
    showcaseTagline: string;
    categoriesHeading: string;
    band1Heading: string;
    band1Bullets: string[];
    band2Heading: string;
    band2Bullets: string[];
    bandMore: string;
    featuresHeading: string;
    stepsHeading: string;
    finalCtaHeading: string;
    finalCtaLoggedIn: string;
    finalCtaLoggedOut: string;
    footerTagline: string;
    footerCopyright: string;
  }
> = {
  he: {
    heroKicker: "כולל סידורי הושבה חכמים",
    heroTitle: "הזמנות דיגיטליות מרשימות, תוך דקות",
    heroText:
      "בחרו עיצוב מוכן או העלו הזמנה משלכם, מלאו פרטים, ושתפו קישור אחד - עם אישורי הגעה, סידורי הושבה וקוד QR לאולם לכל האורחים שלכם.",
    ctaDashboard: "לוח הבקרה שלי",
    ctaStart: "התחילו בחינם",
    showcaseHeading: "דוגמאות של מעצב ה-AI שלנו!",
    showcaseTagline: "השמיים הם הגבול",
    categoriesHeading: "אז מה חוגגים?",
    band1Heading: "שליחה ואישורי הגעה בלחיצה אחת",
    band1Bullets: [
      "שליחת קישור להזמנה בוואטסאפ או SMS ישירות לאורחים שלכם",
      "האורחים מאשרים הגעה מתוך ההזמנה עצמה - בלי אפליקציה נוספת",
      "כל אורח מציין כמה אנשים מגיעים איתו, לא רק אישור בודד",
      "לוח בקרה אחד לכל ההזמנות והאישורים שלכם, בזמן אמת",
    ],
    band2Heading: "הושבה מסודרת, בלי בלגן ביום האירוע",
    band2Bullets: [
      "יוצרים שולחנות ומשבצים אליהם אורחים בכמה קליקים",
      "כל שולחן מוצג כשרטוט עגול עם שמות האורחים סביבו - בדיוק כמו שישבו באירוע",
      "קוד QR אחד להדפסה ותלייה בכניסה לאולם",
      "כל אורח סורק, מקליד את שמו, ומוצא את השולחן שלו לבד - בלי לעמוד עם רשימות ביד",
    ],
    bandMore: "לפרטים נוספים",
    featuresHeading: "הכל במקום אחד",
    stepsHeading: "איך זה עובד",
    finalCtaHeading: "מוכנים ליצור את ההזמנה שלכם?",
    finalCtaLoggedIn: "לוח הבקרה שלי",
    finalCtaLoggedOut: "הרשמה חינם",
    footerTagline: "האירוע מתחיל כאן",
    footerCopyright: "VIVA © 2026 - כל הזכויות שמורות",
  },
  en: {
    heroKicker: "Smart seating charts included",
    heroTitle: "Stunning digital invitations, in minutes",
    heroText:
      "Pick a ready-made design or upload your own, fill in the details, and share one link - with RSVPs, seating arrangements and a hall QR code for all your guests.",
    ctaDashboard: "My dashboard",
    ctaStart: "Start for free",
    showcaseHeading: "Examples from our AI designer!",
    showcaseTagline: "The sky's the limit",
    categoriesHeading: "So what are you celebrating?",
    band1Heading: "Sending and RSVPs in one click",
    band1Bullets: [
      "Send the invitation link on WhatsApp or SMS straight to your guests",
      "Guests RSVP right from the invitation itself - no extra app needed",
      "Each guest states how many people are coming with them, not just a single confirmation",
      "One dashboard for all your invitations and RSVPs, in real time",
    ],
    band2Heading: "Organized seating, no chaos on the big day",
    band2Bullets: [
      "Create tables and assign guests to them in a few clicks",
      "Each table is shown as a round diagram with guest names around it - just like they'll sit at the event",
      "One QR code to print and hang at the hall entrance",
      "Every guest scans it, types their name, and finds their table on their own - no standing around with lists",
    ],
    bandMore: "Learn more",
    featuresHeading: "Everything in one place",
    stepsHeading: "How it works",
    finalCtaHeading: "Ready to create your invitation?",
    finalCtaLoggedIn: "My dashboard",
    finalCtaLoggedOut: "Sign up for free",
    footerTagline: "Where the event begins",
    footerCopyright: "VIVA © 2026 - All rights reserved",
  },
};

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

export default async function LandingPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const locale = await getServerLocale();
  const t = COPY[locale];
  const categories = CATEGORIES[locale];
  const features = FEATURES[locale];
  const steps = STEPS[locale];
  const footerColumns = FOOTER_COLUMNS[locale];
  const showcaseExamples = SHOWCASE_EXAMPLES[locale];

  return (
    <div className="landing-page">
      <VivaIntro />
      <HeroSlider>
        <LanguageSwitcher className="hero-lang-switch landing-fade-in" />
        <header className="landing-nav hero-nav landing-fade-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logoViva-white.png" alt="VIVA" className="landing-logo-img" />
        </header>

        <section className="landing-hero hero-slide-hero">
          <div className="hero-kicker landing-fade-in">
            <FeatureIcon type="seating" />
            <span>{t.heroKicker}</span>
          </div>
          <h1 className="landing-fade-in landing-fade-in-delay-1">{t.heroTitle}</h1>
          <p className="landing-fade-in landing-fade-in-delay-2">{t.heroText}</p>
          <div className="landing-fade-in landing-fade-in-delay-3">
            <Link href={isLoggedIn ? "/dashboard" : "/login"} className="landing-hero-cta">
              {isLoggedIn ? t.ctaDashboard : t.ctaStart}
            </Link>
          </div>
        </section>
      </HeroSlider>

      <section className="landing-showcase">
        <RevealOnScroll className="landing-showcase-heading">
          <h2>{t.showcaseHeading}</h2>
          <p className="landing-showcase-tagline">{t.showcaseTagline}</p>
        </RevealOnScroll>
        <ShowcaseGallery examples={showcaseExamples} />
      </section>

      {/* "אז מה חוגגים?" - category tiles, each a full-bleed themed photo as the preview */}
      <section className="landing-categories">
        <RevealOnScroll>
          <h2>{t.categoriesHeading}</h2>
        </RevealOnScroll>
        <RevealOnScroll className="landing-categories-grid">
          {categories.map((c, i) => (
            <Link
              key={c.id}
              // Sends a logged-out visitor straight into account creation
              // instead of /create/image - picking a category here is a
              // browsing/marketing action, not yet "I have an account and
              // I'm building my invite", so the funnel is choose category ->
              // sign up -> then build (the "מה חוגגים?" popup in
              // create/image/page.tsx is still what asks post-signup).
              href="/signup"
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
            <h2>{t.band1Heading}</h2>
            <ul>
              {t.band1Bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="landing-outline-btn landing-outline-btn-light">
              {t.bandMore}
            </Link>
          </div>
          <div className="landing-band-mockup">
            <div className="mobile-frame landing-mockup-frame">
              <div className="mobile-screen">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/examples/bat-mitzvah-cream-mockup.webp"
                  alt={locale === "he" ? "הזמנה לבת מצווה בנייד" : "Bat mitzvah invitation on mobile"}
                  className="landing-mockup-img"
                />
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
            <h2>{t.band2Heading}</h2>
            <ul>
              {t.band2Bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="landing-outline-btn landing-outline-btn-light">
              {t.bandMore}
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
          <h2>{t.featuresHeading}</h2>
        </RevealOnScroll>
        <RevealOnScroll className="landing-features-grid">
          {features.map((f, i) => (
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
          <h2>{t.stepsHeading}</h2>
        </RevealOnScroll>
        <RevealOnScroll className="landing-steps-row">
          {steps.map((s, i) => (
            <div key={s.n} className="landing-step" style={{ transitionDelay: `${i * 120}ms` }}>
              <div className="landing-step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </RevealOnScroll>
      </section>

      <RevealOnScroll className="landing-final-cta">
        <h2>{t.finalCtaHeading}</h2>
        <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="landing-hero-cta">
          {isLoggedIn ? t.finalCtaLoggedIn : t.finalCtaLoggedOut}
        </Link>
      </RevealOnScroll>

      <footer className="landing-footer">
        <div className="landing-footer-top">
          <div className="landing-footer-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logoViva-white.png" alt="VIVA" className="landing-footer-logo-img" />
            <p>{t.footerTagline}</p>
          </div>
          {footerColumns.map((col) => (
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
          <span>{t.footerCopyright}</span>
        </div>
      </footer>
    </div>
  );
}
