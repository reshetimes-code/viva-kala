"use client";

import { useState } from "react";
import { AdminCard, AdminCardRow } from "@/components/AdminCard";
import QrCode from "@/components/QrCode";

export default function HallClientCard({
  username,
  title,
  date,
  venue,
  rsvpTotal,
  rsvpAttending,
  tableCount,
  inviteUrl,
}: {
  username: string;
  title: string;
  date: string;
  venue: string;
  rsvpTotal: number;
  rsvpAttending: number;
  tableCount: number;
  inviteUrl?: string;
}) {
  const [qrOpen, setQrOpen] = useState(false);

  const waHref = inviteUrl
    ? `https://wa.me/?text=${encodeURIComponent(`הקוד/קישור להזמנה שלכם ב-VIVA:\n${inviteUrl}`)}`
    : undefined;
  const mailHref = inviteUrl
    ? `mailto:?subject=${encodeURIComponent("הקישור להזמנה שלכם")}&body=${encodeURIComponent(inviteUrl)}`
    : undefined;

  return (
    <AdminCard title={title} subtitle={[username, date].filter(Boolean).join(" · ")}>
      <AdminCardRow label="שם משתמש" value={username} />
      {date && <AdminCardRow label="תאריך האירוע" value={date} />}
      {venue && <AdminCardRow label="מיקום" value={venue} />}
      <AdminCardRow label="אישרו הגעה" value={`${rsvpAttending} מתוך ${rsvpTotal} תגובות`} />
      <AdminCardRow label="סידורי הושבה" value={`${tableCount} שולחנות`} />
      {inviteUrl && (
        <>
          <button type="button" className="hall-qr-toggle-btn" onClick={() => setQrOpen((v) => !v)}>
            📱 {qrOpen ? "סגירת" : "שליחת"} קוד QR
          </button>
          {qrOpen && (
            <div className="hall-qr-panel">
              <QrCode value={inviteUrl} size={140} />
              <div className="hall-qr-actions">
                <a className="hall-qr-action" href={waHref} target="_blank" rel="noopener noreferrer">
                  💬 וואטסאפ
                </a>
                <a className="hall-qr-action" href={mailHref}>
                  ✉️ מייל
                </a>
              </div>
            </div>
          )}
        </>
      )}
    </AdminCard>
  );
}
