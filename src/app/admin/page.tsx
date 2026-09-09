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

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!(await hasAdminAccess(user))) redirect(user ? "/dashboard" : "/login");

  const users = await listAllUsersFullDetail();

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>ניהול מערכת</h1>
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
              subtitle={`נרשם ב-${new Date(u.user.createdAt).toLocaleDateString("he-IL")}`}
            >
              <AdminCardRow label="עיצובים שיצר" value={inviteCount} />
              <AdminCardRow label="נסיונות עיצוב ב-AI" value={u.user.aiAttempts} />
              <AdminCardRow label="אישרו הגעה" value={totalAttending} />
              <AdminCardRow label="שולחנות" value={totalTables} />
              <div className="admin-card-actions">
                <Link href={`/admin/users/${u.user.id}`} className="admin-row-link">
                  פרטים ←
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

      {users.length === 0 && <p className="admin-empty">אין עדיין משתמשים רשומים.</p>}
    </div>
  );
}
