/** Shared locale primitives - safe to import from both server and client
 *  code (no "use client"/"use server" boundary, no next/headers). Every
 *  other i18n module (server.ts, LanguageProvider.tsx) builds on this. */

export type Locale = "he" | "en";

/** Name of the cookie that carries the user's chosen UI language. Read on
 *  the server (RootLayout, getServerLocale()) to decide <html lang/dir> and
 *  which dictionary entry to render, and written on the client by the
 *  language switcher. Kept short/prefixed to avoid clashing with anything
 *  else the app or a browser extension might set. */
export const LOCALE_COOKIE = "kala_locale";

/** VIVA is a Hebrew-first product for Hebrew-speaking event hosts - default
 *  to Hebrew for anyone who hasn't explicitly switched to English. */
export const DEFAULT_LOCALE: Locale = "he";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "he" || value === "en";
}

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return locale === "he" ? "rtl" : "ltr";
}
