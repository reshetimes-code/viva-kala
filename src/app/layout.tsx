import type { Metadata } from "next";
import "./globals.css";
import "sweetalert2/dist/sweetalert2.min.css";

export const metadata: Metadata = {
  // Without this, Next.js resolves the file-convention og:image/twitter:image
  // below into an ABSOLUTE url using "http://localhost:3000" as a fallback
  // base - meaning every real share in production would point WhatsApp/
  // Facebook/etc at an unreachable localhost link instead of the real site.
  metadataBase: new URL("https://vivaa.co.il"),
  title: "VIVA | האירוע מתחיל כאן",
  description: "יצירת הזמנות דיגיטליות מעוצבות לאירועים",
  // The actual og:image/twitter:image tags come from the sibling
  // opengraph-image.png/twitter-image.png files (Next.js' file-convention
  // metadata - picked up automatically for every route under this layout,
  // invite pages included) - this openGraph block just fills in title/
  // description/locale explicitly so WhatsApp and friends don't have to
  // guess from the plain <title>/<meta description> tags.
  openGraph: {
    title: "VIVA | האירוע מתחיל כאן",
    description: "יצירת הזמנות דיגיטליות מעוצבות לאירועים",
    siteName: "VIVA",
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VIVA | האירוע מתחיל כאן",
    description: "יצירת הזמנות דיגיטליות מעוצבות לאירועים",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
