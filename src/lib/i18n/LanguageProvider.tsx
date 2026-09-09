"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE, dirFor, LOCALE_COOKIE, type Locale } from "./locale";

type LanguageContextValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Wraps the whole app (mounted once in RootLayout, around {children}) so
 *  any client component can read/change the UI language with useLocale().
 *  Server Components can't reach this context - they call getServerLocale()
 *  from ./server.ts instead, reading the same LOCALE_COOKIE. */
export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      setLocaleState(next);
      try {
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
        window.localStorage.setItem(LOCALE_COOKIE, next);
      } catch {
        // Storage can throw in private-browsing/locked-down contexts - the
        // cookie write above already drives SSR for the next navigation, so
        // this is a best-effort convenience only, not required to function.
      }
      document.documentElement.lang = next;
      document.documentElement.dir = dirFor(next);
      // Re-runs Server Components (dashboard, admin, invite view, ...) with
      // the new cookie so their server-picked dictionary text updates too,
      // without a full page reload.
      router.refresh();
    },
    [locale, router]
  );

  // Keeps <html lang/dir> correct even if this provider re-mounts with a
  // different initialLocale (e.g. after router.refresh() picks up a locale
  // someone changed in another tab).
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirFor(locale);
  }, [locale]);

  const value = useMemo(() => ({ locale, dir: dirFor(locale), setLocale }), [locale, setLocale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLocale(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback for a component rendered without the provider mounted above
    // it (shouldn't happen once RootLayout wraps the app) - defaulting keeps
    // it functional instead of throwing.
    return { locale: DEFAULT_LOCALE, dir: dirFor(DEFAULT_LOCALE), setLocale: () => {} };
  }
  return ctx;
}
