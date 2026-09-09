import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listLeads, getInviteOwnerUsername } from "@/lib/store";
import { hasAdminAccess } from "@/lib/superadmin";
import { leadWhatsappHref } from "@/lib/waContact";
import { AdminCard, AdminCardRow } from "@/components/AdminCard";
import AdminMenu from "@/components/AdminMenu";

export default async function AdminLeadsPage() {
  const user = await getCurrentUser();
  if (!(await hasAdminAccess(user))) redirect(user ? "/dashboard" : "/login");

  const leads = await listLeads();
  const ownerByInviteId = new Map(
    await Promise.all(
      [...new Set(leads.map((l) => l.sourceInviteId).filter(Boolean))].map(
        async (inviteId) => [inviteId, await getInviteOwnerUsername(inviteId)] as const
      )
    )
  );

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>לידים</h1>
        <AdminMenu />
      </div>

      <div className="admin-card-group">
        {leads.map((l) => {
          const ownerUsername = l.sourceInviteId ? ownerByInviteId.get(l.sourceInviteId) ?? null : null;
          return (
            <AdminCard
              key={l.id}
              title={l.name || "—"}
              subtitle={new Date(l.createdAt).toLocaleString("he-IL")}
            >
              <AdminCardRow label="טלפון" value={<span dir="ltr">{l.phone}</span>} />
              {l.eventType && <AdminCardRow label="סוג האירוע" value={l.eventType} />}
              {l.eventDate && (
                <AdminCardRow
                  label="תאריך הארוע המבוקש"
                  value={new Date(l.eventDate).toLocaleDateString("he-IL")}
                />
              )}
              {l.eventVenue && <AdminCardRow label="אולם" value={l.eventVenue} />}
              <AdminCardRow
                label="מהזמנה"
                value={l.sourceInviteId ? <Link href={`/i/${l.sourceInviteId}`}>{l.sourceInviteId}</Link> : "—"}
              />
              <a
                className="admin-contact-btn"
                href={leadWhatsappHref(l.phone, l.name, ownerUsername)}
                target="_blank"
                rel="noopener noreferrer"
              >
                💬 צור קשר
              </a>
            </AdminCard>
          );
        })}
      </div>

      {leads.length === 0 && <p className="admin-empty">אין עדיין לידים.</p>}
    </div>
  );
}
