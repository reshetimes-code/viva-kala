"use client";

import { useEffect, useState } from "react";
import RevealOnScroll from "@/components/RevealOnScroll";
import { useLocale } from "@/lib/i18n/LanguageProvider";

interface Example {
  src: string;
  alt: string;
}

const LABELS = {
  he: { close: "סגירה", prev: "הדוגמה הקודמת", next: "הדוגמה הבאה" },
  en: { close: "Close", prev: "Previous example", next: "Next example" },
};

/** The homepage's "real output" showcase grid - each example is now
 *  tappable, opening a full-screen gallery (prev/next through the same
 *  list) instead of just sitting there as a flat, non-interactive image. */
export default function ShowcaseGallery({ examples }: { examples: Example[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { locale } = useLocale();
  const labels = LABELS[locale];

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? null : (i + 1) % examples.length));
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i === null ? null : (i - 1 + examples.length) % examples.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, examples.length]);

  return (
    <>
      <RevealOnScroll className="landing-showcase-grid">
        {examples.map((ex, i) => (
          <button
            key={ex.src}
            type="button"
            className="landing-showcase-item"
            style={{ transitionDelay: `${i * 90}ms` }}
            onClick={() => setOpenIndex(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ex.src} alt={ex.alt} className="landing-showcase-img" loading="lazy" />
          </button>
        ))}
      </RevealOnScroll>

      {openIndex !== null && (
        <div className="showcase-lightbox-overlay" onClick={() => setOpenIndex(null)}>
          <button type="button" className="showcase-lightbox-close" onClick={() => setOpenIndex(null)} aria-label={labels.close}>
            ×
          </button>
          <button
            type="button"
            className="showcase-lightbox-nav showcase-lightbox-prev"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex((i) => (i === null ? null : (i - 1 + examples.length) % examples.length));
            }}
            aria-label={labels.prev}
          >
            ‹
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={examples[openIndex].src}
            alt={examples[openIndex].alt}
            className="showcase-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="showcase-lightbox-nav showcase-lightbox-next"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex((i) => (i === null ? null : (i + 1) % examples.length));
            }}
            aria-label={labels.next}
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}
