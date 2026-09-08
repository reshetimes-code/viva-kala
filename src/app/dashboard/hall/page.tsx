import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { listClientsForHall, listLeadsForHall, findUserById, type HallClientRow } from "@/lib/store";
import { buildHeadline, headlineToString, formatEventDate } from "@/lib/categoryFields";
import type { TemplateFields } from "@/lib/templates";
import DesktopPhoneWrapper from "@/components/DesktopPhoneWrapper";
import LogoutButton from "@/components/LogoutButton";
import HallSettingsForm from "@/components/HallSettingsForm";
import HallAddClientForm from "@/components/HallAddClientForm";
import HallClientCard from "@/components/HallClientCard";
import { AdminCard, AdminCardRow } from "@/components/AdminCard";

// Same "who/when" a client's invite shows everywhere else (dashboard card,
// guest view) - template mode's own title lines, else the structured
// category headline (wedding/bar-bat-mitzvah/henna), else the legacy
// free-text celebrants/partyType fallback for anything older/uncategorized.
function clientHeadline(client: HallClientRow): { title: string; date: string } {
  const invite = client.invite;
  if (!invite) return { title: "עדיין לא יצר/ה הזמנה", date: "" };
  if (invite.mode === "template" && invite.templateFields) {
    const f = invite.templateFields as unknown as TemplateFields;
    const title = [f.titleLine1, f.titleLine2].filter(Boolean).join(" & ") || "הזמנה ללא כותרת";
    const date = invite.eventDate ? formatEventDate(invite.eventDate) : f.dateText || "";
    return { title, date };
  }
  const structured = buildHeadline(invite.eventCategory, invite.categoryFields);
  if (structured) {
    return { title: headlineToString(structured), date: invite.eventDate ? formatEventDate(invite.eventDate) : "" };
  }
  const names = invite.celebrants.map((c) => c.name).filter(Boolean).join(" ו");
  const title = [invite.partyType, names && `של ${names}`].filter(Boolean).join(" ") || "הזמנה ללא כותרת";
  return { title, date: invite.eventDate ? formatEventDate(invite.eventDate) : "" };
}

export default async function HallDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.accountType !== "hall") redirect("/dashboard");

  const [hall, clients, leads] = await Promise.all([
    findUserById(user.id),
    listClientsForHall(user.id),
    listLeadsForHall(user.id),
  ]);

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const originForLinks = host ? `${proto}://${host}` : "";

  return (
    <DesktopPhoneWrapper title="פאנל אולם">
      <div className="admin-page">
        <div className="admin-header">
          <h1>פאנל אולם</h1>
          <LogoutButton />
        </div>

        <section className="hall-section">
          <h2 className="hall-section-title">⚙️ הגדרות אולם</h2>
          <p className="hall-section-hint">
            סרטון ואתר סיור אלה מה שיוצג ללקוחות שלך בחלון ה&quot;הטבה&quot; שאורח רואה אחרי אישור הגעה - שדה ריק פשוט מדלג על אותו חלק.
          </p>
          <HallSettingsForm initialYoutubeUrl={hall?.youtubeUrl ?? ""} initialTourUrl={hall?.tourUrl ?? ""} />
        </section>

        <section className="hall-section">
          <h2 className="hall-section-title">👥 הלקוחות שלי</h2>
          <HallAddClientForm />
          {clients.length === 0 ? (
            <p className="admin-empty">עדיין לא פתחת חשבון ללקוח.</p>
          ) : (
            <div className="admin-card-group">
              {clients.map((c) => {
                const { title, date } = clientHeadline(c);
                return (
                  <HallClientCard
                    key={c.userId}
                    username={c.username}
                    title={title}
                    date={date}
                    venue={c.invite?.address || ""}
                    rsvpTotal={c.rsvpCounts.total}
                    rsvpAttending={c.rsvpCounts.attending}
                    tableCount={c.tableCount}
                    inviteUrl={c.invite ? `${originForLinks}/i/${c.invite.id}` : undefined}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className="hall-section">
          <h2 className="hall-section-title">📋 לידים</h2>
          {leads.length === 0 ? (
            <p className="admin-empty">אין עדיין לידים.</p>
          ) : (
            <div className="admin-card-group">
              {leads.map((l) => (
                <AdminCard key={l.id} title={l.name || "—"} subtitle={new Date(l.createdAt).toLocaleString("he-IL")}>
                  <AdminCardRow label="טלפון" value={<span dir="ltr">{l.phone}</span>} />
                  {l.eventType && <AdminCardRow label="סוג האירוע" value={l.eventType} />}
                  {l.eventDate && <AdminCardRow label="תאריך מבוקש" value={l.eventDate} />}
                  {l.eventVenue && <AdminCardRow label="אולם" value={l.eventVenue} />}
                </AdminCard>
              ))}
            </div>
          )}
        </section>
      </div>
    </DesktopPhoneWrapper>
  );
}
