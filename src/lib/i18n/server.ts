/** Server-side locale lookup for Server Components, Route Handlers and
 *  Server Actions - anywhere `next/headers` cookies() is available. Mirrors
 *  the client-side useLocale() hook in LanguageProvider.tsx, both keyed off
 *  the same LOCALE_COOKIE so a page rendered on the server and hydrated on
 *  the client never disagree about which language is active. */

import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./locale";

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
