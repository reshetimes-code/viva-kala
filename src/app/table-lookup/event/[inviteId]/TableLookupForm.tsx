"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/LanguageProvider";

interface Match {
  guestName: string;
  familyName: string;
  tableNumber: string | null;
}

// After this many phone-only misses in a row, the form gives up on phone
// alone and also asks for the guest's name (see handleSubmit) - a typo'd
// digit or a phone registered under a slightly different format shouldn't
// leave a guest stuck with no way in at the door.
const MAX_PHONE_ONLY_ATTEMPTS = 2;

const COPY = {
  he: {
    genericError: "משהו השתבש, נסו שוב",
    noMatch: (
      <>
        השם או מספר הטלפון שהזנתם אינם תואמים את הפרטים באישור ההגעה 🤔
        <br />
        בדקו במיוחד את מספר הטלפון - שהקלדתם אותו (ואת השם) בדיוק כפי שנמסרו, או פנו לצוות באירוע.
      </>
    ),
    phoneNotFoundRetry: "לא מצאנו מספר טלפון כזה - בדקו שהקלדתם נכון ונסו שוב",
    needNameHint: "לא הצלחנו למצוא אתכם לפי הטלפון בלבד - בואו ננסה גם עם השם",
    searchAgain: "חיפוש נוסף",
    yourTable: "השולחן שלכם הוא",
    notAssignedYet: "עדיין לא שובצתם לשולחן - בואו לבדוק שוב בעוד כמה דקות, או פנו לצוות באירוע 🙂",
    firstName: "שם פרטי",
    lastName: "שם המשפחה",
    phone: "מספר טלפון (כפי שנמסר באישור ההגעה)",
    phoneInvalid: "מספר טלפון לא תקין (חייב 10 ספרות)",
    searching: "מחפש...",
    findMyTable: "מצאו לי שולחן",
  },
  en: {
    genericError: "Something went wrong, please try again",
    noMatch: (
      <>
        The name or phone number you entered doesn&apos;t match the details on the RSVP 🤔
        <br />
        Double-check the phone number especially - that it (and the name) was typed exactly as given, or ask the event staff.
      </>
    ),
    phoneNotFoundRetry: "We couldn't find that phone number - double-check it and try again",
    needNameHint: "We couldn't find you by phone alone - let's also try your name",
    searchAgain: "Search again",
    yourTable: "Your table is",
    notAssignedYet: "You haven't been assigned a table yet - check back in a few minutes, or ask the event staff 🙂",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone number (as given on the RSVP)",
    phoneInvalid: "Invalid phone number (must be 10 digits)",
    searching: "Searching...",
    findMyTable: "Find my table",
  },
};

export default function TableLookupForm({ inviteId }: { inviteId: string }) {
  const { locale } = useLocale();
  const t = COPY[locale];
  // Phone is the primary (and, at first, only) identifier - see
  // findRsvpByPhone's doc comment for why that's normally enough on its
  // own. Name fields only appear once phone-only lookups have failed
  // MAX_PHONE_ONLY_ATTEMPTS times in a row.
  const [needsName, setNeedsName] = useState(false);
  const [phoneMisses, setPhoneMisses] = useState(0);
  const [guestName, setGuestName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Match[] | null>(null);

  const phoneInvalid = phone.trim() !== "" && phone.replace(/\D/g, "").length !== 10;

  function resetSearch() {
    setResults(null);
    setNeedsName(false);
    setPhoneMisses(0);
    setGuestName("");
    setFamilyName("");
    setPhone("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length !== 10) {
      setError(t.phoneInvalid);
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/table-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(needsName ? { inviteId, guestName, familyName, phone } : { inviteId, phone }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || t.genericError);
        return;
      }
      const found: Match[] = data.results ?? [];
      if (found.length === 0 && !needsName) {
        const misses = phoneMisses + 1;
        setPhoneMisses(misses);
        if (misses >= MAX_PHONE_ONLY_ATTEMPTS) {
          setNeedsName(true);
        } else {
          setError(t.phoneNotFoundRetry);
        }
        return;
      }
      setResults(found);
    } finally {
      setSending(false);
    }
  }

  if (results) {
    if (results.length === 0) {
      return (
        <div>
          <p className="lookup-pending">{t.noMatch}</p>
          <button type="button" className="rsvp-choice-btn" onClick={resetSearch}>
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
        <button type="button" className="rsvp-choice-btn" onClick={resetSearch}>
          {t.searchAgain}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {needsName && (
        <>
          <p className="lookup-hint lookup-field">{t.needNameHint}</p>
          <div className="rsvp-field lookup-field">
            <label>{t.firstName}</label>
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
          </div>
          <div className="rsvp-field lookup-field">
            <label>{t.lastName}</label>
            <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} required />
          </div>
        </>
      )}
      <div className="rsvp-field lookup-field">
        <label>{t.phone}</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" required />
        {phoneInvalid && <p className="rsvp-field-error">{t.phoneInvalid}</p>}
      </div>
      {error && <p className="admin-edit-msg admin-edit-msg-error">{error}</p>}
      <button type="submit" className="welcome-alert-cta" disabled={sending || phoneInvalid}>
        {sending ? t.searching : t.findMyTable}
      </button>
    </form>
  );
}
