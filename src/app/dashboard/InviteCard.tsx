"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { StoredInvite } from "@/lib/store";
import { useLocale } from "@/lib/i18n/LanguageProvider";

interface Props {
  invite: StoredInvite & { rsvpCounts: { total: number; attending: number } };
}

const COPY = {
  he: {
    untitled: "הזמנה ללא כותרת",
    of: "של",
    eventDate: "תאריך האירוע",
    location: "מיקום",
    receptionTime: "שעת קבלת פנים",
    rsvps: "אישורי הגעה",
    guestsSeating: "🪑 אורחים והושבה",
    view: "👁 הצג",
    edit: "✏️ עריכה",
    delete: "🗑 מחיקה",
    createdAt: "נוצר ב",
    confirmDelete: "למחוק את ההזמנה הזו? הפעולה בלתי הפיכה.",
    deleteError: (status: number) => `שגיאה במחיקת ההזמנה (${status})`,
    networkError: "שגיאת רשת - נסה שוב",
  },
  en: {
    untitled: "Untitled invitation",
    of: "for",
    eventDate: "Event date",
    location: "Location",
    receptionTime: "Reception time",
    rsvps: "RSVPs",
    guestsSeating: "🪑 Guests & seating",
    view: "👁 View",
    edit: "✏️ Edit",
    delete: "🗑 Delete",
    createdAt: "Created",
    confirmDelete: "Delete this invitation? This action cannot be undone.",
    deleteError: (status: number) => `Error deleting the invitation (${status})`,
    networkError: "Network error - please try again",
  },
};

// eventDate is stored as the raw ISO value from a type="date" input
// (YYYY-MM-DD) - shown here as DD/MM/YYYY instead. Left as-is if it's
// anything else (e.g. empty), so this never turns a real value into "—".
function formatEventDate(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return value;
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

export default function InviteCard({ invite }: Props) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = COPY[locale];
  const [busy, setBusy] = useState(false);

  let title = "";
  let displayDate = invite.eventDate;
  if (invite.mode === "template" && invite.templateFields) {
    const f = invite.templateFields as Record<string, string>;
    title = [f.titleLine1, f.titleLine2].filter(Boolean).join(" & ");
    // Templates have a separate free-text "display date" (dateText) from the
    // real calendar date (eventDate) - fall back to it if eventDate was left
    // empty, so the dashboard doesn't show a bare dash for no reason.
    if (!displayDate && f.dateText) displayDate = f.dateText;
  } else {
    const names = invite.celebrants.map((c) => c.name).filter(Boolean).join(locale === "he" ? " ו" : " & ");
    title = [invite.partyType, names && `${t.of} ${names}`].filter(Boolean).join(" ");
  }

  async function handleDelete() {
    if (!confirm(t.confirmDelete)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/invites/${invite.id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        // Used to fail silently here - the card just sat there with no
        // sign anything went wrong, which is exactly what "I click delete
        // and nothing happens" looks like from the outside.
        const data = await res.json().catch(() => null);
        alert(data?.error || t.deleteError(res.status));
      }
    } catch {
      alert(t.networkError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dash-card">
      <div className="dash-card-topbar" />
      <div className="dash-card-body">
        <div className="dash-card-head">
          <div className="dash-date-badge">
            <span>{t.eventDate}</span>
            <strong>{invite.eventDate ? formatEventDate(invite.eventDate) : "—"}</strong>
          </div>
          <h3>{title || t.untitled}</h3>
        </div>

        {invite.address && <p className="dash-card-line">{t.location}: {invite.address}</p>}
        {invite.eventStart && <p className="dash-card-line">{t.receptionTime}: {invite.eventStart}</p>}
        {invite.wantRsvp && (
          <Link href={`/dashboard/${invite.id}/guests`} className="dash-card-line dash-card-line-link">
            {t.rsvps}: {invite.rsvpCounts.attending}/{invite.rsvpCounts.total} ←
          </Link>
        )}

        <div className="dash-card-actions">
          {invite.wantRsvp && (
            <Link href={`/dashboard/${invite.id}/guests`} className="dash-btn dash-btn-green">
              {t.guestsSeating}
            </Link>
          )}
          {/* Opens in a real new tab instead of navigating inside the
              dashboard's own desktop phone-mockup iframe - staying inside
              it was exactly what caused a second, nested phone frame to
              show up wrapped around the invite itself. A fresh top-level
              tab always renders the invite's own desktop-preview wrapper
              correctly, exactly once. */}
          <a href={`/i/${invite.id}`} target="_blank" rel="noopener noreferrer" className="dash-btn dash-btn-blue">
            {t.view}
          </a>
          <Link href={`/dashboard/${invite.id}/edit`} className="dash-btn dash-btn-orange">
            {t.edit}
          </Link>
          <button type="button" className="dash-btn dash-btn-red" onClick={handleDelete} disabled={busy}>
            {t.delete}
          </button>
        </div>

        <p className="dash-card-created">
          {t.createdAt}: {new Date(invite.createdAt).toLocaleString(locale === "he" ? "he-IL" : "en-US")}
        </p>
      </div>
    </div>
  );
}
