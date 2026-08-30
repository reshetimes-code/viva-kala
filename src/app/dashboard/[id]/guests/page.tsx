import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { findInviteById, listRsvpsByInvite, listTablesByInvite } from "@/lib/store";
import GuestManager from "./GuestManager";
import DesktopPhoneWrapper from "@/components/DesktopPhoneWrapper";
import BottomNav from "@/components/BottomNav";

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

  let title = "";
  if (invite.mode === "template" && invite.templateFields) {
    const f = invite.templateFields as Record<string, string>;
    title = [f.titleLine1, f.titleLine2].filter(Boolean).join(" & ");
  } else {
    const names = invite.celebrants.map((c) => c.name).filter(Boolean).join(" ו");
    title = [invite.partyType, names && `של ${names}`].filter(Boolean).join(" ");
  }

  return (
    <DesktopPhoneWrapper title="אישורי הגעה וסדר הושבה">
      <GuestManager inviteId={id} inviteTitle={title || "ההזמנה שלי"} initialRsvps={rsvps} initialTables={tables} />
      <BottomNav inviteId={id} />
    </DesktopPhoneWrapper>
  );
}
