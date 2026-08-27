import { notFound } from "next/navigation";
import { findInviteById } from "@/lib/store";
import type { TemplateFields } from "@/lib/templates";
import InviteView from "./InviteView";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const invite = findInviteById(id);

  if (!invite) {
    notFound();
  }

  let headline = "";
  if (invite.mode === "template") {
    const f = invite.templateFields as unknown as TemplateFields | undefined;
    headline = f ? [f.titleLine1, f.titleLine2].filter(Boolean).join(" & ") : "";
  } else {
    const names = invite.celebrants.map((c) => c.name).filter(Boolean).join(" ו");
    headline = [invite.invitedAs, "ל" + invite.partyType, "של " + names, invite.willBe]
      .filter(Boolean)
      .join(" ");
  }

  return (
    <InviteView
      id={invite.id}
      mode={invite.mode}
      imageUrl={invite.imageUrl}
      templateId={invite.templateId}
      templateFields={invite.templateFields as unknown as TemplateFields | undefined}
      headline={headline}
      eventDate={invite.eventDate}
      eventStart={invite.eventStart}
      address={invite.address}
      showNavBtn={invite.showNavBtn}
      wantRsvp={invite.wantRsvp}
    />
  );
}
