import type { Metadata } from "next";
import "./globals.css";
import "sweetalert2/dist/sweetalert2.min.css";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { getServerLocale } from "@/lib/i18n/server";
import { dirFor } from "@/lib/i18n/locale";

export const TITLE = { he: "VIVA | האירוע מתחיל כאן", en: "VIVA | Where the event begins" };
const DESCRIPTION = {
  he: "סידורי הושבה - הזמנות דיגיטלית - אישורי הגעה",
  en: "Seating arrangements - Digital invitations - RSVP confirmations",
};
const OG_ALT = { he: "VIVA - האירוע מתחיל כאן", en: "VIVA - Where the event begins" };

// Next.js metadata merging is SHALLOW per key: a route segment that defines
// its own `openGraph`/`twitter` object fully REPLACES the parent's, it does
// not merge field-by-field (see the "Overwriting fields" note in Next's
// generate-metadata docs). That includes the image - even though
// opengraph-image.png/twitter-image.png below are the file-convention
// images "for every route under this layout", that auto-attachment is lost
// the moment a child segment sets its own `openGraph`/`twitter` at all.
// So any route that needs to override even one field (e.g. the invite share
// page dropping og:description - see src/app/i/[id]/page.tsx) has to
// reconstruct the whole object, which is exactly what these two helpers are
// for: spread the base and override only what differs, instead of every
// such route silently losing the image.
export function siteOpenGraph(locale: "he" | "en"): NonNullable<Metadata["openGraph"]> {
  return {
    title: TITLE[locale],
    description: DESCRIPTION[locale],
    siteName: "VIVA",
    locale: locale === "he" ? "he_IL" : "en_US",
    type: "website",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: OG_ALT[locale] }],
  };
}
export function siteTwitter(locale: "he" | "en"): NonNullable<Metadata["twitter"]> {
  return {
    card: "summary_large_image",
    title: TITLE[locale],
    description: DESCRIPTION[locale],
    images: [{ url: "/twitter-image.png", width: 1200, height: 630, alt: OG_ALT[locale] }],
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    // Without this, Next.js resolves the file-convention og:image/twitter:image
    // below into an ABSOLUTE url using "http://localhost:3000" as a fallback
    // base - meaning every real share in production would point WhatsApp/
    // Facebook/etc at an unreachable localhost link instead of the real site.
    metadataBase: new URL("https://vivaa.co.il"),
    title: TITLE[locale],
    description: DESCRIPTION[locale],
    openGraph: siteOpenGraph(locale),
    twitter: siteTwitter(locale),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getServerLocale();
  return (
    <html lang={locale} dir={dirFor(locale)} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
