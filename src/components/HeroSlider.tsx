"use client";

import { useEffect, useState } from "react";

// TEMPORARY placeholders (animated gradients) until real video clips are
// dropped in. Swap a slide to { type: "video", src: "/videos/xxx.mp4" }
// and it renders as a real looping background video - no other code changes.
type Slide = { type: "video"; src: string } | { type: "gradient"; className: string };

const SLIDES: Slide[] = [
  { type: "video", src: "/videos/hero-1.mp4" },
  { type: "video", src: "/videos/hero-2.mp4" },
];

const INTERVAL_MS = 6000;

export default function HeroSlider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(0);

  // Only auto-rotate once there's more than one real video to rotate
  // between - with a single real clip (the rest still gradient
  // placeholders) it should just loop in place instead of cutting away to
  // a placeholder every few seconds.
  const realVideoCount = SLIDES.filter((s) => s.type === "video").length;

  useEffect(() => {
    if (realVideoCount < 2) return;
    const id = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [realVideoCount]);

  return (
    <div className="hero-slider">
      {SLIDES.map((slide, i) => (
        <div key={i} className={`hero-slide${i === active ? " is-active" : ""}`}>
          {slide.type === "video" ? (
            <video className="hero-slide-video" src={slide.src} autoPlay muted loop playsInline />
          ) : (
            <div className={`hero-slide-gradient ${slide.className}`} />
          )}
        </div>
      ))}
      <div className="hero-slide-overlay" />

      <div className="hero-slide-content">{children}</div>

      <div className="hero-slide-dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`hero-slide-dot${i === active ? " is-active" : ""}`}
            aria-label={`שקופית ${i + 1}`}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </div>
  );
}
