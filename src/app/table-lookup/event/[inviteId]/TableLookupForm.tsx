"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/LanguageProvider";

interface Match {
  guestName: string;
  familyName: string;
  tableNumber: string | null;
}

const COPY = {
  he: {
    genericError: "משהו השתבש, נסו שוב",
    noMatch: (
      <>
        השם או מספר הטלפון שהזנתם אינם תואמים את הפרטים באישור ההגעה 🤔
        <br />
        בדקו שהקלדתם אותם בדיוק כפי שנמסרו, או פנו לצוות באירוע.
      </>
    ),
    searchAgain: "חיפוש נוסף",
    yourTable: "השולחן שלכם הוא",
    notAssignedYet: "עדיין לא שובצתם לשולחן - בואו לבדוק שוב בעוד כמה דקות, או פנו לצוות באירוע 🙂",
    firstName: "שם פרטי",
    lastName: "שם המשפחה",
    phone: "מספר טלפון (כפי שנמסר באישור ההגעה)",
    searching: "מחפש...",
    findMyTable: "מצאו לי שולחן",
  },
  en: {
    genericError: "Something went wrong, please try again",
    noMatch: (
      <>
        The name or phone number you entered doesn&apos;t match the details on the RSVP 🤔
        <br />
        Check that you typed them exactly as given, or ask the event staff.
      </>
    ),
    searchAgain: "Search again",
    yourTable: "Your table is",
    notAssignedYet: "You haven't been assigned a table yet - check back in a few minutes, or ask the event staff 🙂",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone number (as given on the RSVP)",
    searching: "Searching...",
    findMyTable: "Find my table",
  },
};

export default function TableLookupForm({ inviteId }: { inviteId: string }) {
  const { locale } = useLocale();
  const t = COPY[locale];
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
        setError(data?.error || t.genericError);
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
          <p className="lookup-pending">{t.noMatch}</p>
          <button type="button" className="rsvp-choice-btn" onClick={() => setResults(null)}>
            {t.searchAgain}
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
                <p className="lookup-label">{t.yourTable}</p>
                <div className="lookup-table-number">{r.tableNumber}</div>
              </>
            ) : (
              <p className="lookup-pending">{t.notAssignedYet}</p>
            )}
          </div>
        ))}
        <button type="button" className="rsvp-choice-btn" onClick={() => setResults(null)}>
          {t.searchAgain}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="rsvp-field">
        <label>{t.firstName}</label>
        <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
      </div>
      <div className="rsvp-field">
        <label>{t.lastName}</label>
        <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} required />
      </div>
      <div className="rsvp-field">
        <label>{t.phone}</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      {error && <p className="admin-edit-msg admin-edit-msg-error">{error}</p>}
      <button type="submit" className="welcome-alert-cta" disabled={sending}>
        {sending ? t.searching : t.findMyTable}
      </button>
    </form>
  );
}
