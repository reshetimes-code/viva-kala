import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser, listLeads, getInviteOwnerUsername } from "@/lib/store";
import DesktopPhoneWrapper from "@/components/DesktopPhoneWrapper";
import { AdminCard, AdminCardRow } from "@/components/AdminCard";
import AdminMenu from "@/components/AdminMenu";

// Turns a stored phone number into the digit string wa.me expects (Israeli
// local numbers need the 0 swapped for the 972 country code).
function toWaDigits(phone: string) {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = "972" + digits.slice(1);
  return digits;
}

function contactMessage(guestName: string, ownerUsername: string | null) {
  const name = guestName || "שם";
  const owner = ownerUsername || "אחד האירועים במערכת";
  return `שלום ${name}, נעים מאוד! אנחנו חוזרים אליכם בעקבות הפרטים שהשארתם, במערכת אישורי ההגעה מהאירוע של ${owner}, לגבי אירוע שאתם חוגגים בקרוב. האם תרצו לקבל פרטים מלאים מאיתנו?`;
}

export default async function AdminLeadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdminUser(user)) redirect("/dashboard");

  const leads = await listLeads();
  const ownerByInviteId = new Map(
    await Promise.all(
      [...new Set(leads.map((l) => l.sourceInviteId).filter(Boolean))].map(
        async (inviteId) => [inviteId, await getInviteOwnerUsername(inviteId)] as const
      )
    )
  );

  return (
    <DesktopPhoneWrapper title="לידים">
      <div className="admin-page">
        <div className="admin-header">
          <h1>לידים</h1>
          <AdminMenu />
        </div>

        <div className="admin-card-group">
          {leads.map((l) => {
            const ownerUsername = l.sourceInviteId ? ownerByInviteId.get(l.sourceInviteId) ?? null : null;
            const waHref = `https://wa.me/${toWaDigits(l.phone)}?text=${encodeURIComponent(
              contactMessage(l.name, ownerUsername)
            )}`;
            return (
              <AdminCard
                key={l.id}
                title={l.name || "—"}
                subtitle={new Date(l.createdAt).toLocaleString("he-IL")}
              >
                <AdminCardRow label="טלפון" value={<span dir="ltr">{l.phone}</span>} />
                <AdminCardRow
                  label="מהזמנה"
                  value={l.sourceInviteId ? <Link href={`/i/${l.sourceInviteId}`}>{l.sourceInviteId}</Link> : "—"}
                />
                <a className="admin-contact-btn" href={waHref} target="_blank" rel="noopener noreferrer">
                  💬 צור קשר
                </a>
              </AdminCard>
            );
          })}
        </div>

        {leads.length === 0 && <p className="admin-empty">אין עדיין לידים.</p>}
      </div>
    </DesktopPhoneWrapper>
  );
}
