// Guards the lead-popup date field (InviteView.tsx) against a well-known iOS
// Safari bug: an empty <input type="date"> fires a "change" event carrying
// TODAY's date the instant its native picker sheet opens - before the guest
// has tapped anything. A real human tap physically can't land before that
// sheet has even finished animating open, so any "change" firing within
// guardMs of the field being focused is that phantom event, not a genuine
// pick, and should be ignored.
//
// Pulled out as a pure function (no DOM, no React) specifically so it can be
// unit-tested directly - see leadDateGuard.test.ts - independent of whether
// a given browser/engine reproduces the native iOS picker chrome at all.
export function isPhantomDateChange(focusedAt: number, firedAt: number, guardMs: number): boolean {
  return firedAt - focusedAt < guardMs;
}

// Long enough to catch the same-tick phantom fire, short enough that a real
// tap - which can't land before the sheet has finished animating open -
// never gets swallowed.
export const LEAD_DATE_GUARD_MS = 200;
