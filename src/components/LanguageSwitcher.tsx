"use client";

import { useLocale } from "@/lib/i18n/LanguageProvider";

/** Hebrew/English toggle. Placed on the home page header (per product
 *  decision - not repeated on every page) - the choice it makes is global,
 *  stored in a cookie, and takes effect across the whole system on the next
 *  render of every page, not just the landing page. */
export default function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div className={`lang-switch ${className ?? ""}`} role="group" aria-label="Language / שפה">
      <button
        type="button"
        className={`lang-switch-btn ${locale === "he" ? "is-active" : ""}`}
        onClick={() => setLocale("he")}
        aria-pressed={locale === "he"}
        lang="he"
      >
        עברית
      </button>
      <span className="lang-switch-sep" aria-hidden="true">|</span>
      <button
        type="button"
        className={`lang-switch-btn ${locale === "en" ? "is-active" : ""}`}
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        lang="en"
      >
        English
      </button>
    </div>
  );
}
