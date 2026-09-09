"use client";

import { useState } from "react";
import Link from "next/link";
import { leadWhatsappHref } from "@/lib/waContact";

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
    if (!confirm(`למחוק את ${rsvp.guestName} ${rsvp.familyName} מרשימת האורחים?`)) return;
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
      setPwMessage({ type: "error", text: "הסיסמה חייבת להכיל לפחות 4 תווים" });
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
        setPwMessage({ type: "error", text: data?.error || "שגיאה באיפוס הסיסמה" });
      } else {
        setPwMessage({ type: "ok", text: "הסיסמה אופסה בהצלחה" });
        setPwValue("");
      }
    } catch {
      setPwMessage({ type: "error", text: "שגיאת רשת" });
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="admin-user-panel">
      {inviteGroups.map((group) => (
        <div key={group.invite.id} className="admin-guest-section">
          <p className="admin-guest-section-title">
            אורחים - {group.invite.partyType || group.invite.templateId || "הזמנה"}
            {group.invite.eventDate ? ` (${group.invite.eventDate})` : ""}
          </p>
          {group.rsvps.length === 0 && <p className="admin-empty admin-empty-inline">אין עדיין תגובות.</p>}
          <div className="admin-guest-list">
            {group.rsvps.map((r) => (
              <GuestRow
                key={r.id}
                rsvp={r}
                tableNumber={tableNumberFor(group, r.tableId)}
                editing={editingId === r.id}
                busy={busyId === r.id}
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
          <p className="admin-guest-section-title">לידים ({leads.length})</p>
          <div className="admin-guest-list">
            {leads.map((l) => (
              <div key={l.id} className="admin-guest-row">
                <div className="admin-guest-info">
                  <span className="admin-guest-name">{l.name || "—"}</span>
                  <span className="admin-guest-meta">
                    <span dir="ltr">{l.phone}</span>
                    {l.eventType ? ` · ${l.eventType}` : ""}
                    {l.eventDate ? ` · ${new Date(l.eventDate).toLocaleDateString("he-IL")}` : ""}
                    {l.eventVenue ? ` · ${l.eventVenue}` : ""}
                  </span>
                </div>
                <a
                  className="admin-contact-btn"
                  href={leadWhatsappHref(l.phone, l.name, username)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  💬 צור קשר
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <form className="admin-pw-reset-form" onSubmit={handleResetPassword}>
        <label>איפוס סיסמה לחשבון</label>
        <div className="admin-pw-reset-row">
          <input
            type="password"
            placeholder="סיסמה חדשה"
            value={pwValue}
            onChange={(e) => setPwValue(e.target.value)}
          />
          <button type="submit" className="admin-save-btn" disabled={pwSaving}>
            {pwSaving ? "מאפס..." : "איפוס סיסמה"}
          </button>
        </div>
        {pwMessage && <p className={`admin-edit-msg admin-edit-msg-${pwMessage.type}`}>{pwMessage.text}</p>}
      </form>

      <Link href={`/admin/users/${userId}`} className="admin-row-link">
        עוד פרטים ו-QR לכל הזמנה ←
      </Link>
    </div>
  );
}

function GuestRow({
  rsvp,
  tableNumber,
  editing,
  busy,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: {
  rsvp: RsvpRow;
  tableNumber: string | null;
  editing: boolean;
  busy: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (draft: { guestName: string; familyName: string; phone: string; attending: boolean; guestCount: number }) => void;
  onDelete: () => void;
}) {
  const [guestName, setGuestName] = useState(rsvp.guestName);
  const [familyName, setFamilyName] = useState(rsvp.familyName);
  const [phone, setPhone] = useState(rsvp.phone);
  const [attending, setAttending] = useState(rsvp.attending);
  const [guestCount, setGuestCount] = useState(rsvp.guestCount);

  if (editing) {
    return (
      <div className="admin-guest-row admin-guest-row-editing">
        <div className="admin-guest-edit-fields">
          <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="שם פרטי" />
          <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="שם משפחה" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="טלפון" dir="ltr" />
          <input
            type="number"
            min={1}
            value={guestCount}
            onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value) || 1))}
            title="כמות מגיעים"
          />
          <label className="admin-guest-attending-toggle">
            <input type="checkbox" checked={attending} onChange={(e) => setAttending(e.target.checked)} />
            מגיע/ה
          </label>
        </div>
        <div className="admin-guest-actions">
          <button
            type="button"
            className="admin-guest-save"
            disabled={busy}
            onClick={() => onSave({ guestName, familyName, phone, attending, guestCount })}
          >
            שמירה
          </button>
          <button type="button" className="admin-cancel-btn" disabled={busy} onClick={onCancel}>
            ביטול
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
            {rsvp.attending ? "מגיע/ה" : "לא מגיע/ה"}
          </span>
          {" · "}
          {rsvp.guestCount} סה&quot;כ
          {" · "}
          שולחן: {tableNumber ?? "לא שובץ"}
        </span>
      </div>
      <div className="admin-guest-actions">
        <button type="button" className="admin-table-edit" title="עריכה" onClick={onEdit}>
          ✏️
        </button>
        <button type="button" className="admin-table-delete" title="מחיקה" disabled={busy} onClick={onDelete}>
          🗑
        </button>
      </div>
    </div>
  );
}
