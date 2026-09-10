"use client";

import { useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import type { StoredRsvp, StoredTable } from "@/lib/store";
import RoundTable from "./RoundTable";
import QrCode from "@/components/QrCode";
import { useLocale } from "@/lib/i18n/LanguageProvider";

interface Props {
  inviteId: string;
  inviteTitle: string;
  initialRsvps: StoredRsvp[];
  initialTables: StoredTable[];
}

const COPY = {
  he: {
    back: "→ חזרה",
    statAttending: "אישרו הגעה",
    statTotal: 'סה"כ תגובות',
    statTables: "שולחנות",
    tabGuests: "רשימת אורחים",
    tabSeating: "סידורי הושבה",
    noRsvpsYet: "עדיין אין תגובות להזמנה שלכם.",
    attendingBadge: "מגיע/ה",
    totalGuestsLine: (n: number) => `👥 ${n} סה"כ מגיעים`,
    tableLabel: "שולחן",
    noTableOption: "ללא שיבוץ",
    tableOption: (n: string) => `שולחן ${n}`,
    savedBadge: "✓ נשמר",
    qrButton: "📱 קוד QR להדפסה באולם",
    newTablePlaceholder: "מספר שולחן חדש",
    newCapacityPlaceholder: "כמות מקומות (לא חובה)",
    capacityTitle: "פה תוסיפו כמה מקומות יש בשולחן - לפי המספר הזה יסודרו כמות האורחים בשולחן",
    addTableSubmit: "➕ הוספה",
    addTableFull: "➕ הוספת שולחן",
    noTablesYet: "עדיין לא יצרתם שולחנות.",
    addTableRound: "הוספת שולחן",
    tableCapacitySuffix: (taken: number, capacity: number) => `(${taken}/${capacity} מקומות)`,
    addGuestManually: "➕ הוספת אורח ידנית",
    addGuestManuallySub: "לאורחים שלא עברו באישור הגעה",
    addGuestManuallyHint: "לאורח שלא יודע/ת לאשר הגעה בעצמו - תוסיפו אותו/ה כאן ותוכלו לשבץ לשולחן",
    newGuestNamePlaceholder: "שם פרטי",
    newGuestFamilyPlaceholder: "שם משפחה (לא חובה)",
    newGuestPhonePlaceholder: "טלפון (לא חובה)",
    addGuestSubmit: "➕ הוספה",
    addGuestGenericError: "שגיאה בהוספת האורח",
    editCapacityTitle: "עריכת כמות מקומות",
    noGuestsAtTable: "אין עדיין אורחים משובצים",
    addGuestToTable: "➕ הוספת אורח לשולחן זה...",
    currentlyAtTable: (n: string) => ` (כרגע בשולחן ${n})`,
    unassignedTitle: "עדיין לא שובצו",
    hallQrTitle: "📍 קוד QR לאולם",
    hallQrSteps: [
      "מדפיסים את הקוד",
      "תולים אותו בכניסה לאולם",
      "כל אורח סורק ומקליד את שמו",
      "מקבל אוטומטית את מספר השולחן שלו",
    ],
    editCapacityModal: {
      title: (n: string) => `כמות מקומות בשולחן ${n}`,
      placeholder: "לדוגמה: 12",
      confirm: "שמירה",
      cancel: "ביטול",
    },
    assignWarningModal: {
      title: "שימו לב 🪑",
      html: (n: string, capacity: number, newTotal: number) =>
        `בשולחן <b>${n}</b> הגעתם לכמות המקסימלית של היושבים (${capacity} מקומות).<br/>שיבוץ זה יביא את השולחן ל-${newTotal} סועדים.`,
      confirm: "שבצו בכל זאת",
      cancel: "ביטול",
    },
    deleteTableConfirm: "למחוק את השולחן הזה? האורחים המשובצים בו יעברו ל'ללא שיבוץ'.",
    noTablesYetModal: {
      title: "עדיין לא יצרתם שולחן",
      text: "כדי לשבץ אורחים צריך קודם שולחן אחד לפחות. ליצור עכשיו?",
      confirm: "כן",
      cancel: "לא",
    },
  },
  en: {
    back: "→ Back",
    statAttending: "Attending",
    statTotal: "Total responses",
    statTables: "Tables",
    tabGuests: "Guest list",
    tabSeating: "Seating arrangement",
    noRsvpsYet: "No responses to your invitation yet.",
    attendingBadge: "Attending",
    totalGuestsLine: (n: number) => `👥 ${n} attending`,
    tableLabel: "Table",
    noTableOption: "Unassigned",
    tableOption: (n: string) => `Table ${n}`,
    savedBadge: "✓ Saved",
    qrButton: "📱 QR code for printing at the venue",
    newTablePlaceholder: "New table number",
    newCapacityPlaceholder: "Number of seats (optional)",
    capacityTitle: "Add how many seats this table has - guests will be arranged around it up to this number",
    addTableSubmit: "➕ Add",
    addTableFull: "➕ Add a table",
    noTablesYet: "You haven't created any tables yet.",
    addTableRound: "Add a table",
    tableCapacitySuffix: (taken: number, capacity: number) => `(${taken}/${capacity} seats)`,
    addGuestManually: "➕ Add a guest manually",
    addGuestManuallySub: "For guests who didn't RSVP",
    addGuestManuallyHint: "For a guest who can't RSVP themselves - add them here and you'll be able to seat them at a table",
    newGuestNamePlaceholder: "First name",
    newGuestFamilyPlaceholder: "Family name (optional)",
    newGuestPhonePlaceholder: "Phone (optional)",
    addGuestSubmit: "➕ Add",
    addGuestGenericError: "Error adding guest",
    editCapacityTitle: "Edit seat count",
    noGuestsAtTable: "No guests assigned yet",
    addGuestToTable: "➕ Add a guest to this table...",
    currentlyAtTable: (n: string) => ` (currently at table ${n})`,
    unassignedTitle: "Not yet assigned",
    hallQrTitle: "📍 QR code for the venue",
    hallQrSteps: [
      "Print the code",
      "Hang it at the venue entrance",
      "Each guest scans it and types their name",
      "They automatically get their table number",
    ],
    editCapacityModal: {
      title: (n: string) => `Number of seats at table ${n}`,
      placeholder: "e.g. 12",
      confirm: "Save",
      cancel: "Cancel",
    },
    assignWarningModal: {
      title: "Heads up 🪑",
      html: (n: string, capacity: number, newTotal: number) =>
        `Table <b>${n}</b> has reached its maximum seating (${capacity} seats).<br/>This assignment will bring the table to ${newTotal} guests.`,
      confirm: "Assign anyway",
      cancel: "Cancel",
    },
    deleteTableConfirm: "Delete this table? Guests assigned to it will move to 'Unassigned'.",
    noTablesYetModal: {
      title: "You haven't created a table yet",
      text: "You need at least one table before you can seat guests. Create one now?",
      confirm: "Yes",
      cancel: "No",
    },
  },
};

export default function GuestManager({ inviteId, inviteTitle, initialRsvps, initialTables }: Props) {
  const { locale } = useLocale();
  const t = COPY[locale];
  const [rsvps, setRsvps] = useState(initialRsvps);
  const [tables, setTables] = useState(initialTables);
  const [tab, setTab] = useState<"guests" | "seating">("guests");
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("");
  const [busy, setBusy] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [justSavedId, setJustSavedId] = useState<number | null>(null);
  const [addingTable, setAddingTable] = useState(false);
  const [addingGuest, setAddingGuest] = useState(false);
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestFamilyName, setNewGuestFamilyName] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");

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

  async function handleAddGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!newGuestName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/invites/${inviteId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: newGuestName.trim(),
          familyName: newGuestFamilyName.trim(),
          phone: newGuestPhone.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNewGuestName("");
        setNewGuestFamilyName("");
        setNewGuestPhone("");
        setAddingGuest(false);
        await refresh();
      } else {
        Swal.fire({ icon: "error", text: data.error || t.addGuestGenericError });
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleEditCapacity(table: StoredTable) {
    const { value, isConfirmed } = await Swal.fire({
      title: t.editCapacityModal.title(table.number),
      input: "number",
      inputValue: table.capacity ?? "",
      inputAttributes: { min: "1", inputMode: "numeric" },
      inputPlaceholder: t.editCapacityModal.placeholder,
      showCancelButton: true,
      confirmButtonText: t.editCapacityModal.confirm,
      cancelButtonText: t.editCapacityModal.cancel,
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
    if (!confirm(t.deleteTableConfirm)) return;
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
            title: t.assignWarningModal.title,
            html: t.assignWarningModal.html(table.number, table.capacity, newTotal),
            confirmButtonText: t.assignWarningModal.confirm,
            showCancelButton: true,
            cancelButtonText: t.assignWarningModal.cancel,
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

  // Blocks the native dropdown from opening (mousedown/touchstart fire
  // before the picker shows, unlike click) when there isn't a single table
  // to assign to yet, and offers to jump straight to the seating tab (where
  // "add a table" lives) instead of letting the host pick from an empty
  // "ללא שיבוץ"-only list with no clue why nothing else is there.
  function guardTableSelect(e: React.SyntheticEvent<HTMLSelectElement>) {
    if (tables.length > 0) return;
    e.preventDefault();
    Swal.fire({
      icon: "question",
      title: t.noTablesYetModal.title,
      text: t.noTablesYetModal.text,
      showCancelButton: true,
      confirmButtonText: t.noTablesYetModal.confirm,
      cancelButtonText: t.noTablesYetModal.cancel,
      confirmButtonColor: "#b8860b",
    }).then((result) => {
      if (result.isConfirmed) setTab("seating");
    });
  }

  return (
    <div className="gm-page">
      <div className="gm-header">
        <Link href="/dashboard" className="gm-back">
          {t.back}
        </Link>
        <h1>{inviteTitle}</h1>
      </div>

      <div className="gm-stats">
        <div className="gm-stat">
          <span className="gm-stat-num">{attending.length}</span>
          <span className="gm-stat-label">{t.statAttending}</span>
        </div>
        <div className="gm-stat">
          <span className="gm-stat-num">{rsvps.length}</span>
          <span className="gm-stat-label">{t.statTotal}</span>
        </div>
        <div className="gm-stat">
          <span className="gm-stat-num">{tables.length}</span>
          <span className="gm-stat-label">{t.statTables}</span>
        </div>
      </div>

      <div className="gm-tabs">
        <button
          type="button"
          className={`gm-tab${tab === "guests" ? " is-active" : ""}`}
          onClick={() => setTab("guests")}
        >
          {t.tabGuests}
        </button>
        <button
          type="button"
          className={`gm-tab${tab === "seating" ? " is-active" : ""}`}
          onClick={() => setTab("seating")}
        >
          {t.tabSeating}
        </button>
      </div>

      {tab === "guests" && (
        <div className="gm-list">
          {addingGuest ? (
            <form className="gm-add-guest-form" onSubmit={handleAddGuest}>
              <input
                className="gm-add-guest-input"
                placeholder={t.newGuestNamePlaceholder}
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                autoFocus
                required
              />
              <input
                className="gm-add-guest-input"
                placeholder={t.newGuestFamilyPlaceholder}
                value={newGuestFamilyName}
                onChange={(e) => setNewGuestFamilyName(e.target.value)}
              />
              <input
                className="gm-add-guest-input"
                placeholder={t.newGuestPhonePlaceholder}
                value={newGuestPhone}
                onChange={(e) => setNewGuestPhone(e.target.value)}
                type="tel"
                inputMode="tel"
              />
              <button type="submit" className="gm-add-guest-btn" disabled={busy}>
                {t.addGuestSubmit}
              </button>
            </form>
          ) : (
            <>
              <button
                type="button"
                className="gm-add-guest-btn gm-add-guest-btn-full gm-add-guest-btn-stacked"
                onClick={() => setAddingGuest(true)}
              >
                <span className="gm-add-guest-btn-label">{t.addGuestManually}</span>
                <span className="gm-add-guest-btn-sub">{t.addGuestManuallySub}</span>
              </button>
              <p className="gm-add-guest-hint">{t.addGuestManuallyHint}</p>
            </>
          )}

          {rsvps.length === 0 && <p className="gm-empty">{t.noRsvpsYet}</p>}

          {attending.map((r) => (
            <div key={r.id} className="gm-guest-card">
              <div className="gm-guest-top">
                <span className="gm-guest-name">
                  {r.guestName} {r.familyName}
                </span>
                <span className="gm-badge gm-badge-yes">{t.attendingBadge}</span>
              </div>
              {r.phone && <p className="gm-guest-line">📞 {r.phone}</p>}
              <p className="gm-guest-line">{t.totalGuestsLine(r.guestCount ?? 1)}</p>

              <div className="gm-assign-row">
                <label>{t.tableLabel}</label>
                <select
                  className="gm-select"
                  value={r.tableId ?? ""}
                  onChange={(e) => handleAssign(r.id, e.target.value)}
                  onMouseDown={guardTableSelect}
                  onTouchStart={guardTableSelect}
                >
                  <option value="">{t.noTableOption}</option>
                  {tables.map((tbl) => (
                    <option key={tbl.id} value={tbl.id}>
                      {t.tableOption(tbl.number)}
                    </option>
                  ))}
                </select>
                {justSavedId === r.id && <span className="gm-saved-badge">{t.savedBadge}</span>}
              </div>
            </div>
          ))}

        </div>
      )}

      {tab === "seating" && (
        <div className="gm-list">
          <button type="button" className="gm-qr-btn" onClick={() => setQrOpen(true)}>
            {t.qrButton}
          </button>

          {addingTable ? (
            <form className="gm-add-table-form" onSubmit={handleAddTable}>
              <input
                className="gm-add-table-input"
                placeholder={t.newTablePlaceholder}
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                inputMode="numeric"
                autoFocus
              />
              <input
                className="gm-add-table-input gm-add-table-capacity-input"
                placeholder={t.newCapacityPlaceholder}
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(e.target.value)}
                inputMode="numeric"
                title={t.capacityTitle}
              />
              <button type="submit" className="gm-add-table-btn" disabled={busy}>
                {t.addTableSubmit}
              </button>
            </form>
          ) : (
            <button type="button" className="gm-add-table-btn gm-add-table-btn-full" onClick={() => setAddingTable(true)}>
              {t.addTableFull}
            </button>
          )}

          {tables.length === 0 && (
            <div className="gm-empty-tables">
              <p className="gm-empty">{t.noTablesYet}</p>
              <button type="button" className="gm-add-table-round" onClick={() => setAddingTable(true)}>
                {t.addTableRound}
              </button>
            </div>
          )}

          {tables.map((tbl) => {
            const guests = guestsForTable(tbl.id);
            const seatsTaken = seatsTakenAtTable(tbl.id);
            const isFull = tbl.capacity != null && seatsTaken >= tbl.capacity;
            return (
              <div key={tbl.id} className="gm-table-card">
                <div className="gm-table-top">
                  <span className="gm-table-number">
                    {t.tableOption(tbl.number)}
                    {tbl.capacity != null && (
                      <span className={`gm-table-capacity${isFull ? " gm-table-capacity-full" : ""}`}>
                        {" "}
                        {t.tableCapacitySuffix(seatsTaken, tbl.capacity)}
                      </span>
                    )}
                  </span>
                  <div className="gm-table-actions">
                    <button type="button" className="gm-table-edit" onClick={() => handleEditCapacity(tbl)} title={t.editCapacityTitle}>
                      ✏️
                    </button>
                    <button type="button" className="gm-table-delete" onClick={() => handleDeleteTable(tbl.id)}>
                      🗑
                    </button>
                  </div>
                </div>
                {guests.length === 0 ? (
                  <p className="gm-table-empty">{t.noGuestsAtTable}</p>
                ) : (
                  <div className="gm-table-visual-wrap">
                    <RoundTable tableNumber={tbl.number} guests={guests} />
                  </div>
                )}
                <select
                  className="gm-table-add-guest"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAssign(Number(e.target.value), tbl.id);
                  }}
                >
                  <option value="">{t.addGuestToTable}</option>
                  {attending
                    .filter((r) => r.tableId !== tbl.id)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.guestName} {r.familyName}
                        {r.tableId ? t.currentlyAtTable(tables.find((x) => x.id === r.tableId)?.number ?? "") : ""}
                      </option>
                    ))}
                </select>
              </div>
            );
          })}

          {rsvps.some((r) => r.attending && !r.tableId) && (
            <div className="gm-unassigned-card">
              <p className="gm-section-title">{t.unassignedTitle}</p>
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
            <p className="gm-hall-qr-title">{t.hallQrTitle}</p>
            <div className="gm-hall-qr-code">
              <QrCode
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/table-lookup/event/${inviteId}`}
                downloadFileName={`QR-${inviteTitle.replace(/[\\/:*?"<>|]+/g, "").trim() || inviteId}`}
              />
            </div>
            <ol className="gm-hall-qr-steps">
              {t.hallQrSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
