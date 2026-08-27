import { notFound } from "next/navigation";
import { findInviteById } from "@/lib/store";
import TableLookupForm from "./TableLookupForm";

// The page behind the single QR code printed for the hall entrance - every
// guest of this one event scans the same code and identifies themselves by
// name to find their own table.
export default async function EventTableLookupPage({
  params,
}: {
  params: Promise<{ inviteId: string }>;
}) {
  const { inviteId } = await params;
  const invite = findInviteById(inviteId);
  if (!invite) notFound();

  const venueText = invite.mode === "template" ? invite.templateFields?.venueText : invite.address;

  return (
    <div className="lookup-page">
      <div className="lookup-card">
        <p className="lookup-hello">מוזמנים לאתר את השולחן שלכם 👋</p>
        <TableLookupForm inviteId={inviteId} />
        {venueText && <p className="lookup-venue">{venueText}</p>}
      </div>
    </div>
  );
}
