import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { findInviteById } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import type { TemplateFields } from "@/lib/templates";
import { buildHeadline, headlineToString, buildShareGreeting } from "@/lib/categoryFields";
import InviteView from "./InviteView";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const invite = await findInviteById(id);

  if (!invite) {
    notFound();
  }

  // Same link a guest gets, but the owner viewing their own invite (logged
  // in, in the same browser they built it in) gets an extra way back to the
  // dashboard - most people who open this to check on it don't think to
  // hit "back" enough times to find their way there again.
  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === invite.userId;

  // Built here, server-side, instead of InviteView reading
  // window.location.href at render time: that read returns "" during SSR
  // (no window on the server) and only becomes correct after the client
  // hydrates, so the very first paint - including the share text/href a
  // guest gets if they tap "share" before hydration finishes - carried no
  // link at all. A guest actually hit this: the shared WhatsApp message
  // had the whole "confirm and we'll save your seat" pitch but the actual
  // invite link was just... missing. Host + proto here are always
  // present and identical between server and client, so this is right
  // from the first paint, with no hydration gap to fall into. (Also fixes
  // a smaller pre-existing wart: window.location.href on the desktop
  // phone-frame view included the internal "?mobile=true" iframe param.)
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const inviteUrl = host ? `${proto}://${host}/i/${invite.id}` : "";

  // The legacy free-text celebrants list - already collected on every
  // invite regardless of category - doubles as the fallback name source
  // for the share greeting below when there's no tailored category (יום
  // הולדת, אחר) or the structured fields are missing on an older invite.
  const legacyNames = invite.celebrants.map((c) => c.name).filter(Boolean).join(" ו");

  let headline = "";
  let namesForGreeting = "";
  if (invite.mode === "template") {
    const f = invite.templateFields as unknown as TemplateFields | undefined;
    headline = f ? [f.titleLine1, f.titleLine2].filter(Boolean).join(" & ") : "";
    namesForGreeting = f ? [f.titleLine1, f.titleLine2].filter(Boolean).join(" ו") : "";
  } else {
    // Categories with a tailored field set (חתונה/בר-בת-מצווה/חינה) build
    // their headline from structured data; everything else (יום הולדת,
    // אחר, and older invites created before this existed) falls back to
    // the original free-text builder from celebrants/partyType.
    const structured = buildHeadline(invite.eventCategory, invite.categoryFields);
    if (structured) {
      headline = headlineToString(structured);
      namesForGreeting = structured.line1;
    } else {
      headline = [invite.invitedAs, "ל" + invite.partyType, "של " + legacyNames, invite.willBe]
        .filter(Boolean)
        .join(" ");
    }
  }
  // "who is this from" line for the share message - see buildShareGreeting.
  const shareGreeting = buildShareGreeting(invite.eventCategory, namesForGreeting || legacyNames);

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
      isOwner={isOwner}
      inviteUrl={inviteUrl}
      shareGreeting={shareGreeting}
    />
  );
}
