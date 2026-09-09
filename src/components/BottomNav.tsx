"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/LanguageProvider";

const LABELS = {
  he: { home: "ראשי", guests: "אורחים", edit: "עריכה", invite: "ההזמנה" },
  en: { home: "Home", guests: "Guests", edit: "Edit", invite: "Invitation" },
};

/** Fixed bottom action bar for the logged-in area, so the most important
 *  actions for the one invite an account owns are always one tap away -
 *  instead of scrolling back up to a card full of buttons. */
export default function BottomNav({ inviteId }: { inviteId: string }) {
  const { locale } = useLocale();
  const t = LABELS[locale];

  return (
    <nav className="bottom-nav">
      <Link href="/dashboard" className="bottom-nav-item">
        <span className="bottom-nav-icon">🏠</span>
        <span>{t.home}</span>
      </Link>
      <Link href={`/dashboard/${inviteId}/guests`} className="bottom-nav-item">
        <span className="bottom-nav-icon">🪑</span>
        <span>{t.guests}</span>
      </Link>
      <Link href={`/dashboard/${inviteId}/edit`} className="bottom-nav-item">
        <span className="bottom-nav-icon">✏️</span>
        <span>{t.edit}</span>
      </Link>
      <Link href={`/i/${inviteId}`} className="bottom-nav-item">
        <span className="bottom-nav-icon">👁</span>
        <span>{t.invite}</span>
      </Link>
    </nav>
  );
}
