"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { StoredInvite } from "@/lib/store";

interface Props {
  invite: StoredInvite & { rsvpCounts: { total: number; attending: number } };
}

export default function InviteCard({ invite }: Props) {
  const router = useRouter();
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
    const names = invite.celebrants.map((c) => c.name).filter(Boolean).join(" ו");
    title = [invite.partyType, names && `של ${names}`].filter(Boolean).join(" ");
  }

  async function handleDelete() {
    if (!confirm("למחוק את ההזמנה הזו? הפעולה בלתי הפיכה.")) return;
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
        alert(data?.error || `שגיאה במחיקת ההזמנה (${res.status})`);
      }
    } catch {
      alert("שגיאת רשת - נסה שוב");
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
            <span>תאריך האירוע</span>
            <strong>{invite.eventDate || "—"}</strong>
          </div>
          <h3>{title || "הזמנה ללא כותרת"}</h3>
        </div>

        {invite.address && <p className="dash-card-line">מיקום: {invite.address}</p>}
        {invite.eventStart && <p className="dash-card-line">שעת קבלת פנים: {invite.eventStart}</p>}
        {invite.wantRsvp && (
          <Link href={`/dashboard/${invite.id}/guests`} className="dash-card-line dash-card-line-link">
            אישורי הגעה: {invite.rsvpCounts.attending}/{invite.rsvpCounts.total} ←
          </Link>
        )}

        <div className="dash-card-actions">
          {invite.wantRsvp && (
            <Link href={`/dashboard/${invite.id}/guests`} className="dash-btn dash-btn-green">
              🪑 אורחים והושבה
            </Link>
          )}
          {/* Opens in a real new tab instead of navigating inside the
              dashboard's own desktop phone-mockup iframe - staying inside
              it was exactly what caused a second, nested phone frame to
              show up wrapped around the invite itself. A fresh top-level
              tab always renders the invite's own desktop-preview wrapper
              correctly, exactly once. */}
          <a href={`/i/${invite.id}`} target="_blank" rel="noopener noreferrer" className="dash-btn dash-btn-blue">
            👁 הצג
          </a>
          <Link href={`/dashboard/${invite.id}/edit`} className="dash-btn dash-btn-orange">
            ✏️ עריכה
          </Link>
          <button type="button" className="dash-btn dash-btn-red" onClick={handleDelete} disabled={busy}>
            🗑 מחיקה
          </button>
        </div>

        <p className="dash-card-created">
          נוצר ב: {new Date(invite.createdAt).toLocaleString("he-IL")}
        </p>
      </div>
    </div>
  );
}
