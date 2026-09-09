import { notFound } from "next/navigation";
import { findInviteById } from "@/lib/store";
import { getServerLocale } from "@/lib/i18n/server";
import TableLookupForm from "./TableLookupForm";

const COPY = {
  he: {
    hello: "מוזמנים לאתר את השולחן שלכם 👋",
  },
  en: {
    hello: "Find your table 👋",
  },
};

// The page behind the single QR code printed for the hall entrance - every
// guest of this one event scans the same code and identifies themselves by
// name to find their own table.
export default async function EventTableLookupPage({
  params,
}: {
  params: Promise<{ inviteId: string }>;
}) {
  const { inviteId } = await params;
  const invite = await findInviteById(inviteId);
  if (!invite) notFound();

  const venueText = invite.mode === "template" ? invite.templateFields?.venueText : invite.address;
  const locale = await getServerLocale();
  const t = COPY[locale];

  return (
    <div className="lookup-page">
      <div className="lookup-card">
        <p className="lookup-hello">{t.hello}</p>
        <TableLookupForm inviteId={inviteId} />
        {venueText && <p className="lookup-venue">{venueText}</p>}
      </div>
    </div>
  );
}
