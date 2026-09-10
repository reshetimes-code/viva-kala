"use client";

import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { TemplateCard, TEMPLATE_CTA_COLORS, type TemplateFields } from "@/lib/templates";
import { wazeUrl, googleMapsUrl } from "@/lib/navLinks";
import { buildHeadline, buildExtraDetailLines, formatEventDate } from "@/lib/categoryFields";
import type { EventCategory } from "@/lib/eventCategories";
import type { TextStyle } from "@/lib/textStyleHeuristic";
import InvitePhotoCard from "@/components/InvitePhotoCard";
import { useLocale } from "@/lib/i18n/LanguageProvider";

const DEFAULT_CTA_COLORS = { bg: "rgba(20,20,25,0.72)", color: "#ffffff" };

// All guest-facing UI chrome for this page - everything EXCEPT the two
// externally-sent pieces called out at their own call sites (the WhatsApp
// share message body, and the canvas-drawn share-image text), which stay
// Hebrew regardless of the viewer's chosen UI language since they're read
// by the host's actual guests, not by whoever is looking at this screen.
const COPY = {
  he: {
    closeAria: "סגירה",
    welcomeSubtitle: "תודה שנכנסתם להזמנה!",
    welcomeEmphasisPre: "כדי לשמור לכם מקום מסודר ",
    welcomeEmphasisHighlight: "בשולחן",
    welcomeEmphasisPost: " באירוע - אנא אשרו הגעה 🙏",
    welcomeCta: "מעבר להזמנה",
    leadThanksFinished: "בהצלחה באירוע הבא שלכם!",
    leadTourPromptLine1: "רוצים להכיר אותנו קצת יותר?",
    leadTourPromptLine2: "מוזמנים לבקר באתר האולם:",
    leadTourBtn: "למעבר לאתר האולם 🌐",
    leadTourThanks: "תודה",
    leadTourNoThanks: "לא תודה",
    leadRepContact: "נציג מטעם האולם יצור קשר בקרוב...",
    leadConfirmDateQ: "זה התאריך?",
    leadConfirmYes: "✓ אישור",
    leadConfirmBack: "התבלבלתי",
    leadDateIntro: "תודה שבחרתם בנו! 🙏",
    leadDateQ: "מה תאריך האירוע?",
    leadEventTypeQ: "סוג האירוע?",
    leadEventTypePlaceholder: "בחרו סוג אירוע",
    eventTypeWedding: "חתונה",
    eventTypeBarMitzvah: "בר מצווה",
    eventTypeBrit: "ברית",
    eventTypeOther: "אחר",
    leadVenueQ: "איזה אולם?",
    leadVenuePlaceholder: "שם האולם",
    leadFinish: "סיים",
    leadSend: "שלחו",
    leadBenefitTitle: "רגע לפני שממשיכים...",
    leadBenefitPrompt: "חוגגים אירוע בקרוב? תרצו לקבל הטבה מיוחדת מאיתנו?",
    leadWantsYes: "כן, רוצה!",
    leadWantsNo: "לא, תודה",
    tourTitle: "אתר האולם",
    tourBack: "← חזור להזמנה",
    imageAlt: "הזמנה",
    pullCta: "אשרו הגעה כאן",
    backToInvite: "צפייה בהזמנה",
    thanksYes: "תודה שאישרתם הגעה!",
    thanksNo: "תודה על התגובה",
    atHour: "בשעה",
    navWaze: "ניווט ב-Waze",
    navMaps: "ניווט ב-Maps",
    rsvpTitle: "אנא אשרו הגעתכם",
    rsvpSubtitle: "ונוכל לסדר לכם מקום שמור בשולחן",
    firstNameLabel: "שם פרטי *",
    lastNameLabel: "שם המשפחה *",
    phoneLabel: "טלפון (ספרות בלבד) *",
    phonePlaceholder: "05XXXXXXXX",
    phoneInvalid: "מספר טלפון לא תקין (חייב 10 ספרות)",
    guestCountLabel: "כמה מגיעים?",
    decreaseGuestAria: "הפחתת אורח",
    increaseGuestAria: "הוספת אורח",
    rsvpChoiceLabel: "מגיעים לאירוע? (הבחירה שולחת את הטופס)",
    rsvpNo: "לא",
    rsvpYes: "כן",
    ownerBackTitle: "חזרה לפאנל הניהול",
    shareFab: "📤 שתפו",
    shareTitle: "שתפו את ההזמנה",
    shareImageBadge: "⭐ הכי משכנע",
    shareImageBusy: "מכינים תמונה...",
    shareImageCta: "📸 שיתוף עם תמונה גדולה",
    shareWhatsapp: "וואטסאפ",
    shareWhatsappContact: "וואטסאפ זר",
    shareSms: "SMS",
    shareCopyLink: "העתקת קישור",
    shareWhatsappTitle: "שליחה בוואטסאפ",
    whatsNumberLabel: "מספר הטלפון של איש הקשר",
    whatsNumberPlaceholder: "05X-XXXXXXX",
    whatsNumberCancel: "ביטול",
    whatsNumberSubmit: "פתחו וואטסאפ",
    missingDetailsTitle: "חסרים פרטים",
    missingDetailsText: "נא למלא שם פרטי, שם משפחה וטלפון כדי לאשר הגעה",
    gotIt: "הבנתי",
    invalidPhoneTitle: "מספר טלפון לא תקין",
    invalidPhoneText: "נא להזין מספר טלפון תקין בן 10 ספרות (לדוגמה: 0501234567)",
    rsvpSaveFailedTitle: "לא הצלחנו לשמור את אישור ההגעה",
    rsvpSaveFailedText: "בדקו את הפרטים ונסו שוב, או פנו לצוות האירוע",
    rsvpSavedTitle: "שמרנו לכם את השולחן!",
    rsvpSavedText: "באולם יוצג לכם מיקום השולחן השמור עבורכם",
    great: "מעולה",
    imageDownloadedTitle: "התמונה ירדה למחשב שלכם",
    imageDownloadedText: "עכשיו פותחים וואטסאפ עם ההודעה מוכנה - צרפו אליה את התמונה שהורדתם",
    desktopTitle: "ההזמנה הדיגיטלית שלכם",
  },
  en: {
    closeAria: "Close",
    welcomeSubtitle: "Thanks for opening the invitation!",
    welcomeEmphasisPre: "To save you a proper seat ",
    welcomeEmphasisHighlight: "at the table",
    welcomeEmphasisPost: " for the event - please confirm your attendance 🙏",
    welcomeCta: "Go to invitation",
    leadThanksFinished: "Good luck with your own event!",
    leadTourPromptLine1: "Want to get to know us a bit more?",
    leadTourPromptLine2: "Feel free to visit the venue's website:",
    leadTourBtn: "Visit venue website 🌐",
    leadTourThanks: "Thanks",
    leadTourNoThanks: "No thanks",
    leadRepContact: "A venue representative will be in touch soon...",
    leadConfirmDateQ: "Is this the date?",
    leadConfirmYes: "✓ Confirm",
    leadConfirmBack: "Let me redo that",
    leadDateIntro: "Thank you for choosing us! 🙏",
    leadDateQ: "What's the event date?",
    leadEventTypeQ: "Type of event?",
    leadEventTypePlaceholder: "Choose event type",
    eventTypeWedding: "Wedding",
    eventTypeBarMitzvah: "Bar/Bat Mitzvah",
    eventTypeBrit: "Brit",
    eventTypeOther: "Other",
    leadVenueQ: "Which venue?",
    leadVenuePlaceholder: "Venue name",
    leadFinish: "Finish",
    leadSend: "Send",
    leadBenefitTitle: "Just before you go...",
    leadBenefitPrompt: "Celebrating an event soon? Want a special offer from us?",
    leadWantsYes: "Yes, I'd love that!",
    leadWantsNo: "No, thanks",
    tourTitle: "Venue website",
    tourBack: "← Back to invitation",
    imageAlt: "Invitation",
    pullCta: "Confirm attendance here",
    backToInvite: "View invitation",
    thanksYes: "Thanks for confirming your attendance!",
    thanksNo: "Thanks for your response",
    atHour: "at",
    navWaze: "Navigate with Waze",
    navMaps: "Navigate with Maps",
    rsvpTitle: "Please confirm your attendance",
    rsvpSubtitle: "So we can arrange a reserved seat for you at the table",
    firstNameLabel: "First name *",
    lastNameLabel: "Last name *",
    phoneLabel: "Phone (digits only) *",
    phonePlaceholder: "05XXXXXXXX",
    phoneInvalid: "Invalid phone number (must be 10 digits)",
    guestCountLabel: "How many are coming?",
    decreaseGuestAria: "Decrease guest count",
    increaseGuestAria: "Increase guest count",
    rsvpChoiceLabel: "Attending the event? (your choice submits the form)",
    rsvpNo: "No",
    rsvpYes: "Yes",
    ownerBackTitle: "Back to management panel",
    shareFab: "📤 Share",
    shareTitle: "Share the invitation",
    shareImageBadge: "⭐ Most persuasive",
    shareImageBusy: "Preparing image...",
    shareImageCta: "📸 Share with large image",
    shareWhatsapp: "WhatsApp",
    shareWhatsappContact: "WhatsApp (other number)",
    shareSms: "SMS",
    shareCopyLink: "Copy link",
    shareWhatsappTitle: "Send via WhatsApp",
    whatsNumberLabel: "Contact's phone number",
    whatsNumberPlaceholder: "05X-XXXXXXX",
    whatsNumberCancel: "Cancel",
    whatsNumberSubmit: "Open WhatsApp",
    missingDetailsTitle: "Missing details",
    missingDetailsText: "Please fill in first name, last name and phone to confirm attendance",
    gotIt: "Got it",
    invalidPhoneTitle: "Invalid phone number",
    invalidPhoneText: "Please enter a valid 10-digit phone number (e.g. 0501234567)",
    rsvpSaveFailedTitle: "We couldn't save your RSVP",
    rsvpSaveFailedText: "Please check the details and try again, or contact the event team",
    rsvpSavedTitle: "We've saved your table!",
    rsvpSavedText: "Your reserved table location will be shown at the venue",
    great: "Great",
    imageDownloadedTitle: "The image downloaded to your device",
    imageDownloadedText: "Now opening WhatsApp with the message ready - attach the image you downloaded to it",
    desktopTitle: "Your digital invitation",
  },
} as const;

interface Props {
  id: string;
  mode: "image" | "template";
  imageUrl: string;
  templateId?: string;
  templateFields?: TemplateFields;
  headline: string;
  eventDate: string;
  eventStart: string;
  address: string;
  showNavBtn: boolean;
  wantRsvp: boolean;
  eventCategory?: EventCategory;
  categoryFields?: Record<string, string>;
  textStyle?: TextStyle;
  /** True when the logged-in visitor is this invite's own owner (not a
   *  guest) - shows the extra "back to my dashboard" button below. */
  isOwner?: boolean;
  /** The canonical https://host/i/{id} link for this invite, built
   *  server-side from the request's own host header - see the comment at
   *  its call site in page.tsx for why this can't just be read from
   *  window.location.href inside this component. Empty only if the host
   *  header was somehow missing, in which case share falls back to
   *  window.location.href. */
  inviteUrl?: string;
  /** "ברוכים הבאים לחתונה של דניאל ואמה!" - opening line of the WhatsApp
   *  share message, built server-side (see page.tsx) from the couple's/
   *  celebrant's actual name so a guest who got the link forwarded along
   *  knows immediately whose event it is. Empty when no name could be
   *  resolved - the share message then just skips straight to the seating
   *  line, same as before this existed. */
  shareGreeting?: string;
  /** Whether this invite's owner traces back to an event hall (either a
   *  hall's own direct invite, or one of that hall's clients - see
   *  getHallForUser in page.tsx) - the entire lead-generation popup below
   *  ("רגע לפני שממשיכים...", the video+questions, "בהצלחה...") is gated on
   *  this: a private individual client's guests never see it at all. */
  hallAffiliated?: boolean;
  /** The hall's own promo-video YouTube id (see extractYouTubeId in
   *  page.tsx) - undefined skips the video player but still shows the
   *  date/type/venue questions below where it would have been. */
  leadVideoId?: string;
  /** The hall's own virtual-tour link - undefined/empty skips the whole
   *  "בהצלחה באירוע הבא שלכם!" + tour-button card entirely, closing the
   *  popup right after "סיים" instead. */
  leadTourUrl?: string;
}

export default function InviteView({
  id,
  mode,
  imageUrl,
  templateId,
  templateFields,
  headline,
  eventDate,
  eventStart,
  address,
  showNavBtn,
  wantRsvp,
  eventCategory,
  categoryFields,
  textStyle,
  isOwner,
  inviteUrl,
  shareGreeting,
  hallAffiliated,
  leadVideoId,
  leadTourUrl,
}: Props) {
  const { locale } = useLocale();
  const t = COPY[locale];

  // Only the three tailored categories (wedding/bar-bat-mitzvah/henna) have
  // enough structured data for a real headline - everything else keeps the
  // original plain-photo view unchanged (no regression for older invites).
  const photoCardHeadline = buildHeadline(eventCategory, categoryFields);
  const [showRsvp, setShowRsvp] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareImageBusy, setShareImageBusy] = useState(false);
  const [whatsNumberOpen, setWhatsNumberOpen] = useState(false);
  const [whatsNumberValue, setWhatsNumberValue] = useState("");
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(false);
  const [desktopWrap, setDesktopWrap] = useState(false);
  const [iframeSrc, setIframeSrc] = useState("");

  // Nudge people to actually RSVP - a lot of guests open the invite, look at
  // the picture and never bother confirming, which leaves the host unable to
  // plan seating. A gentle popup right on open converts a lot more of them.
  useEffect(() => {
    if (!wantRsvp) return;
    const t = setTimeout(() => setShowWelcomeAlert(true), 900);
    return () => clearTimeout(t);
  }, [wantRsvp]);

  // Guests opening the link on a desktop browser see the invite inside a
  // phone-frame mockup (matches how fiestaa.co.il does it) instead of a 9:16
  // portrait card stretched awkwardly across a wide window - re-render the
  // real page inside an iframe with ?mobile=true so it skips wrapping. On an
  // actual phone this must never trigger - isMobileUA/isTouchDevice both
  // gate it, independently, so one alone being unreliable doesn't matter.
  useEffect(() => {
    function isMobileUA() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    function isTouchDevice() {
      return window.matchMedia?.("(pointer: coarse)")?.matches || "ontouchstart" in window || navigator.maxTouchPoints > 0;
    }
    function isInIframe() {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    }
    const params = new URLSearchParams(window.location.search);
    if (!isInIframe() && !isMobileUA() && !isTouchDevice() && window.innerWidth > 768 && !params.has("mobile")) {
      const sep = window.location.search ? "&" : "?";
      setIframeSrc(`${window.location.pathname}${window.location.search}${sep}mobile=true`);
      setDesktopWrap(true);
    }
  }, []);

  const [guestName, setGuestName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [phone, setPhone] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [submitted, setSubmitted] = useState<null | "yes" | "no">(null);
  const [sending, setSending] = useState(false);
  const [rsvpId, setRsvpId] = useState<number | null>(null);
  const [showLeadPopup, setShowLeadPopup] = useState(false);
  const [leadPopupSent, setLeadPopupSent] = useState(false);
  const [leadPopupSending, setLeadPopupSending] = useState(false);
  // null = not answered yet, true = "כן" (date field opens), false = "לא"
  // (date field never shows) - either way "שלח" below sends/finishes.
  const [leadWantsEvent, setLeadWantsEvent] = useState<boolean | null>(null);
  const [leadEventDate, setLeadEventDate] = useState("");
  const [leadEventType, setLeadEventType] = useState("");
  const [leadVenue, setLeadVenue] = useState("");
  const [leadFinished, setLeadFinished] = useState(false);
  // "למעבר לאתר האולם" opens the hall's site/promo link (leadTourUrl,
  // configured per-hall in dashboard/hall settings) inside an in-page
  // iframe modal instead of navigating away (target="_blank") - guests
  // stay on the invite; "חזור להזמנה" below just closes this modal.
  const [tourOpen, setTourOpen] = useState(false);
  // Once they've actually looked at the tour, "לא תודה" no longer makes
  // sense as a label (they already said yes to it) - becomes a plain
  // "תודה" closing acknowledgment instead. Stays "לא תודה" the whole time
  // they never opened the tour at all.
  const [tourVisited, setTourVisited] = useState(false);
  // The YouTube IFrame Player instance backing the lead-video slot -
  // preloaded (muted, not playing) from the moment this page itself loads
  // (NOT from when the RSVP popup shows - that was the bug: by the time a
  // guest fills the whole RSVP form, submits it, reads the lead popup and
  // taps "כן, רוצה!", the player almost certainly wasn't ready yet on a
  // real connection, so playVideo() silently no-op'd and the guest just
  // saw the normal paused YouTube thumbnail). Loading from page-mount gives
  // it the maximum possible head start. So "כן, רוצה!" can call
  // playVideo() synchronously inside its own click handler - that's the
  // actual difference that makes autoplay-with-sound work on iOS Safari: a
  // raw <iframe src="...autoplay=1"> only created at click time relies on
  // YouTube's own page noticing the URL param and calling play() on itself
  // later, asynchronously - by then the browser no longer considers it
  // tied to the original tap.
  const ytPlayerRef = useRef<{
    playVideo: () => void;
    pauseVideo: () => void;
    unMute: () => void;
    setVolume: (v: number) => void;
  } | null>(null);

  useEffect(() => {
    // No hall video configured - nothing to preload, and the "כן, רוצה!"
    // branch below skips rendering .lead-video-wrap entirely for the same
    // reason.
    if (!leadVideoId) return;
    let cancelled = false;

    function createPlayer() {
      if (cancelled || ytPlayerRef.current) return;
      if (!document.getElementById("lead-yt-player-target")) return;
      const YT = (window as unknown as { YT?: { Player: new (...args: unknown[]) => unknown } }).YT;
      if (!YT) return;
      // loop:1 alone only loops a real playlist - for a single video it also
      // needs playlist set to that same video's own ID, otherwise it just
      // stops at the end like normal.
      ytPlayerRef.current = new YT.Player("lead-yt-player-target", {
        videoId: leadVideoId,
        width: "100%",
        height: "100%",
        playerVars: { autoplay: 0, mute: 1, playsinline: 1, controls: 1, rel: 0, loop: 1, playlist: leadVideoId },
      }) as typeof ytPlayerRef.current;
    }

    const w = window as unknown as { YT?: { Player: unknown }; onYouTubeIframeAPIReady?: () => void };
    if (w.YT?.Player) {
      createPlayer();
    } else {
      if (!document.getElementById("youtube-iframe-api-script")) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
      const prevReady = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        prevReady?.();
        createPlayer();
      };
    }

    return () => {
      cancelled = true;
    };
  }, [leadVideoId]);

  // "כן, רוצה!" - the click itself is what's allowed to start playback.
  function handleWantsEventClick() {
    setLeadWantsEvent(true);
    try {
      const p = ytPlayerRef.current;
      p?.unMute();
      p?.setVolume(100);
      p?.playVideo();
    } catch {
      // Player not ready yet (very slow network) - the visible player's
      // own controls still let the guest press play manually.
    }
  }

  // "סיים" on the "נציג מטעם האולם..." screen - moving to leadFinished
  // visually collapses the video wrap, but the player itself keeps
  // playing (audio and all) unless explicitly told to stop - it's the
  // same persistent player instance the whole time, never unmounted.
  // Without a tour link there's nothing for the leadFinished screen itself
  // to offer (it's just the "בהצלחה..." + tour button) - straight back to
  // the underlying thank-you screen instead of a card with no real action.
  function finishLeadFlow() {
    try {
      ytPlayerRef.current?.pauseVideo();
    } catch {
      // Nothing to pause - fine.
    }
    if (leadTourUrl) {
      setLeadFinished(true);
    } else {
      setShowLeadPopup(false);
    }
  }

  // The 3-question sequence (date -> event type -> venue) shown crossfading
  // in place, one row, next to the autoplaying video - see the render below
  // for how "picked"/"out" drive the fade. "question" = showing the input,
  // "picked" = briefly showing the chosen value as plain text (event type
  // only - venue is free text and skips straight past this phase) before
  // auto-advancing, "confirm" = date only - the picked date stays on
  // screen with its own "אישור" button instead of auto-advancing, since a
  // flash that's gone in under a second didn't give anyone a real chance
  // to check they picked the right date, "out" = fading out right before
  // the next question fades in.
  const [leadStep, setLeadStep] = useState<0 | 1 | 2>(0);
  const [leadStepPhase, setLeadStepPhase] = useState<"question" | "picked" | "confirm" | "out">("question");
  const [leadPickedText, setLeadPickedText] = useState("");

  function advanceLeadStep(pickedLabel: string) {
    setLeadPickedText(pickedLabel);
    setLeadStepPhase("picked");
    setTimeout(() => {
      setLeadStepPhase("out");
      setTimeout(() => {
        setLeadStep((s) => (s < 2 ? ((s + 1) as 0 | 1 | 2) : s));
        setLeadStepPhase("question");
      }, 300);
    }, 900);
  }

  function handleLeadDatePicked(value: string) {
    if (!value) return;
    setLeadPickedText(formatEventDate(value));
    // iOS Safari's native date-picker sheet is still animating itself
    // closed when this native "change" event fires. leadStepPhase feeds the
    // key on the question wrapper below (key={`${leadStep}-${leadStepPhase}`}),
    // so setting it right here unmounts the <input type="date"> the sheet
    // is still attached to mid-dismissal - which iOS shows as the sheet
    // snapping/glitching shut on its own instead of closing normally from
    // the tap. Letting the sheet finish its own close first (a short delay
    // is enough - there's no real event to wait on) fixes that.
    setTimeout(() => setLeadStepPhase("confirm"), 250);
  }

  function confirmLeadDate() {
    setLeadStepPhase("out");
    setTimeout(() => {
      setLeadStep(1);
      setLeadStepPhase("question");
    }, 300);
  }

  // "התבלבלתי" on the "זה התאריך?" confirm step - back to the date input
  // itself (not the next question) so they can just re-pick it. No fade
  // transition here (unlike confirmLeadDate's "out") since this is
  // correcting a mistake, not advancing - snapping straight back reads as
  // "undo", not as another step in the sequence.
  function backToDatePicker() {
    setLeadEventDate("");
    setLeadPickedText("");
    setLeadStepPhase("question");
  }

  function handleLeadTypePicked(value: string) {
    setLeadEventType(value);
    if (value) advanceLeadStep(value);
  }

  // The "planning an event too?" cross-sell no longer asks guests to fill in
  // a second form - they already gave their name and phone in the RSVP form
  // above, so "כן" just forwards those (plus the date/type/venue collected
  // by the video+questions step below) to the leads table.
  async function sendLeadFromRsvp() {
    if (leadWantsEvent) {
      setLeadPopupSending(true);
      try {
        const name = `${guestName} ${familyName}`.trim();
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            phone,
            sourceInviteId: id,
            eventDate: leadEventDate || "",
            eventType: leadEventType || "",
            eventVenue: leadVenue || "",
          }),
        });
      } finally {
        setLeadPopupSending(false);
      }
    }
    setLeadPopupSent(true);
  }

  function declineLead() {
    setShowLeadPopup(false);
  }

  // A solid gold bar (the per-photo accent color) read as an odd, clashing
  // block of color against a photo background - a translucent dark-gray
  // bar blends with any photo underneath instead, so this is back to the
  // one flat DEFAULT_CTA_COLORS for every photo invite, not a per-photo one.
  const ctaColors =
    mode === "template" && templateId ? TEMPLATE_CTA_COLORS[templateId] ?? DEFAULT_CTA_COLORS : DEFAULT_CTA_COLORS;

  const shareUrl = inviteUrl || (typeof window !== "undefined" ? window.location.href : "");
  // When RSVP is on, the shared message doubles as an RSVP nudge: guests
  // routinely ignore "please confirm attendance" but respond much better to
  // a concrete personal payoff - here, that confirming now reserves them an
  // actual seat/table, and skipping it risks losing that spot. Invites with
  // RSVP off keep the plain, neutral share text (there's no seating promise
  // to make).
  //
  // Kept as plain text (shareMessage) as well as URL-encoded (shareText):
  // guests who aren't saved as a contact are reached by copying the link and
  // pasting it into a chat typed by phone number rather than by tapping
  // WhatsApp's own contact picker - copyLink() below must put this same
  // persuasive wording on the clipboard, not just the bare URL, or exactly
  // those non-contact guests would miss the seating pitch entirely.
  // Kept short on purpose - a wall of text is exactly what guests skim
  // past. shareGreeting (when there's a name to show - see page.tsx) leads
  // with whose event this actually is, so a guest who got the link
  // forwarded along isn't left guessing; then one bold line with the
  // actual payoff (a seat is being held), a blank line, then the call to
  // action and link. *asterisks* are WhatsApp's own markdown for bold -
  // the one real "bigger font" lever plain WhatsApp text supports at all.
  const shareMessage = wantRsvp
    ? `${shareGreeting ? shareGreeting + "\n" : ""}*כדי לשריין לכם מקום מסודר בשולחן באולם... חשוב לנו שתכנסו ותרשמו באישור ההגעה* 🪑✨\n\nמוזמנים להכנס לקישור 👇\n${shareUrl}`
    : `להזמנה הדיגיטלית שלנו כנסו לקישור הבא ${shareUrl}`;
  const shareText = encodeURIComponent(shareMessage);

  async function submitRsvp(attending: boolean) {
    if (!guestName.trim() || !familyName.trim() || !phone.trim()) {
      Swal.fire({
        icon: "warning",
        title: t.missingDetailsTitle,
        text: t.missingDetailsText,
        confirmButtonText: t.gotIt,
        confirmButtonColor: "#d4af7a",
      });
      return;
    }
    // The phone number is the single most important piece of data here (how
    // the host actually reaches this guest) - not just "non-empty", it has
    // to be a real 10-digit Israeli mobile number, matching the inline
    // "מספר טלפון לא תקין" hint shown live under the field below.
    if (phone.replace(/\D/g, "").length !== 10) {
      Swal.fire({
        icon: "warning",
        title: t.invalidPhoneTitle,
        text: t.invalidPhoneText,
        confirmButtonText: t.gotIt,
        confirmButtonColor: "#d4af7a",
      });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteId: id,
          guestName,
          familyName,
          phone,
          guestCount,
          attending,
        }),
      });
      const data = await res.json().catch(() => null);
      // Never silently show "success" for a request the server actually
      // rejected (the previous version of this code did exactly that,
      // reading only data?.rsvpId and ignoring res.ok) - a phone number
      // already on file under a different name is refused, not overwritten
      // (see RsvpPhoneConflictError in store.ts), and the guest needs to
      // actually see that rather than a false "we saved your table!".
      if (!res.ok) {
        await Swal.fire({
          icon: "warning",
          title: data?.error || t.rsvpSaveFailedTitle,
          text: data?.detail || t.rsvpSaveFailedText,
          confirmButtonText: t.gotIt,
          confirmButtonColor: "#d4af7a",
        });
        return;
      }
      if (data?.rsvpId) setRsvpId(data.rsvpId);
      if (attending) {
        await Swal.fire({
          icon: "success",
          title: t.rsvpSavedTitle,
          text: t.rsvpSavedText,
          confirmButtonText: t.great,
          confirmButtonColor: "#d4af7a",
          background: "#1f2a33",
          color: "#fff",
        });
      }
      setSubmitted(attending ? "yes" : "no");
      // A private individual's guests have no reason to be shown a
      // "planning your own event?" upsell or someone else's virtual tour -
      // see hallAffiliated's own doc comment in the Props interface.
      if (hallAffiliated) setShowLeadPopup(true);
    } finally {
      setSending(false);
    }
  }

  function copyLink() {
    navigator.clipboard?.writeText(shareMessage).catch(() => {});
    setShareOpen(false);
  }

  // ---- "Share with image" -------------------------------------------------
  // A plain WhatsApp text message - even a bold one - is easy for a guest to
  // skim past. A real image with huge, bold text stops the scroll the way a
  // wall of text never does, so this builds an actual shareable graphic
  // (invite photo + a big "we're saving you a seat" headline) and hands it
  // to the OS share sheet via the Web Share API, which is the only web
  // mechanism that can attach an image to an outgoing WhatsApp message at
  // all (a wa.me link can only ever carry text). Browsers without file
  // sharing (most desktops) fall back to downloading the image plus opening
  // the normal bold-text WhatsApp compose, so the guest can attach it by
  // hand instead of losing the image entirely.
  function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (current && ctx.measureText(test).width > maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  async function buildShareImageBlob(): Promise<Blob | null> {
    const W = 1080;
    // Fixed-height caption band for the bold "save your seat" text - kept
    // separate from the photo (not overlaid on top of it) so the actual
    // invitation always shows in full underneath, never cropped or
    // obscured. A guest who forwards this on needs to still recognize it
    // as the same invitation they got, not a generic promo graphic.
    const CAPTION_H = 460;
    const FALLBACK_H = 1350; // when there's no photo to size the canvas by

    // Load the same bold weight used across the product's headings so the
    // canvas text doesn't silently fall back to a thin default font.
    try {
      await Promise.all([
        document.fonts.load("900 90px Heebo"),
        document.fonts.load("800 48px Heebo"),
        document.fonts.load("700 36px Heebo"),
      ]);
    } catch {
      // Font API unsupported/failed - canvas still renders, just with
      // whatever font the browser substitutes.
    }

    // The invite's own photo, loaded first (before sizing the canvas) so
    // the whole thing can be drawn at its natural aspect ratio instead of
    // being cropped to fit a pre-guessed frame.
    let img: HTMLImageElement | null = null;
    if (mode === "image" && imageUrl) {
      try {
        img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.crossOrigin = "anonymous";
          el.onload = () => resolve(el);
          el.onerror = reject;
          el.src = imageUrl;
        });
      } catch {
        img = null;
      }
    }

    let imgDrawH = 0;
    let canvasW = W;
    if (img) {
      imgDrawH = Math.round((img.height / img.width) * W);
      // A very tall source photo (e.g. a near-full-screen 9:19.5 shot)
      // would otherwise blow the canvas out to an unreasonable height -
      // scale everything down together so the full photo still fits,
      // uncropped, just narrower.
      const MAX_IMG_H = 2200;
      if (imgDrawH > MAX_IMG_H) {
        canvasW = Math.round((W * MAX_IMG_H) / imgDrawH);
        imgDrawH = MAX_IMG_H;
      }
    }
    const H = img ? imgDrawH + CAPTION_H : FALLBACK_H;

    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    if (img) {
      // The whole photo, uncropped, at the top.
      ctx.drawImage(img, 0, 0, canvasW, imgDrawH);
    } else {
      // No photo (template mode, or it failed to load) - a dark navy/gold
      // gradient card matching the product's own luxury-invite look fills
      // the whole canvas instead of just the caption band.
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0f1720");
      bg.addColorStop(1, "#1c1c1e");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvasW, H);
    }

    // Caption band: solid dark panel below the photo (or the full gradient
    // card when there's no photo) holding the bold call-to-action text -
    // never drawn on top of the photo itself.
    const bandY = img ? imgDrawH : 0;
    const bandH = H - bandY;
    const band = ctx.createLinearGradient(0, bandY, 0, H);
    band.addColorStop(0, img ? "#14100a" : "rgba(10,10,12,0.35)");
    band.addColorStop(1, "#0a0806");
    ctx.fillStyle = band;
    ctx.fillRect(0, bandY, canvasW, bandH);

    ctx.direction = "rtl";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let y = bandY + bandH / 2 - 90;

    ctx.font = "900 84px Heebo, Arial, sans-serif";
    ctx.fillStyle = "#f3d9a4";
    ctx.fillText("💍 שומרים לכם מקום!", canvasW / 2, y);
    y += 106;

    ctx.font = "800 54px Heebo, Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    for (const line of wrapCanvasText(ctx, "אשרו הגעה עכשיו", canvasW - 140)) {
      ctx.fillText(line, canvasW / 2, y);
      y += 66;
    }
    y += 12;

    ctx.font = "700 34px Heebo, Arial, sans-serif";
    ctx.fillStyle = "#e7e2d6";
    for (const line of wrapCanvasText(ctx, "כדי שנשריין לכם מקום ושולחן מסודר באולם", canvasW - 160)) {
      ctx.fillText(line, canvasW / 2, y);
      y += 44;
    }

    y += 40;
    ctx.font = "700 28px Heebo, Arial, sans-serif";
    ctx.fillStyle = "#d4af7a";
    ctx.fillText("👇 הקישור להזמנה ולאישור הגעה מצורף בהודעה", canvasW / 2, y);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
    });
  }

  async function shareWithImage() {
    setShareImageBusy(true);
    try {
      const blob = await buildShareImageBlob();
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
        share?: (data: ShareData) => Promise<void>;
      };
      if (blob && nav.share) {
        const file = new File([blob], "hazmana.jpg", { type: "image/jpeg" });
        const shareData: ShareData = { files: [file], text: shareMessage };
        if (!nav.canShare || nav.canShare(shareData)) {
          try {
            await nav.share(shareData);
            setShareOpen(false);
            return;
          } catch (err) {
            // AbortError = the guest just closed the OS share sheet - not a
            // failure, nothing else to do. Any other error falls through to
            // the download fallback below.
            if (err instanceof Error && err.name === "AbortError") {
              setShareOpen(false);
              return;
            }
          }
        }
      }
      // Fallback for browsers with no file-sharing support (most desktops):
      // download the image so it can be attached by hand, and still open a
      // normal bold-text WhatsApp compose with the same message.
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "hazmana.jpg";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        await Swal.fire({
          icon: "info",
          title: t.imageDownloadedTitle,
          text: t.imageDownloadedText,
          confirmButtonText: t.gotIt,
          confirmButtonColor: "#d4af7a",
        });
      }
      window.open(`https://wa.me/?text=${shareText}`, "_blank");
      setShareOpen(false);
    } finally {
      setShareImageBusy(false);
    }
  }

  function openWhatsNumberModal() {
    setShareOpen(false);
    setWhatsNumberValue("");
    setWhatsNumberOpen(true);
  }

  function submitWhatsNumber(e: React.FormEvent) {
    e.preventDefault();
    let digits = whatsNumberValue.replace(/\D/g, "");
    if (!digits) return;
    if (digits.startsWith("00")) digits = digits.slice(2);
    else if (digits.startsWith("0")) digits = "972" + digits.slice(1);
    window.open(`https://wa.me/${digits}?text=${shareText}`, "_blank");
    setWhatsNumberOpen(false);
  }

  if (desktopWrap) {
    return (
      <div className="desktop-wrapper">
        <div className="mobile-frame">
          <div className="desktop-title">{t.desktopTitle}</div>
          <div className="side-button-right" />
          <div className="side-button-left-1" />
          <div className="side-button-left-2" />
          <div className="side-button-left-3" />
          <div className="mobile-screen">
            {iframeSrc && <iframe src={iframeSrc} allowFullScreen />}
          </div>
          <div className="powered-by">Powered by VIVA</div>
        </div>
      </div>
    );
  }

  return (
    <div className="vpager">
      {showWelcomeAlert && (
        <div className="welcome-alert-overlay" onClick={() => setShowWelcomeAlert(false)}>
          <div className="welcome-alert-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="welcome-alert-close"
              onClick={() => setShowWelcomeAlert(false)}
              aria-label={t.closeAria}
            >
              ×
            </button>
            <h3 className="welcome-alert-subtitle">{t.welcomeSubtitle}</h3>
            <p className="welcome-alert-emphasis">
              {t.welcomeEmphasisPre}<span className="welcome-alert-highlight">{t.welcomeEmphasisHighlight}</span>{t.welcomeEmphasisPost}
            </p>
            <button type="button" className="welcome-alert-cta" onClick={() => setShowWelcomeAlert(false)}>
              {t.welcomeCta}
            </button>
          </div>
        </div>
      )}

      {
        // Always mounted (never a conditional && block) so the YouTube
        // player target below exists in the DOM - and can start preloading
        // - from the moment this page itself loads, instead of only once
        // the RSVP is actually submitted. Visibility is a CSS class instead
        // of React conditional rendering for exactly that reason. Tapping
        // the dark overlay outside the card used to close the whole popup
        // (declineLead) - easy to trigger by accident on a phone, and it
        // silently threw away whatever the guest had already answered
        // partway through the video+questions flow - so that's gone too:
        // the only way to close this now is one of the explicit
        // "לא, תודה"/"לא תודה" buttons.
      }
      <div className={`lead-alert-overlay${showLeadPopup ? "" : " lead-alert-overlay-hidden"}`}>
        <div
            className={`lead-alert-card${leadWantsEvent === true ? " lead-alert-card-video" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mounted from page load (this whole overlay is now always in
                the DOM - see above) so the YouTube IFrame Player can
                preload as early as possible - collapsed to an invisible
                sliver until the video stage. player.playVideo() is called
                synchronously inside the "כן, רוצה!" click handler - that
                only works reliably because the player already exists (and
                had plenty of time to finish loading) by then. No hall
                video configured at all (leadVideoId) - skip this slot
                entirely rather than collapsing it to zero height, so the
                questions below start right where the card opens instead of
                leaving a gap. */}
            {leadVideoId && (
              <div
                className={`lead-video-wrap${leadWantsEvent === true && !leadFinished ? "" : " lead-video-wrap-collapsed"}`}
              >
                <div id="lead-yt-player-target" className="lead-video-iframe" />
              </div>
            )}

            {leadFinished ? (
              <>
                <div className="lead-alert-icon">✨</div>
                <p className="lead-alert-thanks">{t.leadThanksFinished}</p>
                <p className="welcome-alert-emphasis lead-tour-prompt" style={{ marginTop: 6 }}>
                  {t.leadTourPromptLine1}
                  <br />
                  {t.leadTourPromptLine2}
                </p>
                <button
                  type="button"
                  className="lead-alert-yes"
                  style={{ display: "block", width: "100%", marginTop: 14 }}
                  onClick={() => {
                    setTourVisited(true);
                    setTourOpen(true);
                  }}
                >
                  {t.leadTourBtn}
                </button>
                <button type="button" className="lead-alert-no" style={{ width: "100%", marginTop: 10 }} onClick={declineLead}>
                  {tourVisited ? t.leadTourThanks : t.leadTourNoThanks}
                </button>
              </>
            ) : leadWantsEvent === true ? (
              <>
                <div className="lead-video-questions">
                  {leadPopupSent ? (
                    <div className="lead-video-q lead-video-q-question">
                      <div className="lead-video-thanks">
                        <p className="lead-alert-thanks">{t.leadRepContact}</p>
                      </div>
                    </div>
                  ) : (
                    <div key={`${leadStep}-${leadStepPhase}`} className={`lead-video-q lead-video-q-${leadStepPhase}`}>
                      {leadStepPhase === "confirm" ? (
                        <div className="lead-video-confirm">
                          <p className="lead-video-picked">{t.leadConfirmDateQ} {leadPickedText}</p>
                          <div className="lead-video-confirm-row">
                            <button type="button" className="lead-video-confirm-btn" onClick={confirmLeadDate}>
                              {t.leadConfirmYes}
                            </button>
                            <button
                              type="button"
                              className="lead-video-confirm-btn lead-video-confirm-btn-secondary"
                              onClick={backToDatePicker}
                            >
                              {t.leadConfirmBack}
                            </button>
                          </div>
                        </div>
                      ) : leadStepPhase === "picked" ? (
                        <p className="lead-video-picked">✓ {leadPickedText}</p>
                      ) : leadStep === 0 ? (
                        <div className="rsvp-field" style={{ textAlign: "center", margin: 0 }}>
                          <p className="lead-date-intro">{t.leadDateIntro}</p>
                          <label>{t.leadDateQ}</label>
                          {/* iOS Safari fires a premature onChange with today's
                              date the moment an empty date input opens - before
                              the user has picked anything. Reacting to that by
                              jumping straight to "confirm" (as this used to do)
                              yanked the input out from under the still-open
                              native picker, so it looked like the picker just
                              closed itself. React's onChange (bound to the
                              native "input" event) still only tracks the value
                              here (uncontrolled, so it doesn't fight the
                              picker's own DOM updates either - see
                              TemplateFillForm's date field for the same fix).
                              The "confirm" step used to wait for onBlur instead,
                              but on desktop, clicking a day in Chrome's calendar
                              dropdown commits the value *without* moving focus
                              away from the field - so confirm never showed up
                              until something else happened to blur it later,
                              looking stuck. The native "change" event (wired
                              directly via ref, since that's a different event
                              than React's onChange here) is the right signal
                              instead: browsers only fire it once a value is
                              genuinely committed - picker closed with a pick,
                              or a typed edit - which covers blur too, so a
                              separate onBlur isn't needed on top of it. */}
                          <input
                            type="date"
                            defaultValue={leadEventDate}
                            onChange={(e) => setLeadEventDate(e.target.value)}
                            ref={(el) => {
                              if (!el) return;
                              el.onchange = (e) => handleLeadDatePicked((e.target as HTMLInputElement).value);
                            }}
                          />
                        </div>
                      ) : leadStep === 1 ? (
                        <div className="rsvp-field" style={{ textAlign: "center", margin: 0 }}>
                          <label>{t.leadEventTypeQ}</label>
                          <select value={leadEventType} onChange={(e) => handleLeadTypePicked(e.target.value)}>
                            <option value="">{t.leadEventTypePlaceholder}</option>
                            <option value="חתונה">{t.eventTypeWedding}</option>
                            <option value="בר מצווה">{t.eventTypeBarMitzvah}</option>
                            <option value="ברית">{t.eventTypeBrit}</option>
                            <option value="אחר">{t.eventTypeOther}</option>
                          </select>
                        </div>
                      ) : (
                        <div className="rsvp-field" style={{ textAlign: "center", margin: 0 }}>
                          <label>{t.leadVenueQ}</label>
                          <input
                            type="text"
                            placeholder={t.leadVenuePlaceholder}
                            value={leadVenue}
                            onChange={(e) => setLeadVenue(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {leadPopupSent ? (
                  <button
                    type="button"
                    className="lead-alert-yes"
                    style={{ width: "100%", marginTop: 16 }}
                    onClick={finishLeadFlow}
                  >
                    {t.leadFinish}
                  </button>
                ) : (
                  leadStep === 2 &&
                  leadStepPhase === "question" && (
                    <button
                      type="button"
                      className="lead-alert-yes"
                      style={{ width: "100%", marginTop: 16 }}
                      disabled={leadPopupSending}
                      onClick={sendLeadFromRsvp}
                    >
                      {t.leadSend}
                    </button>
                  )
                )}
              </>
            ) : (
              <>
                <h3 className="welcome-alert-subtitle lead-benefit-title">{t.leadBenefitTitle}</h3>
                <p className="welcome-alert-emphasis lead-benefit-prompt">
                  {t.leadBenefitPrompt}
                </p>
                <div className="lead-alert-row">
                  {/* "לא" needs no follow-up step at all - straight back to
                      the underlying thank-you screen. Only "כן" opens the
                      video+questions stage above - and that click is also
                      what's allowed to call playVideo() on the pre-loaded
                      player (see handleWantsEventClick). Full-width "כן" on
                      top, "לא" below it - not side by side - so the primary
                      action is the one that's hard to miss. */}
                  <button type="button" className="lead-alert-yes" onClick={handleWantsEventClick}>
                    {t.leadWantsYes}
                  </button>
                  <button type="button" className="lead-alert-no" onClick={declineLead}>
                    {t.leadWantsNo}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      {tourOpen && leadTourUrl && (

        <div className="tour-modal-overlay">
          <iframe
            className="tour-modal-iframe"
            src={leadTourUrl}
            title={t.tourTitle}
            allow="accelerometer; gyroscope; fullscreen"
            allowFullScreen
          />
          <button type="button" className="tour-modal-back-btn" onClick={() => setTourOpen(false)}>
            {t.tourBack}
          </button>
        </div>
      )}

      <div className={`vpager-inner${showRsvp ? " show-rsvp" : ""}`}>
        <section className="inv-panel">
          {/* A proper flex sibling of .pull-cta below (not an absolute
              overlay on top of it) - the image/card now shrinks to leave
              real room for the button bar instead of the bar floating over
              (and hiding) the bottom of the photo/frame. */}
          <div className="inv-media">
            {mode === "template" && templateId && templateFields ? (
              <div className="tpl-full-wrap">
                <TemplateCard templateId={templateId} fields={templateFields} />
              </div>
            ) : photoCardHeadline && !textStyle?.imageHasText ? (
              <InvitePhotoCard
                imageUrl={imageUrl}
                headline={photoCardHeadline}
                dateText={[eventDate && formatEventDate(eventDate), eventStart && `${t.atHour} ${eventStart}`].filter(Boolean).join("\n")}
                venueText={address}
                extraLines={buildExtraDetailLines(eventCategory, categoryFields)}
                textStyle={textStyle}
              />
            ) : textStyle?.imageHasText ? (
              // The AI Designer bakes the couple's/celebrant's name, date,
              // parents, venue etc. directly into the image pixels (see
              // imageHasText in create/image/page.tsx). object-fit:fill
              // (not cover/contain) - the client confirmed via a real test
              // page (plain img{width:100vw;height:100vh;object-fit:fill})
              // that a non-uniform stretch to exactly match the available
              // box is what's wanted here: zero cropping AND zero empty
              // gaps, on any screen shape, full stop - unlike cover (has to
              // crop something) or contain (has to leave a gap somewhere).
              // .inv-media (this image's positioned parent) is already
              // sized to the real available space - screen height minus
              // the reserved .pull-cta bar below, a proper flex sibling,
              // not an overlay - so that bar reads as a clean boundary
              // between the invitation and the RSVP action, never a cut.
              <>
                <div
                  className="blank-bg"
                  style={{ background: "linear-gradient(to bottom, #4c6b85 0%, #4c6b85 34%, #323a3c 66%, #323a3c 100%)" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="blank-image blank-image-fill" src={imageUrl} alt={t.imageAlt} />
              </>
            ) : (
              <>
                <div
                  className="blank-bg"
                  style={{ background: "linear-gradient(to bottom, #4c6b85 0%, #4c6b85 34%, #323a3c 66%, #323a3c 100%)" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="blank-image" src={imageUrl} alt={t.imageAlt} />
                <div className="blank-fade" />
              </>
            )}
          </div>

          {wantRsvp && (
            <button
              type="button"
              className="pull-cta"
              style={{ background: ctaColors.bg, color: ctaColors.color }}
              onClick={() => setShowRsvp(true)}
            >
              <span className="pull-arrows">
                <i className="a1">▲</i>
                <i className="a2">▲</i>
              </span>
              <span>{t.pullCta}</span>
            </button>
          )}
        </section>

        {wantRsvp && (
          <section className="rsvp-panel">
            {/* Used to show the invite's own photo, blurred, behind a 90%-
                opaque cream scrim - the remaining 10% let the photo's own
                colors (whatever they happened to be) bleed through, visible
                as odd discolored patches wherever the blurred photo was
                locally darker/more saturated. A fully opaque scrim made the
                photo layer pointless (completely hidden either way), so
                it's gone - .rsvp-panel's own flat background below is the
                only background now, guaranteed uniform regardless of any
                photo. */}
            <button type="button" className="back-to-inv-cta" onClick={() => setShowRsvp(false)}>
              <span className="pull-arrows">
                <i className="a1">▲</i>
                <i className="a2">▲</i>
              </span>
              <span className="back-to-inv-label">{t.backToInvite}</span>
            </button>

            <div className="rsvp-card">
              {submitted ? (
                <div className="rsvp-thanks-screen">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="rsvp-thanks-image" src="/party.png" alt="" aria-hidden="true" />
                  <p className="rsvp-thanks">
                    {submitted === "yes" ? t.thanksYes : t.thanksNo}
                  </p>
                  {headline && <p className="rsvp-thanks-headline">{headline}</p>}
                  {eventDate && (
                    <p className="rsvp-thanks-date">
                      {formatEventDate(eventDate)} {eventStart && `${t.atHour} ${eventStart}`}
                    </p>
                  )}
                  {showNavBtn && address && (
                    <div className="rsvp-thanks-nav-row">
                      <a href={wazeUrl(address)} target="_blank" rel="noopener noreferrer" className="rsvp-thanks-nav-btn rsvp-thanks-waze">
                        {t.navWaze}
                      </a>
                      <a href={googleMapsUrl(address)} target="_blank" rel="noopener noreferrer" className="rsvp-thanks-nav-btn rsvp-thanks-maps">
                        {t.navMaps}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <h2 className="rsvp-title">{t.rsvpTitle}</h2>
                  <p className="rsvp-subtitle">{t.rsvpSubtitle}</p>

                  <div className="rsvp-field">
                    <label>{t.firstNameLabel}</label>
                    <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
                  </div>
                  <div className="rsvp-field">
                    <label>{t.lastNameLabel}</label>
                    <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} required />
                  </div>
                  <div className="rsvp-field">
                    <label>{t.phoneLabel}</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t.phonePlaceholder}
                      inputMode="numeric"
                      required
                    />
                    {/* Live hint, not just a popup on submit - the phone
                        number is the most important field here (how the
                        host actually reaches this guest), so it's worth
                        flagging the instant it's wrong instead of only
                        after "כן"/"לא" is tapped. */}
                    {phone.trim() && phone.replace(/\D/g, "").length !== 10 && (
                      <p className="rsvp-field-error">{t.phoneInvalid}</p>
                    )}
                  </div>
                  <div className="rsvp-field">
                    <label>{t.guestCountLabel}</label>
                    <div className="rsvp-stepper">
                      <button
                        type="button"
                        className="rsvp-stepper-btn"
                        onClick={() => setGuestCount((n) => Math.max(1, n - 1))}
                        aria-label={t.decreaseGuestAria}
                      >
                        −
                      </button>
                      <span className="rsvp-stepper-value">{guestCount}</span>
                      <button
                        type="button"
                        className="rsvp-stepper-btn"
                        onClick={() => setGuestCount((n) => Math.min(20, n + 1))}
                        aria-label={t.increaseGuestAria}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="rsvp-choice-label">{t.rsvpChoiceLabel}</p>
                  <div className="rsvp-choice-row">
                    <button
                      type="button"
                      className="rsvp-choice-btn"
                      disabled={sending}
                      onClick={() => submitRsvp(false)}
                    >
                      {t.rsvpNo}
                    </button>
                    <button
                      type="button"
                      className="rsvp-choice-btn"
                      disabled={sending}
                      onClick={() => submitRsvp(true)}
                    >
                      {t.rsvpYes}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </div>

      {isOwner && (
        <a href={`/dashboard/${id}/guests`} className="owner-back-fab" title={t.ownerBackTitle}>
          🛠️
        </a>
      )}

      {/* Was always fixed at bottom-right regardless of which panel was
          showing - on the RSVP form specifically it sat right on top of
          the "לא" button. Still needed on the RSVP screen too - moved to
          the opposite top corner (clear of the back-to-invitation button
          which sits centered) instead of being hidden. */}
      <button
        type="button"
        className={`blank-share-fab${showRsvp ? " blank-share-fab-top" : ""}`}
        onClick={() => setShareOpen(true)}
      >
        {t.shareFab}
      </button>

      <div className={`blank-share-modal${shareOpen ? " open" : ""}`} onClick={() => setShareOpen(false)}>
        <div className="blank-share-card" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="blank-share-close" onClick={() => setShareOpen(false)}>
            ×
          </button>
          <div className="blank-share-title">{t.shareTitle}</div>
          {wantRsvp && (
            <button
              type="button"
              className="share-tile share-tile-image"
              onClick={shareWithImage}
              disabled={shareImageBusy}
            >
              <span className="share-tile-image-badge">{t.shareImageBadge}</span>
              <span>{shareImageBusy ? t.shareImageBusy : t.shareImageCta}</span>
            </button>
          )}
          <div className="share-tile-grid">
            <a className="share-tile share-tile-whatsapp" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer">
              {t.shareWhatsapp}
            </a>
            <button type="button" className="share-tile share-tile-whatsapp-contact" onClick={openWhatsNumberModal}>
              {t.shareWhatsappContact}
            </button>
            <a className="share-tile share-tile-sms" href={`sms:?&body=${shareText}`}>
              SMS
            </a>
            <button type="button" className="share-tile share-tile-copy" onClick={copyLink}>
              {t.shareCopyLink}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`blank-share-modal${whatsNumberOpen ? " open" : ""}`}
        onClick={() => setWhatsNumberOpen(false)}
      >
        <div className="blank-share-card" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="blank-share-close" onClick={() => setWhatsNumberOpen(false)}>
            ×
          </button>
          <div className="blank-share-title">{t.shareWhatsappTitle}</div>
          <form className="whats-number-form" onSubmit={submitWhatsNumber}>
            <label className="whats-number-label">{t.whatsNumberLabel}</label>
            <input
              className="whats-number-input"
              value={whatsNumberValue}
              onChange={(e) => setWhatsNumberValue(e.target.value)}
              placeholder={t.whatsNumberPlaceholder}
              inputMode="numeric"
              autoFocus
            />
            <div className="whats-number-actions">
              <button type="button" className="whats-number-cancel" onClick={() => setWhatsNumberOpen(false)}>
                {t.whatsNumberCancel}
              </button>
              <button type="submit" className="whats-number-submit">
                {t.whatsNumberSubmit}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
