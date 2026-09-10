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
    accountTypeHall: "עסקי (אולם)",
    accountTypeIndividual: "פרטי",
    accountTypeHallClient: (hallName: string) => `פרטי · לקוח של ${hallName}`,
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
    accountTypeHall: "Business (hall)",
    accountTypeIndividual: "Private",
    accountTypeHallClient: (hallName: string) => `Private · client of ${hallName}`,
  },
};

export default async function AdminPage() {
  const locale = await getServerLocale();
  const t = COPY[locale];
  const user = await getCurrentUser();
  if (!(await hasAdminAccess(user))) redirect(user ? "/dashboard" : "/login");

  const users = await listAllUsersFullDetail();

  // Group each hall's own client accounts (hallId set) directly under that
  // hall in the list - plain created_at-desc order can otherwise scatter a
  // hall and its clients anywhere relative to each other, which reads as
  // confusing once there are more than a couple of accounts (the host's own
  // complaint: no visual link between e.g. "oren1" and the "ilan" hall it
  // was opened under). A user with no hallId keeps its normal chronological
  // slot; right after it, any of ITS clients are spliced in (in their own
  // chronological order) before moving on - so every client always renders
  // as the row(s) immediately below its hall, never above and never
  // separated by other accounts.
  const clientsByHallId = new Map<number, typeof users>();
  for (const u of users) {
    if (!u.user.hallId) continue;
    const list = clientsByHallId.get(u.user.hallId) ?? [];
    list.push(u);
    clientsByHallId.set(u.user.hallId, list);
  }
  const orderedUsers = users.flatMap((u) =>
    u.user.hallId ? [] : [u, ...(clientsByHallId.get(u.user.id) ?? [])]
  );

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>{t.title}</h1>
        <AdminMenu />
      </div>

      <div className="admin-card-group">
        {orderedUsers.map((u) => {
          const inviteCount = u.invites.length;
          const totalAttending = u.invites.reduce((sum, g) => sum + g.totalAttending, 0);
          const totalTables = u.invites.reduce((sum, g) => sum + g.totalTables, 0);
          // "hall" = the venue's own account (a real business); everyone
          // else is a private/individual signup - but one created BY a hall
          // through its own client panel (hallId set) still gets flagged as
          // that hall's client rather than reading as an anonymous private
          // account with no connection to any business.
          const accountBadgeLabel =
            u.user.accountType === "hall"
              ? t.accountTypeHall
              : u.user.hallUsername
                ? t.accountTypeHallClient(u.user.hallUsername)
                : t.accountTypeIndividual;
          return (
            // Indented + a thin gold left border for a hall's client rows -
            // purely visual, but it's what actually makes "grouped right
            // under its hall" readable at a glance once there are many
            // accounts, rather than relying on proximity alone.
            <div key={u.user.id} className={u.user.hallId ? "admin-card-client-wrap" : undefined}>
              <AdminCard
                title={u.user.username}
                subtitle={t.joined(new Date(u.user.createdAt).toLocaleDateString(t.dateLocale))}
                badge={
                  <span className={`admin-card-badge${u.user.accountType === "hall" ? " admin-card-badge-hall" : ""}`}>
                    {accountBadgeLabel}
                  </span>
                }
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
            </div>
          );
        })}
      </div>

      {orderedUsers.length === 0 && <p className="admin-empty">{t.noUsers}</p>}
    </div>
  );
}
