"use client";

import { useState } from "react";

interface Match {
  guestName: string;
  familyName: string;
  tableNumber: string | null;
}

export default function TableLookupForm({ inviteId }: { inviteId: string }) {
  const [guestName, setGuestName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Match[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    setResults(null);
    try {
      const res = await fetch("/api/table-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, guestName, familyName, phone }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "משהו השתבש, נסו שוב");
        return;
      }
      setResults(data.results ?? []);
    } finally {
      setSending(false);
    }
  }

  if (results) {
    if (results.length === 0) {
      return (
        <div>
          <p className="lookup-pending">
            השם או מספר הטלפון שהזנתם אינם תואמים את הפרטים באישור ההגעה 🤔
            <br />
            בדקו שהקלדתם אותם בדיוק כפי שנמסרו, או פנו לצוות באירוע.
          </p>
          <button type="button" className="rsvp-choice-btn" onClick={() => setResults(null)}>
            חיפוש נוסף
          </button>
        </div>
      );
    }
    return (
      <div>
        {results.map((r, i) => (
          <div key={i} style={{ marginBottom: 18 }}>
            <p className="lookup-hello" style={{ marginBottom: 6 }}>
              {r.guestName} {r.familyName}
            </p>
            {r.tableNumber ? (
              <>
                <p className="lookup-label">השולחן שלכם הוא</p>
                <div className="lookup-table-number">{r.tableNumber}</div>
              </>
            ) : (
              <p className="lookup-pending">עדיין לא שובצתם לשולחן - בואו לבדוק שוב בעוד כמה דקות, או פנו לצוות באירוע 🙂</p>
            )}
          </div>
        ))}
        <button type="button" className="rsvp-choice-btn" onClick={() => setResults(null)}>
          חיפוש נוסף
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="rsvp-field">
        <label>שם פרטי</label>
        <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
      </div>
      <div className="rsvp-field">
        <label>שם המשפחה</label>
        <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} required />
      </div>
      <div className="rsvp-field">
        <label>מספר טלפון (כפי שנמסר באישור ההגעה)</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      {error && <p className="admin-edit-msg admin-edit-msg-error">{error}</p>}
      <button type="submit" className="welcome-alert-cta" disabled={sending}>
        {sending ? "מחפש..." : "מצאו לי שולחן"}
      </button>
    </form>
  );
}
