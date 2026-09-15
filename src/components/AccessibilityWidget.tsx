"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/LanguageProvider";

type FlagKey = "contrast" | "grayscale" | "underlineLinks" | "readableFont" | "stopAnimations";

type A11yPrefs = {
  fontStep: number;
  contrast: boolean;
  grayscale: boolean;
  underlineLinks: boolean;
  readableFont: boolean;
  stopAnimations: boolean;
};

const DEFAULT_PREFS: A11yPrefs = {
  fontStep: 0,
  contrast: false,
  grayscale: false,
  underlineLinks: false,
  readableFont: false,
  stopAnimations: false,
};

// Percent applied to the <html> root font-size per step. Every font-size in
// this codebase is set in rem (spacing/sizing is px), so scaling the root
// only enlarges text, not layout - checked before picking this approach.
const FONT_SCALE = [100, 112, 124, 136];
const MAX_FONT_STEP = FONT_SCALE.length - 1;

const STORAGE_KEY = "viva_a11y_prefs";

const COPY = {
  he: {
    openLabel: "פתיחת תפריט נגישות",
    closeLabel: "סגירת תפריט נגישות",
    title: "נגישות",
    decreaseFont: "הקטנת טקסט",
    increaseFont: "הגדלת טקסט",
    contrast: "ניגודיות גבוהה",
    grayscale: "גווני אפור",
    underlineLinks: "הדגשת קישורים",
    readableFont: "פונט קריא",
    stopAnimations: "עצירת אנימציות",
    reset: "איפוס הגדרות נגישות",
    statementLink: "הצהרת נגישות מלאה",
  },
  en: {
    openLabel: "Open accessibility menu",
    closeLabel: "Close accessibility menu",
    title: "Accessibility",
    decreaseFont: "Decrease text size",
    increaseFont: "Increase text size",
    contrast: "High contrast",
    grayscale: "Grayscale",
    underlineLinks: "Underline links",
    readableFont: "Readable font",
    stopAnimations: "Stop animations",
    reset: "Reset accessibility settings",
    statementLink: "Full accessibility statement",
  },
};

/** Site-wide accessibility toolbar: a fixed floating button (rendered once
 *  in the root layout, so it's on every page - dashboard, invitations,
 *  login, everywhere) that opens a panel of real display adjustments, not
 *  just a link to the /accessibility statement page. Choices persist in
 *  localStorage and are applied as classes/inline font-size on <html> so
 *  they survive navigation without a page reload. */
export default function AccessibilityWidget() {
  const { locale } = useLocale();
  const t = COPY[locale];
  const [open, setOpen] = useState(false);
  // Lazy-init reads localStorage during the first client render rather than
  // an effect after mount - safe here because prefs don't affect this
  // component's own JSX (only classes/font-size applied to <html> below),
  // so there's nothing for a server/client render to mismatch on.
  const [prefs, setPrefs] = useState<A11yPrefs>(() => {
    if (typeof window === "undefined") return DEFAULT_PREFS;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    } catch {
      // Falls back to defaults (private browsing, storage disabled, ...).
    }
    return DEFAULT_PREFS;
  });
  const rootRef = useRef<HTMLDivElement>(null);

  // Apply prefs to the document and persist them whenever they change.
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${FONT_SCALE[prefs.fontStep]}%`;
    root.classList.toggle("a11y-contrast", prefs.contrast);
    root.classList.toggle("a11y-grayscale", prefs.grayscale);
    root.classList.toggle("a11y-underline-links", prefs.underlineLinks);
    root.classList.toggle("a11y-readable-font", prefs.readableFont);
    root.classList.toggle("a11y-stop-animations", prefs.stopAnimations);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Best-effort only.
    }
  }, [prefs]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggleFlag(key: FlagKey) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  const FLAGS: { key: FlagKey; label: string }[] = [
    { key: "contrast", label: t.contrast },
    { key: "grayscale", label: t.grayscale },
    { key: "underlineLinks", label: t.underlineLinks },
    { key: "readableFont", label: t.readableFont },
    { key: "stopAnimations", label: t.stopAnimations },
  ];

  return (
    <div className="a11y-widget" ref={rootRef}>
      <button
        type="button"
        className="a11y-trigger"
        aria-label={open ? t.closeLabel : t.openLabel}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="12" cy="7.3" r="1.7" fill="currentColor" />
          <path
            fill="currentColor"
            d="M6.3 9.4a.9.9 0 0 1 1-.8c1.6.3 3.1.5 4.7.5s3.1-.2 4.7-.5a.9.9 0 1 1 .3 1.8c-1.2.2-2.4.4-3.6.5l1 8a.9.9 0 0 1-1.8.2l-.7-5.6h-.9l-.7 5.6a.9.9 0 0 1-1.8-.2l1-8c-1.2-.1-2.4-.3-3.6-.5a.9.9 0 0 1-.6-1z"
          />
        </svg>
      </button>

      {open && (
        <div className="a11y-panel" role="dialog" aria-label={t.title}>
          <div className="a11y-panel-title">{t.title}</div>

          <div className="a11y-font-row">
            <button
              type="button"
              className="a11y-font-btn"
              aria-label={t.decreaseFont}
              disabled={prefs.fontStep === 0}
              onClick={() => setPrefs((p) => ({ ...p, fontStep: Math.max(0, p.fontStep - 1) }))}
            >
              A-
            </button>
            <span className="a11y-font-pct">{FONT_SCALE[prefs.fontStep]}%</span>
            <button
              type="button"
              className="a11y-font-btn"
              aria-label={t.increaseFont}
              disabled={prefs.fontStep === MAX_FONT_STEP}
              onClick={() => setPrefs((p) => ({ ...p, fontStep: Math.min(MAX_FONT_STEP, p.fontStep + 1) }))}
            >
              A+
            </button>
          </div>

          <div className="a11y-flags">
            {FLAGS.map((f) => (
              <button
                key={f.key}
                type="button"
                className="a11y-flag-btn"
                aria-pressed={prefs[f.key]}
                onClick={() => toggleFlag(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button type="button" className="a11y-reset-btn" onClick={() => setPrefs(DEFAULT_PREFS)}>
            {t.reset}
          </button>
          <a href="/accessibility" className="a11y-statement-link">
            {t.statementLink}
          </a>
        </div>
      )}
    </div>
  );
}
