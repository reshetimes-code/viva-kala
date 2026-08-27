"use client";

import { useState } from "react";
import Link from "next/link";
import type { StoredRsvp, StoredTable } from "@/lib/store";
import RoundTable from "./RoundTable";
import QrCode from "@/components/QrCode";

interface Props {
  inviteId: string;
  inviteTitle: string;
  initialRsvps: StoredRsvp[];
  initialTables: StoredTable[];
}

export default function GuestManager({ inviteId, inviteTitle, initialRsvps, initialTables }: Props) {
  const [rsvps, setRsvps] = useState(initialRsvps);
  const [tables, setTables] = useState(initialTables);
  const [tab, setTab] = useState<"guests" | "seating">("guests");
  const [newTableNumber, setNewTableNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [justSavedId, setJustSavedId] = useState<number | null>(null);
  const [addingTable, setAddingTable] = useState(false);

  const attending = rsvps.filter((r) => r.attending);
  const notAttending = rsvps.filter((r) => !r.attending);

  async function refresh() {
    const res = await fetch(`/api/invites/${inviteId}/guests`);
    if (res.ok) {
      const data = await res.json();
      setRsvps(data.rsvps);
      setTables(data.tables);
    }
  }

  async function handleAddTable(e: React.FormEvent) {
    e.preventDefault();
    if (!newTableNumber.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/invites/${inviteId}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: newTableNumber.trim() }),
      });
      if (res.ok) {
        setNewTableNumber("");
        setAddingTable(false);
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteTable(tableId: string) {
    if (!confirm("למחוק את השולחן הזה? האורחים המשובצים בו יעברו ל'ללא שיבוץ'.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/invites/${inviteId}/tables/${tableId}`, { method: "DELETE" });
      if (res.ok) await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleAssign(rsvpId: number, tableId: string) {
    setRsvps((prev) => prev.map((r) => (r.id === rsvpId ? { ...r, tableId: tableId || null } : r)));
    await fetch(`/api/rsvp/${rsvpId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId: tableId || null }),
    });
    // Selecting a table from a dropdown doesn't feel like it "did" anything
    // on its own - flash a brief confirmation so it's clear the change saved.
    setJustSavedId(rsvpId);
    setTimeout(() => setJustSavedId((cur) => (cur === rsvpId ? null : cur)), 1600);
  }

  function guestsForTable(tableId: string) {
    return rsvps.filter((r) => r.tableId === tableId);
  }

  return (
    <div className="gm-page">
      <div className="gm-header">
        <Link href="/dashboard" className="gm-back">
          → חזרה
        </Link>
        <h1>{inviteTitle}</h1>
      </div>

      <div className="gm-stats">
        <div className="gm-stat">
          <span className="gm-stat-num">{attending.length}</span>
          <span className="gm-stat-label">אישרו הגעה</span>
        </div>
        <div className="gm-stat">
          <span className="gm-stat-num">{rsvps.length}</span>
          <span className="gm-stat-label">סה&quot;כ תגובות</span>
        </div>
        <div className="gm-stat">
          <span className="gm-stat-num">{tables.length}</span>
          <span className="gm-stat-label">שולחנות</span>
        </div>
      </div>

      <div className="gm-tabs">
        <button
          type="button"
          className={`gm-tab${tab === "guests" ? " is-active" : ""}`}
          onClick={() => setTab("guests")}
        >
          רשימת אורחים
        </button>
        <button
          type="button"
          className={`gm-tab${tab === "seating" ? " is-active" : ""}`}
          onClick={() => setTab("seating")}
        >
          סידורי הושבה
        </button>
      </div>

      {tab === "guests" && (
        <div className="gm-list">
          {rsvps.length === 0 && <p className="gm-empty">עדיין אין תגובות להזמנה שלכם.</p>}

          {attending.map((r) => (
            <div key={r.id} className="gm-guest-card">
              <div className="gm-guest-top">
                <span className="gm-guest-name">
                  {r.guestName} {r.familyName}
                </span>
                <span className="gm-badge gm-badge-yes">מגיע/ה</span>
              </div>
              {r.phone && <p className="gm-guest-line">📞 {r.phone}</p>}
              <p className="gm-guest-line">👥 {r.guestCount ?? 1} סה&quot;כ מגיעים</p>

              <div className="gm-assign-row">
                <label>שולחן</label>
                <select
                  className="gm-select"
                  value={r.tableId ?? ""}
                  onChange={(e) => handleAssign(r.id, e.target.value)}
                >
                  <option value="">ללא שיבוץ</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      שולחן {t.number}
                    </option>
                  ))}
                </select>
                {justSavedId === r.id && <span className="gm-saved-badge">✓ נשמר</span>}
              </div>
            </div>
          ))}

        </div>
      )}

      {tab === "seating" && (
        <div className="gm-list">
          <button type="button" className="gm-qr-btn" onClick={() => setQrOpen(true)}>
            📱 קוד QR להדפסה באולם
          </button>

          {addingTable ? (
            <form className="gm-add-table-form" onSubmit={handleAddTable}>
              <input
                className="gm-add-table-input"
                placeholder="מספר שולחן חדש"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                inputMode="numeric"
                autoFocus
              />
              <button type="submit" className="gm-add-table-btn" disabled={busy}>
                ➕ הוספה
              </button>
            </form>
          ) : (
            <button type="button" className="gm-add-table-btn gm-add-table-btn-full" onClick={() => setAddingTable(true)}>
              ➕ הוספת שולחן
            </button>
          )}

          {tables.length === 0 && <p className="gm-empty">עדיין לא יצרתם שולחנות.</p>}

          {tables.map((t) => {
            const guests = guestsForTable(t.id);
            return (
              <div key={t.id} className="gm-table-card">
                <div className="gm-table-top">
                  <span className="gm-table-number">שולחן {t.number}</span>
                  <button type="button" className="gm-table-delete" onClick={() => handleDeleteTable(t.id)}>
                    🗑
                  </button>
                </div>
                {guests.length === 0 ? (
                  <p className="gm-table-empty">אין עדיין אורחים משובצים</p>
                ) : (
                  <div className="gm-table-visual-wrap">
                    <RoundTable tableNumber={t.number} guests={guests} />
                  </div>
                )}
                <select
                  className="gm-table-add-guest"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAssign(Number(e.target.value), t.id);
                  }}
                >
                  <option value="">➕ הוספת אורח לשולחן זה...</option>
                  {attending
                    .filter((r) => r.tableId !== t.id)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.guestName} {r.familyName}
                        {r.tableId ? ` (כרגע בשולחן ${tables.find((x) => x.id === r.tableId)?.number})` : ""}
                      </option>
                    ))}
                </select>
              </div>
            );
          })}

          {rsvps.some((r) => r.attending && !r.tableId) && (
            <div className="gm-unassigned-card">
              <p className="gm-section-title">עדיין לא שובצו</p>
              <div className="gm-table-guests">
                {rsvps
                  .filter((r) => r.attending && !r.tableId)
                  .map((r) => (
                    <span key={r.id} className="gm-guest-chip gm-guest-chip-muted">
                      {r.guestName} {r.familyName}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {qrOpen && (
        <div className="gm-qr-modal-overlay" onClick={() => setQrOpen(false)}>
          <div className="gm-qr-modal-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="gm-qr-modal-close" onClick={() => setQrOpen(false)}>
              ×
            </button>
            <p className="gm-hall-qr-title">📍 קוד QR לאולם</p>
            <div className="gm-hall-qr-code">
              <QrCode
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/table-lookup/event/${inviteId}`}
              />
            </div>
            <ol className="gm-hall-qr-steps">
              <li>מדפיסים את הקוד</li>
              <li>תולים אותו בכניסה לאולם</li>
              <li>כל אורח סורק ומקליד את שמו</li>
              <li>מקבל אוטומטית את מספר השולחן שלו</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
