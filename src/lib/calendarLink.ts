function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

// Arbitrary default length for an event whose end time was never collected
// (this app only asks the host for a start time) - long enough to cover a
// typical wedding/party without claiming a precision we don't have.
const DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000;

/** Builds a minimal RFC 5545 .ics calendar event for the "add to calendar"
 *  button on the RSVP thank-you screen. eventDate is the native
 *  <input type="date"> "YYYY-MM-DD" string already used everywhere else in
 *  this app; eventStart is "HH:MM" (24h), or empty for an all-day event.
 *  Uses a floating local time tagged with a bare TZID (no embedded
 *  VTIMEZONE block) - the same shortcut most "add to calendar" link
 *  generators take, since every major calendar app (Google/Apple/Outlook)
 *  already recognizes the standard "Asia/Jerusalem" IANA name on its own.
 *  Returns "" if eventDate isn't a valid YYYY-MM-DD (nothing to add). */
export function buildInviteIcs(params: {
  uid: string;
  title: string;
  eventDate: string;
  eventStart: string;
  location: string;
}): string {
  const { uid, title, eventDate, eventStart, location } = params;
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(eventDate);
  if (!dateMatch) return "";
  const [, y, mo, d] = dateMatch;

  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(
    now.getUTCHours()
  )}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const timeMatch = /^(\d{2}):(\d{2})$/.exec(eventStart);
  let dtStartLine: string;
  let dtEndLine: string;
  if (timeMatch) {
    const [, h, mi] = timeMatch;
    // Date.UTC here is just a neutral scratch space for date-rollover math
    // (e.g. a 23:00 start + 3h correctly lands on the next calendar day) -
    // these numbers stay wall-clock values tagged with TZID below, never
    // real UTC instants, so the server's own timezone can't skew them.
    const startMs = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
    const end = new Date(startMs + DEFAULT_DURATION_MS);
    const startStamp = `${y}${mo}${d}T${h}${mi}00`;
    const endStamp = `${end.getUTCFullYear()}${pad(end.getUTCMonth() + 1)}${pad(end.getUTCDate())}T${pad(
      end.getUTCHours()
    )}${pad(end.getUTCMinutes())}00`;
    dtStartLine = `DTSTART;TZID=Asia/Jerusalem:${startStamp}`;
    dtEndLine = `DTEND;TZID=Asia/Jerusalem:${endStamp}`;
  } else {
    dtStartLine = `DTSTART;VALUE=DATE:${y}${mo}${d}`;
    dtEndLine = `DTEND;VALUE=DATE:${y}${mo}${d}`;
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VIVA//Invites//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@vivaa.co.il`,
    `DTSTAMP:${dtstamp}`,
    dtStartLine,
    dtEndLine,
    `SUMMARY:${escapeIcsText(title)}`,
  ];
  if (location.trim()) lines.push(`LOCATION:${escapeIcsText(location.trim())}`);
  lines.push(
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:תזכורת לאירוע",
    "TRIGGER:-PT2H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  );
  return lines.join("\r\n");
}
