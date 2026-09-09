import Link from "next/link";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server";

const COPY = {
  he: {
    metaTitle: "מדיניות פרטיות | VIVA",
    metaDescription: "מדיניות הפרטיות של שירות ההזמנות הדיגיטליות VIVA",
    backLink: "← חזרה לדף הבית",
    heading: "מדיניות פרטיות",
    updated: "עודכן לאחרונה: 06.09.2026",
    intro: (
      <>
        VIVA (&quot;השירות&quot;, &quot;אנחנו&quot;) מפעילה שירות ליצירת הזמנות דיגיטליות לאירועים. מדיניות
        זו מסבירה איזה מידע אנו אוספים, לשם מה, ועם מי הוא עשוי להיות משותף.
      </>
    ),
    collectHeading: "איזה מידע אנו אוספים",
    collectOwners: (
      <>
        <strong>בעלי אירוע (יוצרי ההזמנה):</strong> שם משתמש וסיסמה (מאוחסנת בצורה מוצפנת/מגובבת,
        לא כטקסט גלוי) ליצירת חשבון וכניסה אליו.
      </>
    ),
    collectContent: (
      <>
        <strong>תוכן ההזמנה:</strong> פרטי האירוע שבעל האירוע מזין - שמות, תאריך, שעה, כתובת
        והערות - וכן תמונות שמועלות על ידו או נוצרות באמצעות בינה מלאכותית לצורך עיצוב ההזמנה.
      </>
    ),
    collectRsvp: (
      <>
        <strong>אישורי הגעה (אורחים):</strong> כאשר אורח ממלא טופס &quot;אישור הגעה&quot; בהזמנה, נאסף
        שם פרטי, שם משפחה, מספר טלפון ומספר המגיעים. אם האורח בוחר להשאיר פרטים לגבי אירוע
        עתידי שלו (בפופ-אפ ההטבה שמוצג לאחר אישור הגעה), נאסף גם תאריך/סוג/מקום האירוע שציין.
      </>
    ),
    collectTechnical: (
      <>
        <strong>נתונים טכניים:</strong> נתוני שימוש בסיסיים הנדרשים להפעלת השירות (למשל אימות
        כניסה לחשבון).
      </>
    ),
    useHeading: "לשם מה אנו משתמשים במידע",
    useOperate: "הפעלת השירות עצמו - יצירת הזמנות, ניהולן, והצגתן לאורחים.",
    useRsvp: "ניהול אישורי הגעה עבור בעל האירוע (מי מגיע, כמה אורחים, שיבוץ לשולחנות).",
    useAi: "יצירת תמונות עיצוב באמצעות בינה מלאכותית, לפי הפרטים שסיפק בעל האירוע.",
    useContact: "יצירת קשר עם אורח שהביע עניין בקבלת הטבה/פנייה לגבי אירוע עתידי שלו, אם וכאשר ביקש זאת.",
    shareHeading: "עם מי המידע משותף",
    shareBody: (
      <>
        המידע מאוחסן בשירותי הענן של Google Cloud (אחסון קבצים ומסד נתונים). תמונות המועלות
        לצורך עיצוב ההזמנה עשויות להישלח לשירותי הבינה המלאכותית של Google (Gemini) לצורך יצירת
        התמונה או ניתוחה. אנו לא מוכרים מידע אישי לצדדים שלישיים.
      </>
    ),
    retentionHeading: "שמירת מידע ומחיקה",
    retentionBody: (
      <>
        מידע על אירוע (כולל אישורי הגעה שנקשרו אליו) נשמר לצורך תפעול השירות, ומוסר בהתאם למדיניות
        השמירה הפנימית שלנו לאחר חלוף זמן סביר ממועד האירוע. מי שמעוניין בהסרת המידע האישי שלו
        לפני כן מוזמן לפנות אלינו בפרטים שלהלן.
      </>
    ),
    contactHeading: "יצירת קשר בנושא פרטיות",
    contactEmail: 'דוא"ל:',
    contactEmailTodo: "[להשלמה: כתובת מייל ליצירת קשר בנושא פרטיות]",
    contactPhone: "טלפון:",
    contactPhoneTodo: "[להשלמה: מספר טלפון]",
    fineprint: "מדיניות זו עשויה להתעדכן מעת לעת בהתאם לשינויים בשירות או בדרישות הדין.",
  },
  en: {
    metaTitle: "Privacy Policy | VIVA",
    metaDescription: "The privacy policy of VIVA's digital invitation service",
    backLink: "← Back to home",
    heading: "Privacy Policy",
    updated: "Last updated: 06.09.2026",
    intro: (
      <>
        VIVA (&quot;the Service&quot;, &quot;we&quot;) operates a service for creating digital
        event invitations. This policy explains what information we collect, for what purpose,
        and with whom it may be shared.
      </>
    ),
    collectHeading: "What information we collect",
    collectOwners: (
      <>
        <strong>Event owners (invitation creators):</strong> a username and password (stored
        encrypted/hashed, never as plain text) to create and log in to an account.
      </>
    ),
    collectContent: (
      <>
        <strong>Invitation content:</strong> the event details entered by the event owner - names,
        date, time, address, and notes - as well as images uploaded by them or generated using AI
        for the invitation design.
      </>
    ),
    collectRsvp: (
      <>
        <strong>RSVPs (guests):</strong> when a guest fills out an &quot;RSVP&quot; form on an
        invitation, we collect their first name, last name, phone number, and number of
        attendees. If the guest chooses to leave details about their own upcoming event (in the
        perk pop-up shown after RSVPing), we also collect the date/type/venue of that event as
        they entered it.
      </>
    ),
    collectTechnical: (
      <>
        <strong>Technical data:</strong> basic usage data required to operate the service (for
        example, account login verification).
      </>
    ),
    useHeading: "What we use the information for",
    useOperate: "Operating the service itself - creating invitations, managing them, and displaying them to guests.",
    useRsvp: "Managing RSVPs for the event owner (who's attending, how many guests, seating assignments).",
    useAi: "Generating design images using AI, based on the details provided by the event owner.",
    useContact: "Contacting a guest who expressed interest in a perk or offer regarding their own upcoming event, if and when they requested it.",
    shareHeading: "Who the information is shared with",
    shareBody: (
      <>
        The information is stored on Google Cloud services (file storage and database). Images
        uploaded for invitation design purposes may be sent to Google&apos;s AI services (Gemini)
        for image generation or analysis. We do not sell personal information to third parties.
      </>
    ),
    retentionHeading: "Data retention and deletion",
    retentionBody: (
      <>
        Event information (including RSVPs linked to it) is retained to operate the service, and
        is removed in accordance with our internal retention policy after a reasonable period
        following the event date. Anyone who would like their personal information removed sooner
        is welcome to contact us using the details below.
      </>
    ),
    contactHeading: "Privacy contact",
    contactEmail: "Email:",
    contactEmailTodo: "[to be completed: privacy contact email address]",
    contactPhone: "Phone:",
    contactPhoneTodo: "[to be completed: phone number]",
    fineprint: "This policy may be updated from time to time in accordance with changes to the service or legal requirements.",
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

export default async function PrivacyPage() {
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

        <h2>{t.collectHeading}</h2>
        <ul>
          <li>{t.collectOwners}</li>
          <li>{t.collectContent}</li>
          <li>{t.collectRsvp}</li>
          <li>{t.collectTechnical}</li>
        </ul>

        <h2>{t.useHeading}</h2>
        <ul>
          <li>{t.useOperate}</li>
          <li>{t.useRsvp}</li>
          <li>{t.useAi}</li>
          <li>{t.useContact}</li>
        </ul>

        <h2>{t.shareHeading}</h2>
        <p>{t.shareBody}</p>

        <h2>{t.retentionHeading}</h2>
        <p>{t.retentionBody}</p>

        <h2>{t.contactHeading}</h2>
        <ul className="legal-contact-list">
          <li>
            <strong>{t.contactEmail}</strong> <span className="legal-todo">{t.contactEmailTodo}</span>
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
