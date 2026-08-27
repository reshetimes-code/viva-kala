import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser, listAllUsersWithStats } from "@/lib/store";
import DesktopPhoneWrapper from "@/components/DesktopPhoneWrapper";
import { AdminCard, AdminCardRow } from "@/components/AdminCard";
import AdminMenu from "@/components/AdminMenu";
import ImpersonateButton from "@/components/ImpersonateButton";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdminUser(user)) redirect("/dashboard");

  const users = listAllUsersWithStats();

  return (
    <DesktopPhoneWrapper title="ניהול מערכת">
      <div className="admin-page">
        <div className="admin-header">
          <h1>ניהול מערכת</h1>
          <AdminMenu />
        </div>

        <div className="admin-card-group">
          {users.map((u) => (
            <AdminCard
              key={u.id}
              title={u.username}
              subtitle={`נרשם ב-${new Date(u.createdAt).toLocaleDateString("he-IL")}`}
            >
              <AdminCardRow label="הזמנות" value={u.inviteCount} />
              <AdminCardRow label="אישרו הגעה" value={u.totalAttending} />
              <AdminCardRow label="שולחנות" value={u.totalTables} />
              <div className="admin-card-actions">
                <Link href={`/admin/users/${u.id}`} className="admin-row-link">
                  פרטים ←
                </Link>
                <ImpersonateButton userId={u.id} />
              </div>
            </AdminCard>
          ))}
        </div>

        {users.length === 0 && <p className="admin-empty">אין עדיין משתמשים רשומים.</p>}
      </div>
    </DesktopPhoneWrapper>
  );
}
