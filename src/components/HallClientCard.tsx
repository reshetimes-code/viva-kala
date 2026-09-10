"use client";

import { useState } from "react";
import { AdminCard, AdminCardRow } from "@/components/AdminCard";
import QrCode from "@/components/QrCode";
import ImpersonateButton from "@/components/ImpersonateButton";
import { useLocale } from "@/lib/i18n/LanguageProvider";

const COPY = {
  he: {
    username: "שם משתמש",
    eventDate: "תאריך האירוע",
    location: "מיקום",
    attending: "אישרו הגעה",
    attendingValue: (attending: number, total: number) => `${attending} מתוך ${total} תגובות`,
    seating: "סידורי הושבה",
    seatingValue: (count: number) => `${count} שולחנות`,
    closeQr: "סגירת",
    sendQr: "שליחת",
    qrCode: "קוד QR",
    whatsapp: "💬 וואטסאפ",
    email: "✉️ מייל",
    loginAsClient: "🔑 כניסה לחשבון הלקוח",
  },
  en: {
    username: "Username",
    eventDate: "Event date",
    location: "Location",
    attending: "Confirmed",
    attendingValue: (attending: number, total: number) => `${attending} of ${total} responses`,
    seating: "Seating",
    seatingValue: (count: number) => `${count} tables`,
    closeQr: "Hide",
    sendQr: "Show",
    qrCode: "QR code",
    whatsapp: "💬 WhatsApp",
    email: "✉️ Email",
    loginAsClient: "🔑 Log into client's account",
  },
};

export default function HallClientCard({
  userId,
  username,
  title,
  date,
  venue,
  rsvpTotal,
  rsvpAttending,
  tableCount,
  inviteUrl,
}: {
  userId: number;
  username: string;
  title: string;
  date: string;
  venue: string;
  rsvpTotal: number;
  rsvpAttending: number;
  tableCount: number;
  inviteUrl?: string;
}) {
  const { locale } = useLocale();
  const t = COPY[locale];
  const [qrOpen, setQrOpen] = useState(false);

  const waHref = inviteUrl
    ? `https://wa.me/?text=${encodeURIComponent(`הקוד/קישור להזמנה שלכם ב-VIVA:\n${inviteUrl}`)}`
    : undefined;
  const mailHref = inviteUrl
    ? `mailto:?subject=${encodeURIComponent("הקישור להזמנה שלכם")}&body=${encodeURIComponent(inviteUrl)}`
    : undefined;

  return (
    <AdminCard title={title} subtitle={[username, date].filter(Boolean).join(" · ")}>
      <AdminCardRow label={t.username} value={username} />
      {date && <AdminCardRow label={t.eventDate} value={date} />}
      {venue && <AdminCardRow label={t.location} value={venue} />}
      <AdminCardRow label={t.attending} value={t.attendingValue(rsvpAttending, rsvpTotal)} />
      <AdminCardRow label={t.seating} value={t.seatingValue(tableCount)} />
      {inviteUrl && (
        <>
          <button type="button" className="hall-qr-toggle-btn" onClick={() => setQrOpen((v) => !v)}>
            📱 {qrOpen ? t.closeQr : t.sendQr} {t.qrCode}
          </button>
          {qrOpen && (
            <div className="hall-qr-panel">
              <QrCode value={inviteUrl} size={140} />
              <div className="hall-qr-actions">
                <a className="hall-qr-action" href={waHref} target="_blank" rel="noopener noreferrer">
                  {t.whatsapp}
                </a>
                <a className="hall-qr-action" href={mailHref}>
                  {t.email}
                </a>
              </div>
            </div>
          )}
        </>
      )}
      <ImpersonateButton
        userId={userId}
        endpoint={`/api/hall/clients/${userId}/impersonate`}
        label={t.loginAsClient}
        className="hall-login-as-client-btn"
      />
    </AdminCard>
  );
}
