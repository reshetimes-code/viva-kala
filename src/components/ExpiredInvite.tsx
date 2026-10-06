import Link from "next/link";
import type { Locale } from "@/lib/i18n/locale";

const COPY = {
  he: {
    eyebrow: "ההזמנה הזו לא זמינה",
    title: "האירוע הזה כבר עבר או הסתיים",
    question: "רוצים הזמנה חדשה?",
    body: "נבנה לכם הזמנה דיגיטלית מרשימה תוך דקות - עם ניהול אורחים, שיבוץ שולחנות וקוד QR לאולם.",
    primary: "✨ הרשמה והזמנה חדשה",
    secondary: "🌐 לעבור לאתר VIVA",
    tagline: "VIVA - האירוע מתחיל כאן",
  },
  en: {
    eyebrow: "This invitation is no longer available",
    title: "This event has already passed or ended",
    question: "Want a new invitation?",
    body: "We'll build you a stunning digital invitation in minutes - with guest management, table seating and a venue QR code.",
    primary: "✨ Sign up & create a new invite",
    secondary: "🌐 Visit VIVA",
    tagline: "VIVA - the event starts here",
  },
};

const SPARKLES = [
  { top: "8%", left: "10%", delay: "0s", size: 18 },
  { top: "18%", left: "82%", delay: "1.2s", size: 14 },
  { top: "62%", left: "6%", delay: "2.1s", size: 12 },
  { top: "74%", left: "88%", delay: "0.6s", size: 16 },
  { top: "40%", left: "92%", delay: "1.8s", size: 10 },
];

export default function ExpiredInvite({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  return (
    <main className="expired-page" dir={locale === "he" ? "rtl" : "ltr"}>
      <div className="expired-orb expired-orb-a" aria-hidden="true" />
      <div className="expired-orb expired-orb-b" aria-hidden="true" />
      <div className="expired-ring expired-ring-outer" aria-hidden="true" />
      <div className="expired-ring expired-ring-inner" aria-hidden="true" />
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="expired-sparkle"
          aria-hidden="true"
          style={{ top: s.top, left: s.left, animationDelay: s.delay, fontSize: s.size }}
        >
          ✦
        </span>
      ))}

      <section className="expired-card">
        <p className="expired-eyebrow">{t.eyebrow}</p>
        <h1 className="expired-title">{t.title}</h1>
        <p className="expired-question">{t.question}</p>
        <p className="expired-body">{t.body}</p>

        <div className="expired-actions">
          <Link href="/signup" className="expired-cta expired-cta-primary">
            {t.primary}
          </Link>
          <Link href="/" className="expired-cta expired-cta-secondary">
            {t.secondary}
          </Link>
        </div>

        <p className="expired-tagline">{t.tagline}</p>
      </section>
    </main>
  );
}
