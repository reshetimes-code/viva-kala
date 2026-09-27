import { notFound } from "next/navigation";
import { findRsvpByToken, findInviteById, findTableById } from "@/lib/store";
import { getServerLocale } from "@/lib/i18n/server";

const COPY = {
  he: {
    hello: (name: string) => `שלום ${name} 👋`,
    yourTable: "השולחן שלכם הוא",
    notAssignedYet: "עדיין לא שובצתם לשולחן - בואו לבדוק שוב בעוד כמה דקות, או פנו לצוות באירוע 🙂",
  },
  en: {
    hello: (name: string) => `Hello ${name} 👋`,
    yourTable: "Your table is",
    notAssignedYet: "You haven't been assigned a table yet - check back in a few minutes, or ask the event staff 🙂",
  },
};

// The page behind a single GUEST's own personal link (shared with them
// directly, e.g. over WhatsApp) - unlike /table-lookup/event/[inviteId],
// which every guest of an event reaches through the same QR code and has to
// identify themselves in a form, this token already IS that guest's
// identity, so it resolves straight to their table with nothing to type.
export default async function GuestTableLookupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const rsvp = await findRsvpByToken(token);
  if (!rsvp || !rsvp.attending) notFound();

  const invite = await findInviteById(rsvp.inviteId);
  if (!invite) notFound();

  const table = rsvp.tableId ? await findTableById(rsvp.tableId) : undefined;
  const venueText = invite.mode === "template" ? invite.templateFields?.venueText : invite.address;
  const locale = await getServerLocale();
  const t = COPY[locale];

  return (
    <div className="lookup-page">
      <div className="lookup-card">
        <p className="lookup-hello">{t.hello(`${rsvp.guestName} ${rsvp.familyName}`)}</p>
        {table ? (
          <>
            <p className="lookup-label">{t.yourTable}</p>
            <div className="lookup-table-number">{table.number}</div>
          </>
        ) : (
          <p className="lookup-pending">{t.notAssignedYet}</p>
        )}
        {venueText && <p className="lookup-venue">{venueText}</p>}
      </div>
    </div>
  );
}
