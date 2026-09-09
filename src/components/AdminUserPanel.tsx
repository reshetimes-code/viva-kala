"use client";

import { useState } from "react";
import Link from "next/link";
import { leadWhatsappHref } from "@/lib/waContact";
import { useLocale } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/locale";

const COPY = {
  he: {
    guestsFor: (name: string) => `אורחים - ${name}`,
    invite: "הזמנה",
    noResponses: "אין עדיין תגובות.",
    leads: (count: number) => `לידים (${count})`,
    contact: "💬 צור קשר",
    resetPasswordLabel: "איפוס סיסמה לחשבון",
    newPasswordPlaceholder: "סיסמה חדשה",
    resetting: "מאפס...",
    resetPassword: "איפוס סיסמה",
    shortPassword: "הסיסמה חייבת להכיל לפחות 4 תווים",
    resetError: "שגיאה באיפוס הסיסמה",
    resetOk: "הסיסמה אופסה בהצלחה",
    networkError: "שגיאת רשת",
    moreDetails: "עוד פרטים ו-QR לכל הזמנה ←",
    confirmDelete: (name: string) => `למחוק את ${name} מרשימת האורחים?`,
    firstName: "שם פרטי",
    lastName: "שם משפחה",
    phone: "טלפון",
    guestCountTitle: "כמות מגיעים",
    attendingLabel: "מגיע/ה",
    save: "שמירה",
    cancel: "ביטול",
    edit: "עריכה",
    delete: "מחיקה",
    attendingYes: "מגיע/ה",
    attendingNo: "לא מגיע/ה",
    total: 'סה"כ',
    table: "שולחן:",
    unassigned: "לא שובץ",
    dateLocale: "he-IL",
  },
  en: {
    guestsFor: (name: string) => `Guests - ${name}`,
    invite: "Invite",
    noResponses: "No responses yet.",
    leads: (count: number) => `Leads (${count})`,
    contact: "💬 Contact",
    resetPasswordLabel: "Reset account password",
    newPasswordPlaceholder: "New password",
    resetting: "Resetting...",
    resetPassword: "Reset password",
    shortPassword: "Password must be at least 4 characters",
    resetError: "Error resetting password",
    resetOk: "Password reset successfully",
    networkError: "Network error",
    moreDetails: "More details and QR for each invite ←",
    confirmDelete: (name: string) => `Delete ${name} from the guest list?`,
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    guestCountTitle: "Guest count",
    attendingLabel: "Attending",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    attendingYes: "Attending",
    attendingNo: "Not attending",
    total: "total",
    table: "Table:",
    unassigned: "Unassigned",
    dateLocale: "en-US",
  },
};

interface RsvpRow {
  id: number;
  guestName: string;
  familyName: string;
  phone: string;
  attending: boolean;
  guestCount: number;
  tableId: string | null;
}

interface TableRow {
  id: string;
  number: string;
}

interface InviteGroup {
  invite: { id: string; partyType: string; templateId?: string; eventDate: string };
  rsvps: RsvpRow[];
  tables: TableRow[];
}

interface LeadRow {
  id: number;
  name: string;
  phone: string;
  eventType: string;
  eventDate: string;
  eventVenue: string;
  createdAt: string;
  sourceInviteId: string;
}

interface Props {
  userId: number;
  username: string;
  invites: InviteGroup[];
  leads: LeadRow[];
}

/** The "not just numbers" part of each user's accordion row on /admin - the
 *  actual guest list per invite (editable/deletable in place), that user's
 *  leads, and a one-field quick password reset. Lives inside the same
 *  AdminCard body as the existing stat rows/action buttons (admin/page.tsx),
 *  just the part rich enough to need its own client-side state. */
export default function AdminUserPanel({ userId, username, invites, leads }: Props) {
  const { locale } = useLocale();
  const t = COPY[locale];
  const [inviteGroups, setInviteGroups] = useState(invites);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function tableNumberFor(group: InviteGroup, tableId: string | null) {
    if (!tableId) return null;
    return group.tables.find((t) => t.id === tableId)?.number ?? null;
  }

  function patchRsvpLocally(rsvpId: number, patch: Partial<RsvpRow>) {
    setInviteGroups((groups) =>
      groups.map((g) => ({ ...g, rsvps: g.rsvps.map((r) => (r.id === rsvpId ? { ...r, ...patch } : r)) }))
    );
  }

  async function handleSaveGuest(rsvp: RsvpRow, draft: { guestName: string; familyName: string; phone: string; attending: boolean; guestCount: number }) {
    setBusyId(rsvp.id);
    try {
      const res = await fetch(`/api/admin/rsvp/${rsvp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        patchRsvpLocally(rsvp.id, draft);
        setEditingId(null);
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteGuest(rsvp: RsvpRow) {
    if (!confirm(t.confirmDelete(`${rsvp.guestName} ${rsvp.familyName}`))) return;
    setBusyId(rsvp.id);
    try {
      const res = await fetch(`/api/admin/rsvp/${rsvp.id}`, { method: "DELETE" });
      if (res.ok) {
        setInviteGroups((groups) => groups.map((g) => ({ ...g, rsvps: g.rsvps.filter((r) => r.id !== rsvp.id) })));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwValue.trim().length < 4) {
      setPwMessage({ type: "error", text: t.shortPassword });
      return;
    }
    setPwSaving(true);
    setPwMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwValue }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPwMessage({ type: "error", text: data?.error || t.resetError });
      } else {
        setPwMessage({ type: "ok", text: t.resetOk });
        setPwValue("");
      }
    } catch {
      setPwMessage({ type: "error", text: t.networkError });
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="admin-user-panel">
      {inviteGroups.map((group) => (
        <div key={group.invite.id} className="admin-guest-section">
          <p className="admin-guest-section-title">
            {t.guestsFor(group.invite.partyType || group.invite.templateId || t.invite)}
            {group.invite.eventDate ? ` (${group.invite.eventDate})` : ""}
          </p>
          {group.rsvps.length === 0 && <p className="admin-empty admin-empty-inline">{t.noResponses}</p>}
          <div className="admin-guest-list">
            {group.rsvps.map((r) => (
              <GuestRow
                key={r.id}
                rsvp={r}
                tableNumber={tableNumberFor(group, r.tableId)}
                editing={editingId === r.id}
                busy={busyId === r.id}
                locale={locale}
                onEdit={() => setEditingId(r.id)}
                onCancel={() => setEditingId(null)}
                onSave={(draft) => handleSaveGuest(r, draft)}
                onDelete={() => handleDeleteGuest(r)}
              />
            ))}
          </div>
        </div>
      ))}

      {leads.length > 0 && (
        <div className="admin-guest-section">
          <p className="admin-guest-section-title">{t.leads(leads.length)}</p>
          <div className="admin-guest-list">
            {leads.map((l) => (
              <div key={l.id} className="admin-guest-row">
                <div className="admin-guest-info">
                  <span className="admin-guest-name">{l.name || "—"}</span>
                  <span className="admin-guest-meta">
                    <span dir="ltr">{l.phone}</span>
                    {l.eventType ? ` · ${l.eventType}` : ""}
                    {l.eventDate ? ` · ${new Date(l.eventDate).toLocaleDateString(t.dateLocale)}` : ""}
                    {l.eventVenue ? ` · ${l.eventVenue}` : ""}
                  </span>
                </div>
                <a
                  className="admin-contact-btn"
                  href={leadWhatsappHref(l.phone, l.name, username)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.contact}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <form className="admin-pw-reset-form" onSubmit={handleResetPassword}>
        <label>{t.resetPasswordLabel}</label>
        <div className="admin-pw-reset-row">
          <input
            type="password"
            placeholder={t.newPasswordPlaceholder}
            value={pwValue}
            onChange={(e) => setPwValue(e.target.value)}
          />
          <button type="submit" className="admin-save-btn" disabled={pwSaving}>
            {pwSaving ? t.resetting : t.resetPassword}
          </button>
        </div>
        {pwMessage && <p className={`admin-edit-msg admin-edit-msg-${pwMessage.type}`}>{pwMessage.text}</p>}
      </form>

      <Link href={`/admin/users/${userId}`} className="admin-row-link">
        {t.moreDetails}
      </Link>
    </div>
  );
}

function GuestRow({
  rsvp,
  tableNumber,
  editing,
  busy,
  locale,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: {
  rsvp: RsvpRow;
  tableNumber: string | null;
  editing: boolean;
  busy: boolean;
  locale: Locale;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (draft: { guestName: string; familyName: string; phone: string; attending: boolean; guestCount: number }) => void;
  onDelete: () => void;
}) {
  const t = COPY[locale];
  const [guestName, setGuestName] = useState(rsvp.guestName);
  const [familyName, setFamilyName] = useState(rsvp.familyName);
  const [phone, setPhone] = useState(rsvp.phone);
  const [attending, setAttending] = useState(rsvp.attending);
  const [guestCount, setGuestCount] = useState(rsvp.guestCount);

  if (editing) {
    return (
      <div className="admin-guest-row admin-guest-row-editing">
        <div className="admin-guest-edit-fields">
          <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder={t.firstName} />
          <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder={t.lastName} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.phone} dir="ltr" />
          <input
            type="number"
            min={1}
            value={guestCount}
            onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value) || 1))}
            title={t.guestCountTitle}
          />
          <label className="admin-guest-attending-toggle">
            <input type="checkbox" checked={attending} onChange={(e) => setAttending(e.target.checked)} />
            {t.attendingLabel}
          </label>
        </div>
        <div className="admin-guest-actions">
          <button
            type="button"
            className="admin-guest-save"
            disabled={busy}
            onClick={() => onSave({ guestName, familyName, phone, attending, guestCount })}
          >
            {t.save}
          </button>
          <button type="button" className="admin-cancel-btn" disabled={busy} onClick={onCancel}>
            {t.cancel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-guest-row">
      <div className="admin-guest-info">
        <span className="admin-guest-name">
          {rsvp.guestName} {rsvp.familyName}
        </span>
        <span className="admin-guest-meta">
          <span dir="ltr">{rsvp.phone}</span>
          {" · "}
          <span className={rsvp.attending ? "admin-guest-yes" : "admin-guest-no"}>
            {rsvp.attending ? t.attendingYes : t.attendingNo}
          </span>
          {" · "}
          {rsvp.guestCount} {t.total}
          {" · "}
          {t.table} {tableNumber ?? t.unassigned}
        </span>
      </div>
      <div className="admin-guest-actions">
        <button type="button" className="admin-table-edit" title={t.edit} onClick={onEdit}>
          ✏️
        </button>
        <button type="button" className="admin-table-delete" title={t.delete} disabled={busy} onClick={onDelete}>
          🗑
        </button>
      </div>
    </div>
  );
}
