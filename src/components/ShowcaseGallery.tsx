"use client";

import { useEffect, useState } from "react";
import RevealOnScroll from "@/components/RevealOnScroll";

interface Example {
  src: string;
  alt: string;
}

/** The homepage's "real output" showcase grid - each example is now
 *  tappable, opening a full-screen gallery (prev/next through the same
 *  list) instead of just sitting there as a flat, non-interactive image. */
export default function ShowcaseGallery({ examples }: { examples: Example[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
          <button type="button" className="showcase-lightbox-close" onClick={() => setOpenIndex(null)} aria-label="סגירה">
            ×
          </button>
          <button
            type="button"
            className="showcase-lightbox-nav showcase-lightbox-prev"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex((i) => (i === null ? null : (i - 1 + examples.length) % examples.length));
            }}
            aria-label="הדוגמה הקודמת"
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
            aria-label="הדוגמה הבאה"
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}
