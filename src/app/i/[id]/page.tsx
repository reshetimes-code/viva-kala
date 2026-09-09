import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { findInviteById, findUserById, getHallForUser } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n/server";
import type { TemplateFields } from "@/lib/templates";
import { buildHeadline, headlineToString, buildShareGreeting } from "@/lib/categoryFields";
import { TITLE, siteOpenGraph, siteTwitter } from "../../layout";
import InviteView from "./InviteView";

// The root layout's generic description ("יצירת הזמנות דיגיטליות מעוצבות
// לאירועים") makes sense on the marketing homepage, but on a shared invite
// link it competes with the actual WhatsApp message for the recipient's
// attention right above it in the same preview card. Blanking it here leaves
// WhatsApp's preview card with just the title + image, so the eye goes
// straight to the bold "כדי לשריין..." line in the message itself.
//
// Built from siteOpenGraph/siteTwitter (not a bare `{ description: "" }`)
// because Next.js metadata merging is shallow: a segment that sets its own
// openGraph/twitter fully replaces the parent's rather than merging fields,
// so a partial object here would silently drop the og:image too - see the
// comment on siteOpenGraph in app/layout.tsx.
//
// Note: WhatsApp/Facebook/iMessage always show the link's own domain (e.g.
// "vivaa.co.il") under the preview regardless of any meta tag - that part
// isn't something a site can turn off.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    description: "",
    openGraph: { ...siteOpenGraph(locale), description: "" },
    twitter: { ...siteTwitter(locale), description: "" },
  };
}

/** Pulls the 11-char video id out of whatever form a hall pastes in
 *  (youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID, or a bare
 *  id) - the YouTube IFrame Player API (InviteView's lead-video slot) needs
 *  just the id, not a full URL. Returns undefined for anything that isn't
 *  recognizably one of those, so a malformed/empty setting cleanly falls
 *  back to "no video" instead of erroring. */
function extractYouTubeId(url: string): string | undefined {
  const trimmed = url.trim();
  const patterns = [/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/, /^([\w-]{11})$/];
  for (const re of patterns) {
    const m = re.exec(trimmed);
    if (m) return m[1];
  }
  return undefined;
}

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

  // The whole lead-generation popup (the "רגע לפני שממשיכים..." offer, the
  // video+questions, and the post-questions "בהצלחה..."/360-tour card) only
  // makes sense for a hall's own client - a private individual's guests
  // have no reason to be upsold on "your next event" or shown someone
  // else's virtual tour. See getHallForUser for how a client's invite is
  // traced back to "its" hall (accountType==="hall" directly, or via
  // hallId for an account the hall created through its own panel).
  const owner = await findUserById(invite.userId);
  const hall = owner ? await getHallForUser(owner) : undefined;
  const leadVideoId = hall?.youtubeUrl ? extractYouTubeId(hall.youtubeUrl) : undefined;

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
      hallAffiliated={!!hall}
      leadVideoId={leadVideoId}
      leadTourUrl={hall?.tourUrl || undefined}
    />
  );
}
