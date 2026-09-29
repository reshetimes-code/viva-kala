import { NextResponse } from "next/server";
import { findInviteById } from "@/lib/store";
import { buildInviteIcs } from "@/lib/calendarLink";
import { buildHeadline, headlineToString } from "@/lib/categoryFields";
import type { TemplateFields } from "@/lib/templates";

// Public - the "add to calendar" button on the RSVP thank-you screen links
// straight here, same as the table-lookup pages, no session required.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invite = await findInviteById(id);
  if (!invite) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Mirrors the headline built in src/app/i/[id]/page.tsx for the on-screen
  // guest card - kept in sync by hand since it's a small, stable mapping;
  // see that file if this one ever needs to change.
  let title = "";
  if (invite.mode === "template") {
    const f = invite.templateFields as unknown as TemplateFields | undefined;
    title = f ? [f.titleLine1, f.titleLine2].filter(Boolean).join(" & ") : "";
  } else {
    const structured = buildHeadline(invite.eventCategory, invite.categoryFields);
    if (structured) {
      title = headlineToString(structured);
    } else {
      const legacyNames = invite.celebrants.map((c) => c.name).filter(Boolean).join(" ו");
      title = [invite.invitedAs, "ל" + invite.partyType, "של " + legacyNames, invite.willBe]
        .filter(Boolean)
        .join(" ");
    }
  }

  const venueText = invite.mode === "template" ? invite.templateFields?.venueText : undefined;
  const ics = buildInviteIcs({
    uid: invite.id,
    title: title || "האירוע שלכם",
    eventDate: invite.eventDate,
    eventStart: invite.eventStart,
    location: invite.address || venueText || "",
  });

  if (!ics) {
    return NextResponse.json({ error: "No event date set" }, { status: 400 });
  }

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // "inline" (not "attachment") is what lets iOS/Android Safari and
      // Chrome offer the native "add to calendar" sheet directly instead of
      // just downloading a file the guest then has to go find and open.
      "Content-Disposition": 'inline; filename="event.ics"',
    },
  });
}
