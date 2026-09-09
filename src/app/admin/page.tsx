import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listAllUsersFullDetail } from "@/lib/store";
import { hasAdminAccess } from "@/lib/superadmin";
import { AdminCard, AdminCardRow } from "@/components/AdminCard";
import AdminMenu from "@/components/AdminMenu";
import ImpersonateButton from "@/components/ImpersonateButton";
import DeleteUserButton from "@/components/DeleteUserButton";
import AdminUserPanel from "@/components/AdminUserPanel";
import { getServerLocale } from "@/lib/i18n/server";

const COPY = {
  he: {
    title: "ניהול מערכת",
    joined: (date: string) => `נרשם ב-${date}`,
    designsCreated: "עיצובים שיצר",
    aiAttempts: "נסיונות עיצוב ב-AI",
    attending: "אישרו הגעה",
    tables: "שולחנות",
    details: "פרטים ←",
    noUsers: "אין עדיין משתמשים רשומים.",
    dateLocale: "he-IL",
  },
  en: {
    title: "System management",
    joined: (date: string) => `Joined on ${date}`,
    designsCreated: "Designs created",
    aiAttempts: "AI design attempts",
    attending: "Confirmed attending",
    tables: "Tables",
    details: "Details ←",
    noUsers: "No registered users yet.",
    dateLocale: "en-US",
  },
};

export default async function AdminPage() {
  const locale = await getServerLocale();
  const t = COPY[locale];
  const user = await getCurrentUser();
  if (!(await hasAdminAccess(user))) redirect(user ? "/dashboard" : "/login");

  const users = await listAllUsersFullDetail();

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>{t.title}</h1>
        <AdminMenu />
      </div>

      <div className="admin-card-group">
        {users.map((u) => {
          const inviteCount = u.invites.length;
          const totalAttending = u.invites.reduce((sum, g) => sum + g.totalAttending, 0);
          const totalTables = u.invites.reduce((sum, g) => sum + g.totalTables, 0);
          return (
            <AdminCard
              key={u.user.id}
              title={u.user.username}
              subtitle={t.joined(new Date(u.user.createdAt).toLocaleDateString(t.dateLocale))}
            >
              <AdminCardRow label={t.designsCreated} value={inviteCount} />
              <AdminCardRow label={t.aiAttempts} value={u.user.aiAttempts} />
              <AdminCardRow label={t.attending} value={totalAttending} />
              <AdminCardRow label={t.tables} value={totalTables} />
              <div className="admin-card-actions">
                <Link href={`/admin/users/${u.user.id}`} className="admin-row-link">
                  {t.details}
                </Link>
                <ImpersonateButton userId={u.user.id} />
              </div>
              <div className="admin-card-actions">
                <DeleteUserButton userId={u.user.id} username={u.user.username} />
              </div>

              <AdminUserPanel
                userId={u.user.id}
                username={u.user.username}
                invites={u.invites.map((g) => ({
                  invite: {
                    id: g.invite.id,
                    partyType: g.invite.partyType,
                    templateId: g.invite.templateId,
                    eventDate: g.invite.eventDate,
                  },
                  rsvps: g.rsvps.map((r) => ({
                    id: r.id,
                    guestName: r.guestName,
                    familyName: r.familyName,
                    phone: r.phone,
                    attending: r.attending,
                    guestCount: r.guestCount,
                    tableId: r.tableId,
                  })),
                  tables: g.tables.map((t) => ({ id: t.id, number: t.number })),
                }))}
                leads={u.leads}
              />
            </AdminCard>
          );
        })}
      </div>

      {users.length === 0 && <p className="admin-empty">{t.noUsers}</p>}
    </div>
  );
}
