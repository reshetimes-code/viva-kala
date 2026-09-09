import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { findInviteById, listRsvpsByInvite, listTablesByInvite } from "@/lib/store";
import { getServerLocale } from "@/lib/i18n/server";
import GuestManager from "./GuestManager";
import DesktopPhoneWrapper from "@/components/DesktopPhoneWrapper";
import BottomNav from "@/components/BottomNav";

const COPY = {
  he: {
    wrapperTitle: "אישורי הגעה וסדר הושבה",
    defaultTitle: "ההזמנה שלי",
    namesJoiner: " ו",
    forNames: (names: string) => `של ${names}`,
  },
  en: {
    wrapperTitle: "RSVPs & Seating",
    defaultTitle: "My Invitation",
    namesJoiner: " & ",
    forNames: (names: string) => `for ${names}`,
  },
};

export default async function GuestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const invite = await findInviteById(id);
  if (!invite || invite.userId !== user.id) {
    notFound();
  }

  const rsvps = await listRsvpsByInvite(id);
  const tables = await listTablesByInvite(id);
  const locale = await getServerLocale();
  const t = COPY[locale];

  let title = "";
  if (invite.mode === "template" && invite.templateFields) {
    const f = invite.templateFields as Record<string, string>;
    title = [f.titleLine1, f.titleLine2].filter(Boolean).join(" & ");
  } else {
    const names = invite.celebrants.map((c) => c.name).filter(Boolean).join(t.namesJoiner);
    title = [invite.partyType, names && t.forNames(names)].filter(Boolean).join(" ");
  }

  return (
    <DesktopPhoneWrapper title={t.wrapperTitle}>
      <GuestManager inviteId={id} inviteTitle={title || t.defaultTitle} initialRsvps={rsvps} initialTables={tables} />
      <BottomNav inviteId={id} />
    </DesktopPhoneWrapper>
  );
}
