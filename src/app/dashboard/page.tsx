import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listInvitesByUser, countRsvpsForInvite, listTablesByInvite } from "@/lib/store";
import InviteCard from "./InviteCard";
import DesktopPhoneWrapper from "@/components/DesktopPhoneWrapper";
import BottomNav from "@/components/BottomNav";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Each account owns exactly one invite, so the dashboard is built around
  // that single invite's progress rather than a list of many.
  const invites = listInvitesByUser(user.id).map((inv) => ({
    ...inv,
    rsvpCounts: countRsvpsForInvite(inv.id),
  }));
  const invite = invites[0] ?? null;
  const tableCount = invite ? listTablesByInvite(invite.id).length : 0;
  const hasResponses = !!invite && invite.rsvpCounts.total > 0;

  const steps: Array<{ label: string; status: "done" | "current" | "upcoming"; href?: string; cta?: string }> = invite
    ? [
        { label: "יצרתם את ההזמנה", status: "done" },
        {
          label: "שולחים לאורחים",
          status: hasResponses ? "done" : "current",
          href: `/i/${invite.id}`,
          cta: "פתחו ושתפו",
        },
        {
          label: "אוספים אישורים ומסדרים הושבה",
          status: hasResponses ? "current" : "upcoming",
          href: invite.wantRsvp ? `/dashboard/${invite.id}/guests` : undefined,
          cta: "לניהול אורחים",
        },
      ]
    : [];
  const currentStep = steps.find((s) => s.status === "current");

  return (
    <DesktopPhoneWrapper title="ההזמנה שלי">
      <div className="dash-page">
        <div className="dash-header">
          <h1>ההזמנה שלי</h1>
          {!invite && (
            <Link href="/create" className="dash-new-btn">
              ➕ הזמנה חדשה
            </Link>
          )}
        </div>

        {!invite ? (
          <div className="dash-empty">
            <p>עדיין לא יצרת הזמנה.</p>
            <Link href="/create" className="dash-new-btn">
              צור את ההזמנה הראשונה שלך
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
                <span className="dash-stat-label">אישרו הגעה</span>
              </div>
              <div className="dash-stat-tile">
                <span className="dash-stat-num">{invite.rsvpCounts.total}</span>
                <span className="dash-stat-label">סה&quot;כ תגובות</span>
              </div>
              <div className="dash-stat-tile">
                <span className="dash-stat-num">{tableCount}</span>
                <span className="dash-stat-label">שולחנות</span>
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
