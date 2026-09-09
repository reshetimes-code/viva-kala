import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listLeads, getInviteOwnerUsername } from "@/lib/store";
import { hasAdminAccess } from "@/lib/superadmin";
import { leadWhatsappHref } from "@/lib/waContact";
import { AdminCard, AdminCardRow } from "@/components/AdminCard";
import AdminMenu from "@/components/AdminMenu";
import { getServerLocale } from "@/lib/i18n/server";

const COPY = {
  he: {
    title: "לידים",
    phone: "טלפון",
    eventType: "סוג האירוע",
    eventDate: "תאריך הארוע המבוקש",
    venue: "אולם",
    fromInvite: "מהזמנה",
    contact: "💬 צור קשר",
    noLeads: "אין עדיין לידים.",
    dateLocale: "he-IL",
  },
  en: {
    title: "Leads",
    phone: "Phone",
    eventType: "Event type",
    eventDate: "Requested event date",
    venue: "Venue",
    fromInvite: "From invite",
    contact: "💬 Contact",
    noLeads: "No leads yet.",
    dateLocale: "en-US",
  },
};

export default async function AdminLeadsPage() {
  const locale = await getServerLocale();
  const t = COPY[locale];
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
        <h1>{t.title}</h1>
        <AdminMenu />
      </div>

      <div className="admin-card-group">
        {leads.map((l) => {
          const ownerUsername = l.sourceInviteId ? ownerByInviteId.get(l.sourceInviteId) ?? null : null;
          return (
            <AdminCard
              key={l.id}
              title={l.name || "—"}
              subtitle={new Date(l.createdAt).toLocaleString(t.dateLocale)}
            >
              <AdminCardRow label={t.phone} value={<span dir="ltr">{l.phone}</span>} />
              {l.eventType && <AdminCardRow label={t.eventType} value={l.eventType} />}
              {l.eventDate && (
                <AdminCardRow
                  label={t.eventDate}
                  value={new Date(l.eventDate).toLocaleDateString(t.dateLocale)}
                />
              )}
              {l.eventVenue && <AdminCardRow label={t.venue} value={l.eventVenue} />}
              <AdminCardRow
                label={t.fromInvite}
                value={l.sourceInviteId ? <Link href={`/i/${l.sourceInviteId}`}>{l.sourceInviteId}</Link> : "—"}
              />
              <a
                className="admin-contact-btn"
                href={leadWhatsappHref(l.phone, l.name, ownerUsername)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.contact}
              </a>
            </AdminCard>
          );
        })}
      </div>

      {leads.length === 0 && <p className="admin-empty">{t.noLeads}</p>}
    </div>
  );
}
