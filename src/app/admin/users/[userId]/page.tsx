import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isAdminUser, getUserDetail } from "@/lib/store";
import EditUserForm from "./EditUserForm";
import DesktopPhoneWrapper from "@/components/DesktopPhoneWrapper";
import { AdminCard, AdminCardRow } from "@/components/AdminCard";
import AdminMenu from "@/components/AdminMenu";
import ImpersonateButton from "@/components/ImpersonateButton";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const admin = await getCurrentUser();
  if (!admin) redirect("/login");
  if (!isAdminUser(admin)) redirect("/dashboard");

  const { userId } = await params;
  const detail = await getUserDetail(Number(userId));
  if (!detail) notFound();

  return (
    <DesktopPhoneWrapper title={detail.user.username}>
      <div className="admin-page">
        <div className="admin-header">
          <h1>{detail.user.username}</h1>
          <AdminMenu />
        </div>

        <div className="admin-card-actions" style={{ marginBottom: 20 }}>
          <ImpersonateButton userId={detail.user.id} />
        </div>

        <EditUserForm userId={detail.user.id} currentUsername={detail.user.username} />

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
            </AdminCard>
          ))}
        </div>

        {detail.invites.length === 0 && <p className="admin-empty">המשתמש הזה עדיין לא יצר הזמנות.</p>}
      </div>
    </DesktopPhoneWrapper>
  );
}
