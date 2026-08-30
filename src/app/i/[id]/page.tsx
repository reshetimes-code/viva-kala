import { notFound } from "next/navigation";
import { findInviteById } from "@/lib/store";
import type { TemplateFields } from "@/lib/templates";
import { buildHeadline, headlineToString } from "@/lib/categoryFields";
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
    // Categories with a tailored field set (חתונה/בר-בת-מצווה/חינה) build
    // their headline from structured data; everything else (יום הולדת,
    // אחר, and older invites created before this existed) falls back to
    // the original free-text builder from celebrants/partyType.
    const structured = buildHeadline(invite.eventCategory, invite.categoryFields);
    if (structured) {
      headline = headlineToString(structured);
    } else {
      const names = invite.celebrants.map((c) => c.name).filter(Boolean).join(" ו");
      headline = [invite.invitedAs, "ל" + invite.partyType, "של " + names, invite.willBe]
        .filter(Boolean)
        .join(" ");
    }
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
      eventCategory={invite.eventCategory}
      categoryFields={invite.categoryFields}
      textStyle={invite.textStyle}
    />
  );
}
