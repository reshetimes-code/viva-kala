import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listInvitesByUser, countRsvpsForInvite, listTablesByInvite } from "@/lib/store";
import InviteCard from "./InviteCard";
import DesktopPhoneWrapper from "@/components/DesktopPhoneWrapper";
import BottomNav from "@/components/BottomNav";
import LogoutButton from "@/components/LogoutButton";
import { getServerLocale } from "@/lib/i18n/server";

const COPY = {
  he: {
    pageTitle: "ההזמנה שלי",
    emptyTitle: "עדיין לא יצרתם הזמנה",
    emptySub: "כל מה שצריך כדי להתחיל לחגוג - כמה דקות ואתם עם הזמנה דיגיטלית מעוצבת ומוכנה לשליחה.",
    emptyCta: "בו נתחיל ליצור את ההזמנה לארוע",
    stepCreated: "יצרתם את ההזמנה",
    stepSend: "שולחים לאורחים",
    stepSendCta: "פתחו ושתפו",
    stepRsvp: "אוספים אישורים ומסדרים הושבה",
    stepRsvpCta: "לניהול אורחים",
    statAttending: "אישרו הגעה",
    statTotal: 'סה"כ תגובות',
    statTables: "שולחנות",
  },
  en: {
    pageTitle: "My Invitation",
    emptyTitle: "You haven't created an invitation yet",
    emptySub: "Everything you need to start celebrating - a few minutes and you'll have a beautifully designed digital invitation, ready to send.",
    emptyCta: "Let's start creating your event invitation",
    stepCreated: "You created the invitation",
    stepSend: "Send to guests",
    stepSendCta: "Open & share",
    stepRsvp: "Collect RSVPs & arrange seating",
    stepRsvpCta: "Manage guests",
    statAttending: "Confirmed",
    statTotal: "Total responses",
    statTables: "Tables",
  },
};

export default async function DashboardPage() {
  const locale = await getServerLocale();
  const t = COPY[locale];
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  // A hall account manages its clients' invites, not "one invite of its
  // own" the way every other account here does - the empty-state/single-
  // invite dashboard below makes no sense for it.
  if (user.accountType === "hall") {
    redirect("/dashboard/hall");
  }

  // Each account owns exactly one invite, so the dashboard is built around
  // that single invite's progress rather than a list of many.
  const userInvites = await listInvitesByUser(user.id);
  const invites = await Promise.all(
    userInvites.map(async (inv) => ({
      ...inv,
      rsvpCounts: await countRsvpsForInvite(inv.id),
    }))
  );
  const invite = invites[0] ?? null;
  const tableCount = invite ? (await listTablesByInvite(invite.id)).length : 0;
  const hasResponses = !!invite && invite.rsvpCounts.total > 0;

  const steps: Array<{ label: string; status: "done" | "current" | "upcoming"; href?: string; cta?: string }> = invite
    ? [
        { label: t.stepCreated, status: "done" },
        {
          label: t.stepSend,
          status: hasResponses ? "done" : "current",
          href: `/i/${invite.id}`,
          cta: t.stepSendCta,
        },
        {
          label: t.stepRsvp,
          status: hasResponses ? "current" : "upcoming",
          href: invite.wantRsvp ? `/dashboard/${invite.id}/guests` : undefined,
          cta: t.stepRsvpCta,
        },
      ]
    : [];
  const currentStep = steps.find((s) => s.status === "current");

  return (
    <DesktopPhoneWrapper title={t.pageTitle}>
      <div className="dash-page">
        <div className="dash-header">
          <h1>{t.pageTitle}</h1>
          <LogoutButton />
        </div>

        {!invite ? (
          <div className="dash-empty dash-empty-hero">
            <div className="dash-empty-icon">💌</div>
            <p className="dash-empty-title">{t.emptyTitle}</p>
            <p className="dash-empty-sub">{t.emptySub}</p>
            <Link href="/create/image" className="dash-new-btn dash-new-btn-hero">
              {t.emptyCta}
            </Link>
          </div>
        ) : (
          <>
            <div className="dash-steps">
              <div className="dash-steps-row">
                {steps.map((s, i) => (
                  <div key={s.label} className={`dash-step is-${s.status}`}>
                    <div className="dash-step-top">
                      <span className="dash-step-circle">{s.status === "done" ? "✓" : i + 1}</span>
                      {i < steps.length - 1 && <span className="dash-step-line" />}
                    </div>
                    <p className="dash-step-label">{s.label}</p>
                  </div>
                ))}
              </div>

              {currentStep?.href && (
                <Link href={currentStep.href} className="dash-step-main-cta">
                  {currentStep.cta} ←
                </Link>
              )}
            </div>

            <div className="dash-stats">
              <div className="dash-stat-tile">
                <span className="dash-stat-num">{invite.rsvpCounts.attending}</span>
                <span className="dash-stat-label">{t.statAttending}</span>
              </div>
              <div className="dash-stat-tile">
                <span className="dash-stat-num">{invite.rsvpCounts.total}</span>
                <span className="dash-stat-label">{t.statTotal}</span>
              </div>
              <div className="dash-stat-tile">
                <span className="dash-stat-num">{tableCount}</span>
                <span className="dash-stat-label">{t.statTables}</span>
              </div>
            </div>

            <div className="dash-grid">
              <InviteCard invite={invite} />
            </div>
          </>
        )}
      </div>

      {invite && <BottomNav inviteId={invite.id} />}
    </DesktopPhoneWrapper>
  );
}
