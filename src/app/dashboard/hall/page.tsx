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
import { getServerLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/locale";

const COPY = {
  he: {
    pageTitle: "פאנל אולם",
    settingsTitle: "⚙️ הגדרות אולם",
    settingsHint: 'הסרטון והאתר אלה מה שיוצג ללקוחות שלך בחלון ה"הטבה" שאורח רואה אחרי אישור הגעה - שדה ריק פשוט מדלג על אותו חלק.',
    clientsTitle: "👥 הלקוחות שלי",
    noClients: "עדיין לא פתחת חשבון ללקוח.",
    leadsTitle: "📋 לידים",
    noLeads: "אין עדיין לידים.",
    phone: "טלפון",
    eventType: "סוג האירוע",
    requestedDate: "תאריך מבוקש",
    hall: "אולם",
    noName: "—",
    noInviteYet: "עדיין לא יצר/ה הזמנה",
    untitled: "הזמנה ללא כותרת",
    joinWord: "של",
  },
  en: {
    pageTitle: "Venue Panel",
    settingsTitle: "⚙️ Venue settings",
    settingsHint: "The video and website link are what your clients see in the “perk” popup a guest sees after confirming attendance - leaving a field blank simply skips that part.",
    clientsTitle: "👥 My clients",
    noClients: "You haven't opened a client account yet.",
    leadsTitle: "📋 Leads",
    noLeads: "No leads yet.",
    phone: "Phone",
    eventType: "Event type",
    requestedDate: "Requested date",
    hall: "Venue",
    noName: "—",
    noInviteYet: "Hasn't created an invitation yet",
    untitled: "Untitled invitation",
    joinWord: "for",
  },
};

// Same "who/when" a client's invite shows everywhere else (dashboard card,
// guest view) - template mode's own title lines, else the structured
// category headline (wedding/bar-bat-mitzvah/henna), else the legacy
// free-text celebrants/partyType fallback for anything older/uncategorized.
function clientHeadline(client: HallClientRow, locale: Locale): { title: string; date: string } {
  const t = COPY[locale];
  const invite = client.invite;
  if (!invite) return { title: t.noInviteYet, date: "" };
  if (invite.mode === "template" && invite.templateFields) {
    const f = invite.templateFields as unknown as TemplateFields;
    const title = [f.titleLine1, f.titleLine2].filter(Boolean).join(" & ") || t.untitled;
    const date = invite.eventDate ? formatEventDate(invite.eventDate) : f.dateText || "";
    return { title, date };
  }
  const structured = buildHeadline(invite.eventCategory, invite.categoryFields);
  if (structured) {
    return { title: headlineToString(structured), date: invite.eventDate ? formatEventDate(invite.eventDate) : "" };
  }
  const names = invite.celebrants.map((c) => c.name).filter(Boolean).join(locale === "he" ? " ו" : " & ");
  const title = [invite.partyType, names && `${t.joinWord} ${names}`].filter(Boolean).join(" ") || t.untitled;
  return { title, date: invite.eventDate ? formatEventDate(invite.eventDate) : "" };
}

export default async function HallDashboardPage() {
  const locale = await getServerLocale();
  const t = COPY[locale];
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
    <DesktopPhoneWrapper title={t.pageTitle}>
      <div className="admin-page">
        <div className="admin-header">
          <h1>{t.pageTitle}</h1>
          <LogoutButton />
        </div>

        <section className="hall-section">
          <h2 className="hall-section-title">{t.settingsTitle}</h2>
          <p className="hall-section-hint">
            {t.settingsHint}
          </p>
          <HallSettingsForm initialYoutubeUrl={hall?.youtubeUrl ?? ""} initialTourUrl={hall?.tourUrl ?? ""} />
        </section>

        <section className="hall-section">
          <h2 className="hall-section-title">{t.clientsTitle}</h2>
          <HallAddClientForm />
          {clients.length === 0 ? (
            <p className="admin-empty">{t.noClients}</p>
          ) : (
            <div className="admin-card-group">
              {clients.map((c) => {
                const { title, date } = clientHeadline(c, locale);
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
          <h2 className="hall-section-title">{t.leadsTitle}</h2>
          {leads.length === 0 ? (
            <p className="admin-empty">{t.noLeads}</p>
          ) : (
            <div className="admin-card-group">
              {leads.map((l) => (
                <AdminCard key={l.id} title={l.name || t.noName} subtitle={new Date(l.createdAt).toLocaleString(locale === "he" ? "he-IL" : "en-US")}>
                  <AdminCardRow label={t.phone} value={<span dir="ltr">{l.phone}</span>} />
                  {l.eventType && <AdminCardRow label={t.eventType} value={l.eventType} />}
                  {l.eventDate && <AdminCardRow label={t.requestedDate} value={l.eventDate} />}
                  {l.eventVenue && <AdminCardRow label={t.hall} value={l.eventVenue} />}
                </AdminCard>
              ))}
            </div>
          )}
        </section>
      </div>
    </DesktopPhoneWrapper>
  );
}
