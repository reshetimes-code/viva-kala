import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { getUserDetail } from "@/lib/store";
import { hasAdminAccess } from "@/lib/superadmin";
import EditUserForm from "./EditUserForm";
import { AdminCard, AdminCardRow } from "@/components/AdminCard";
import AdminMenu from "@/components/AdminMenu";
import ImpersonateButton from "@/components/ImpersonateButton";
import DeleteUserButton from "@/components/DeleteUserButton";
import QrCode from "@/components/QrCode";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const admin = await getCurrentUser();
  if (!(await hasAdminAccess(admin))) redirect(admin ? "/dashboard" : "/login");

  const { userId } = await params;
  const detail = await getUserDetail(Number(userId));
  if (!detail) notFound();

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>{detail.user.username}</h1>
        <AdminMenu />
      </div>

        <div className="admin-card-actions" style={{ marginBottom: 20 }}>
          <ImpersonateButton userId={detail.user.id} />
          <DeleteUserButton userId={detail.user.id} username={detail.user.username} redirectTo="/admin" />
        </div>

        <EditUserForm userId={detail.user.id} currentUsername={detail.user.username} />

        <div className="admin-card-group" style={{ marginBottom: 20 }}>
          <AdminCard title="פרטים כלליים" subtitle={`נרשם ב-${new Date(detail.user.createdAt).toLocaleDateString("he-IL")}`}>
            <AdminCardRow label="עיצובים שיצר" value={detail.invites.length} />
            <AdminCardRow label="נסיונות עיצוב ב-AI" value={detail.user.aiAttempts} />
          </AdminCard>
        </div>

        <h2 className="admin-subheading">הזמנות ({detail.invites.length})</h2>

        <div className="admin-card-group">
          {detail.invites.map(({ invite, totalRsvps, totalAttending, totalGuests, totalTables }) => (
            <AdminCard
              key={invite.id}
              title={invite.partyType || invite.templateId || invite.id}
              subtitle={invite.eventDate || "אין תאריך"}
            >
              <AdminCardRow label="תגובות" value={totalRsvps} />
              <AdminCardRow label="אישרו הגעה" value={totalAttending} />
              <AdminCardRow label={'סה"כ אורחים'} value={totalGuests} />
              <AdminCardRow label="שולחנות" value={totalTables} />
              <Link href={`/i/${invite.id}`} className="admin-row-link">
                צפייה ←
              </Link>
              {origin && (
                <div className="admin-qr-block">
                  <QrCode value={`${origin}/i/${invite.id}`} size={140} downloadFileName={`QR-${invite.id}`} />
                </div>
              )}
            </AdminCard>
          ))}
        </div>

      {detail.invites.length === 0 && <p className="admin-empty">המשתמש הזה עדיין לא יצר הזמנות.</p>}
    </div>
  );
}
