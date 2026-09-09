"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LanguageProvider";

const SLOGAN = { he: "האירוע מתחיל כאן", en: "Where the event begins" };

/** Full-screen brand intro played once when the landing page loads - the real
 *  logo file wipes in top-to-bottom (V + spark first, wordmark a beat later,
 *  same staging as before but pixel-perfect to the actual artwork instead of
 *  a hand-built approximation), then the slogan reveals, before the whole
 *  thing fades out to show the real site (hero slider) underneath. */
export default function VivaIntro() {
  const [hide, setHide] = useState(false);
  const [removed, setRemoved] = useState(false);
  const { locale } = useLocale();

  useEffect(() => {
    const hideTimer = setTimeout(() => setHide(true), 3500);
    const removeTimer = setTimeout(() => setRemoved(true), 4300);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (removed) return null;

  return (
    <div className={`viva-intro${hide ? " hide" : ""}`}>
      <div className="viva-intro-glow-pink" />
      <div className="viva-intro-glow-turquoise" />
      <div className="viva-intro-inner">
        <div className="viva-intro-logo-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logoViva.png" alt="VIVA" className="viva-intro-logo-img" />
          <div className="viva-intro-spark-glow" />
        </div>
        <div className="viva-intro-slogan">{SLOGAN[locale]}</div>
      </div>
    </div>
  );
}
