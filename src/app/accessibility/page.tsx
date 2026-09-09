import Link from "next/link";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server";

const COPY = {
  he: {
    metaTitle: "הצהרת נגישות | VIVA",
    metaDescription: "הצהרת נגישות לאתר ולשירות ההזמנות הדיגיטליות של VIVA",
    backLink: "← חזרה לדף הבית",
    heading: "הצהרת נגישות",
    updated: "עודכן לאחרונה: 06.09.2026",
    intro: (
      <>
        אנו ב-VIVA רואים חשיבות רבה במתן שירות שוויוני ונגיש לכלל הציבור, לרבות אנשים עם
        מוגבלות, ופועלים להנגשת האתר והשירות בהתאם לתקן הישראלי (ת&quot;י) 5568 להנגשת תכנים
        באינטרנט, המבוסס על הנחיות WCAG 2.0 ברמת AA, ובהתאם לתקנות שוויון זכויות לאנשים עם
        מוגבלות (התאמות נגישות לשירות), התשע&quot;ג-2013.
      </>
    ),
    statusHeading: "מצב הנגישות הנוכחי",
    statusBody: (
      <>
        האתר בנוי בטכנולוגיות עדכניות (HTML סמנטי, תמיכה מלאה בעברית וכיווניות RTL, טפסים עם
        תוויות ברורות לכל שדה) ואנו נמצאים בתהליך מתמשך של סקירה ושיפור הנגישות בכל חלקי
        השירות - הן באתר השיווקי והן במסכי ההזמנה, האישור הגעה ולוח הבקרה לבעלי אירועים.
        ייתכן שבשלב זה לא כל מרכיבי האתר עומדים באופן מלא בכל דרישות התקן, ואנו ממשיכים
        לעבוד על כך.
      </>
    ),
    issueHeading: "נתקלתם בבעיית נגישות?",
    issueBody: (
      <>
        נשמח לדעת על כל בעיה בנושא נגישות באתר או בקבלת שירות, ונפעל לתקנה בהקדם האפשרי.
        ניתן לפנות אלינו בכל אחד מהאמצעים הבאים:
      </>
    ),
    contactCoordinator: "רכז/ת נגישות:",
    contactCoordinatorTodo: "[להשלמה: שם רכז/ת הנגישות]",
    contactEmail: 'דוא"ל:',
    contactEmailTodo: "[להשלמה: כתובת מייל ליצירת קשר בנושא נגישות]",
    contactPhone: "טלפון:",
    contactPhoneTodo: "[להשלמה: מספר טלפון]",
    fineprint: (
      <>
        הצהרה זו נכתבה בהתאם לחובה החוקית ותעודכן מעת לעת ככל שיחולו שינויים באתר או
        בהתאמות הנגישות שבוצעו בו.
      </>
    ),
  },
  en: {
    metaTitle: "Accessibility Statement | VIVA",
    metaDescription: "Accessibility statement for the VIVA website and digital invitation service",
    backLink: "← Back to home",
    heading: "Accessibility Statement",
    updated: "Last updated: 06.09.2026",
    intro: (
      <>
        At VIVA, we place great importance on providing an equal and accessible service to the
        entire public, including people with disabilities. We work to make our website and
        service accessible in accordance with Israeli Standard (IS) 5568 for web content
        accessibility, based on the WCAG 2.0 Level AA guidelines, and in accordance with the
        Equal Rights for Persons with Disabilities Regulations (Service Accessibility
        Adjustments), 5773-2013.
      </>
    ),
    statusHeading: "Current accessibility status",
    statusBody: (
      <>
        The site is built with modern technologies (semantic HTML, full Hebrew and RTL support,
        forms with clear labels for every field), and we are continuously reviewing and improving
        accessibility across every part of the service - both the marketing site and the
        invitation, RSVP, and event-owner dashboard screens. Some parts of the site may not yet
        fully meet every requirement of the standard, and we continue working on this.
      </>
    ),
    issueHeading: "Encountered an accessibility issue?",
    issueBody: (
      <>
        We&apos;d love to hear about any accessibility issue on the site or with the service, and
        we&apos;ll work to fix it as soon as possible. You can reach us through any of the
        following:
      </>
    ),
    contactCoordinator: "Accessibility coordinator:",
    contactCoordinatorTodo: "[to be completed: accessibility coordinator's name]",
    contactEmail: "Email:",
    contactEmailTodo: "[to be completed: accessibility contact email address]",
    contactPhone: "Phone:",
    contactPhoneTodo: "[to be completed: phone number]",
    fineprint: (
      <>
        This statement was written in accordance with legal requirements and will be updated from
        time to time as changes are made to the site or its accessibility accommodations.
      </>
    ),
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = COPY[locale];
  return {
    title: t.metaTitle,
    description: t.metaDescription,
  };
}

export default async function AccessibilityPage() {
  const locale = await getServerLocale();
  const t = COPY[locale];

  return (
    <div className="legal-page">
      <div className="legal-card">
        <Link href="/" className="legal-back-link">
          {t.backLink}
        </Link>
        <h1>{t.heading}</h1>
        <p className="legal-updated">{t.updated}</p>

        <p>{t.intro}</p>

        <h2>{t.statusHeading}</h2>
        <p>{t.statusBody}</p>

        <h2>{t.issueHeading}</h2>
        <p>{t.issueBody}</p>
        <ul className="legal-contact-list">
          <li>
            <strong>{t.contactCoordinator}</strong>{" "}
            <span className="legal-todo">{t.contactCoordinatorTodo}</span>
          </li>
          <li>
            <strong>{t.contactEmail}</strong>{" "}
            <span className="legal-todo">{t.contactEmailTodo}</span>
          </li>
          <li>
            <strong>{t.contactPhone}</strong> <span className="legal-todo">{t.contactPhoneTodo}</span>
          </li>
        </ul>

        <p className="legal-fineprint">{t.fineprint}</p>
      </div>
    </div>
  );
}
