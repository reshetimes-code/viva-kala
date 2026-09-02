"use client";

import { useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
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
  const [newTableCapacity, setNewTableCapacity] = useState("");
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
        body: JSON.stringify({
          number: newTableNumber.trim(),
          capacity: newTableCapacity.trim() ? Number(newTableCapacity.trim()) : null,
        }),
      });
      if (res.ok) {
        setNewTableNumber("");
        setNewTableCapacity("");
        setAddingTable(false);
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleEditCapacity(table: StoredTable) {
    const { value, isConfirmed } = await Swal.fire({
      title: `כמות מקומות בשולחן ${table.number}`,
      input: "number",
      inputValue: table.capacity ?? "",
      inputAttributes: { min: "1", inputMode: "numeric" },
      inputPlaceholder: "לדוגמה: 12",
      showCancelButton: true,
      confirmButtonText: "שמירה",
      cancelButtonText: "ביטול",
      confirmButtonColor: "#b8860b",
    });
    if (!isConfirmed) return;
    const capacity = value === "" || value === undefined ? null : Number(value);
    setBusy(true);
    try {
      const res = await fetch(`/api/invites/${inviteId}/tables/${table.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacity }),
      });
      if (res.ok) await refresh();
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

  function guestsForTable(tableId: string) {
    return rsvps.filter((r) => r.tableId === tableId);
  }

  function seatsTakenAtTable(tableId: string, excludeRsvpId?: number) {
    return guestsForTable(tableId)
      .filter((r) => r.id !== excludeRsvpId)
      .reduce((sum, r) => sum + (r.guestCount ?? 1), 0);
  }

  async function handleAssign(rsvpId: number, tableId: string) {
    if (tableId) {
      const table = tables.find((t) => t.id === tableId);
      const rsvp = rsvps.find((r) => r.id === rsvpId);
      if (table && table.capacity != null && rsvp) {
        const takenByOthers = seatsTakenAtTable(tableId, rsvpId);
        const newTotal = takenByOthers + (rsvp.guestCount ?? 1);
        if (newTotal > table.capacity) {
          const { isConfirmed } = await Swal.fire({
            icon: "warning",
            title: "שימו לב 🪑",
            html: `בשולחן <b>${table.number}</b> הגעתם לכמות המקסימלית של היושבים (${table.capacity} מקומות).<br/>שיבוץ זה יביא את השולחן ל-${newTotal} סועדים.`,
            confirmButtonText: "שבצו בכל זאת",
            showCancelButton: true,
            cancelButtonText: "ביטול",
            confirmButtonColor: "#b8860b",
          });
          if (!isConfirmed) return;
        }
      }
    }
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
              <input
                className="gm-add-table-input gm-add-table-capacity-input"
                placeholder="כמות מקומות (לא חובה)"
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(e.target.value)}
                inputMode="numeric"
                title="פה תוסיפו כמה מקומות יש בשולחן - לפי המספר הזה יסודרו כמות האורחים בשולחן"
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

          {tables.length === 0 && (
            <div className="gm-empty-tables">
              <p className="gm-empty">עדיין לא יצרתם שולחנות.</p>
              <button type="button" className="gm-add-table-round" onClick={() => setAddingTable(true)}>
                הוספת שולחן
              </button>
            </div>
          )}

          {tables.map((t) => {
            const guests = guestsForTable(t.id);
            const seatsTaken = seatsTakenAtTable(t.id);
            const isFull = t.capacity != null && seatsTaken >= t.capacity;
            return (
              <div key={t.id} className="gm-table-card">
                <div className="gm-table-top">
                  <span className="gm-table-number">
                    שולחן {t.number}
                    {t.capacity != null && (
                      <span className={`gm-table-capacity${isFull ? " gm-table-capacity-full" : ""}`}>
                        {" "}
                        ({seatsTaken}/{t.capacity} מקומות)
                      </span>
                    )}
                  </span>
                  <div className="gm-table-actions">
                    <button type="button" className="gm-table-edit" onClick={() => handleEditCapacity(t)} title="עריכת כמות מקומות">
                      ✏️
                    </button>
                    <button type="button" className="gm-table-delete" onClick={() => handleDeleteTable(t.id)}>
                      🗑
                    </button>
                  </div>
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
