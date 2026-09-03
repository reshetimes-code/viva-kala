"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { TemplateCard, TEMPLATE_CTA_COLORS, type TemplateFields } from "@/lib/templates";
import { wazeUrl, googleMapsUrl } from "@/lib/navLinks";
import { buildHeadline, buildExtraDetailLines, formatEventDate } from "@/lib/categoryFields";
import type { EventCategory } from "@/lib/eventCategories";
import type { TextStyle } from "@/lib/textStyleHeuristic";
import InvitePhotoCard from "@/components/InvitePhotoCard";

const DEFAULT_CTA_COLORS = { bg: "rgba(20,20,25,0.72)", color: "#ffffff" };

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
}: Props) {
  // Only the three tailored categories (wedding/bar-bat-mitzvah/henna) have
  // enough structured data for a real headline - everything else keeps the
  // original plain-photo view unchanged (no regression for older invites).
  const photoCardHeadline = buildHeadline(eventCategory, categoryFields);
  const [showRsvp, setShowRsvp] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
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
  // "לסיור הוירטואלי" opens the 360 tour inside an in-page iframe modal
  // instead of navigating away (target="_blank") - guests stay on the
  // invite; "חזור להזמנה" below just closes this modal.
  const [tourOpen, setTourOpen] = useState(false);
  // The 3-question sequence (date -> event type -> venue) shown crossfading
  // in place, one row, next to the autoplaying video - see the render below
  // for how "picked"/"out" drive the fade. "question" = showing the input,
  // "picked" = briefly showing the chosen value as plain text (date/type
  // only - venue is free text, so it skips straight past this phase),
  // "out" = fading out right before the next question fades in.
  const [leadStep, setLeadStep] = useState<0 | 1 | 2>(0);
  const [leadStepPhase, setLeadStepPhase] = useState<"question" | "picked" | "out">("question");
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
    setLeadEventDate(value);
    if (value) advanceLeadStep(formatEventDate(value));
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

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = encodeURIComponent(`להזמנה הדיגיטלית שלנו כנסו לקישור הבא ${shareUrl}`);

  async function submitRsvp(attending: boolean) {
    if (!guestName.trim() || !familyName.trim() || !phone.trim()) {
      Swal.fire({
        icon: "warning",
        title: "חסרים פרטים",
        text: "נא למלא שם פרטי, שם משפחה וטלפון כדי לאשר הגעה",
        confirmButtonText: "הבנתי",
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
      if (data?.rsvpId) setRsvpId(data.rsvpId);
      if (attending) {
        await Swal.fire({
          icon: "success",
          title: "שמרנו לכם את השולחן!",
          text: "באולם יוצג לכם מיקום השולחן השמור עבורכם",
          confirmButtonText: "מעולה",
          confirmButtonColor: "#d4af7a",
          background: "#1f2a33",
          color: "#fff",
        });
      }
      setSubmitted(attending ? "yes" : "no");
      setShowLeadPopup(true);
    } finally {
      setSending(false);
    }
  }

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setShareOpen(false);
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
          <div className="desktop-title">ההזמנה הדיגיטלית שלכם</div>
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
              aria-label="סגירה"
            >
              ×
            </button>
            <h3 className="welcome-alert-subtitle">תודה שנכנסתם להזמנה!</h3>
            <p className="welcome-alert-emphasis">
              כדי לשמור לכם מקום מסודר <span className="welcome-alert-highlight">בשולחן</span> באירוע - אנא אשרו הגעה 🙏
            </p>
            <button type="button" className="welcome-alert-cta" onClick={() => setShowWelcomeAlert(false)}>
              מעבר להזמנה
            </button>
          </div>
        </div>
      )}

      {showLeadPopup && (
        <div className="lead-alert-overlay" onClick={leadFinished ? undefined : declineLead}>
          <div
            className={`lead-alert-card${leadWantsEvent === true ? " lead-alert-card-video" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            {leadFinished ? (
              <>
                <div className="lead-alert-icon">✨</div>
                <p className="lead-alert-thanks">בהצלחה באירוע הבא שלכם!</p>
                <p className="welcome-alert-emphasis" style={{ marginTop: 6 }}>
                  רוצים לראות איך זה נראה בשטח? סיור 360° באולם:
                </p>
                <button
                  type="button"
                  className="lead-alert-yes"
                  style={{ display: "block", width: "100%", marginTop: 14 }}
                  onClick={() => setTourOpen(true)}
                >
                  לסיור הוירטואלי 🎥
                </button>
                <button type="button" className="lead-alert-no" style={{ width: "100%", marginTop: 10 }} onClick={declineLead}>
                  לא תודה
                </button>
              </>
            ) : leadWantsEvent === true ? (
              <>
                {/* The video is only ever mounted here, inside this branch -
                    which only exists once the "כן, רוצה!" click below has
                    fired setLeadWantsEvent(true). That click is what
                    creates this iframe in the first place, which is the
                    closest a cross-origin YouTube embed can get to
                    inheriting the click's own "user gesture" - the actual
                    trick that lets autoplay-with-sound work on mobile at
                    all. It must never be mounted before that click. Stays
                    mounted (and playing) through both the question-cycling
                    below AND the "thank you" message once sent - it only
                    unmounts (stops) when "סיים" moves on to leadFinished,
                    which is a completely separate branch with no video. */}
                <div className="lead-video-wrap">
                  <iframe
                    className="lead-video-iframe"
                    src="https://www.youtube.com/embed/XRxZVb2xZDs?autoplay=1&mute=0&playsinline=1&rel=0"
                    title="סרטון היכרות"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="lead-video-questions">
                  {leadPopupSent ? (
                    <div className="lead-video-q lead-video-q-question">
                      <div className="lead-video-thanks">
                        <div className="lead-alert-icon" style={{ marginBottom: 4 }}>🎉</div>
                        <p className="lead-alert-thanks">נציג מטעם האולם יצור קשר בקרוב...</p>
                      </div>
                    </div>
                  ) : (
                    <div key={`${leadStep}-${leadStepPhase}`} className={`lead-video-q lead-video-q-${leadStepPhase}`}>
                      {leadStepPhase === "picked" ? (
                        <p className="lead-video-picked">✓ {leadPickedText}</p>
                      ) : leadStep === 0 ? (
                        <div className="rsvp-field" style={{ textAlign: "center", margin: 0 }}>
                          <label>מה תאריך האירוע? (לא חובה)</label>
                          <input type="date" value={leadEventDate} onChange={(e) => handleLeadDatePicked(e.target.value)} />
                        </div>
                      ) : leadStep === 1 ? (
                        <div className="rsvp-field" style={{ textAlign: "center", margin: 0 }}>
                          <label>סוג האירוע? (לא חובה)</label>
                          <select value={leadEventType} onChange={(e) => handleLeadTypePicked(e.target.value)}>
                            <option value="">בחרו סוג אירוע</option>
                            <option value="חתונה">חתונה</option>
                            <option value="בר מצווה">בר מצווה</option>
                            <option value="ברית">ברית</option>
                            <option value="אחר">אחר</option>
                          </select>
                        </div>
                      ) : (
                        <div className="rsvp-field" style={{ textAlign: "center", margin: 0 }}>
                          <label>איזה אולם? (לא חובה)</label>
                          <input
                            type="text"
                            placeholder="שם האולם"
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
                    onClick={() => setLeadFinished(true)}
                  >
                    סיים
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
                      שלחו
                    </button>
                  )
                )}
              </>
            ) : (
              <>
                <h3 className="welcome-alert-subtitle">רגע לפני שממשיכים...</h3>
                <p className="welcome-alert-emphasis">חוגגים אירוע בקרוב? תרצו לקבל הטבה מיוחדת מאיתנו?</p>
                <div className="lead-alert-row">
                  {/* "לא" needs no follow-up step at all - straight back to
                      the underlying thank-you screen. Only "כן" opens the
                      video+questions stage above - and that click is also
                      what's allowed to create/autoplay the video iframe. */}
                  <button type="button" className="lead-alert-no" onClick={declineLead}>
                    לא, תודה
                  </button>
                  <button type="button" className="lead-alert-yes" onClick={() => setLeadWantsEvent(true)}>
                    כן, רוצה!
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tourOpen && (
        <div className="tour-modal-overlay">
          <iframe
            className="tour-modal-iframe"
            src="https://go3d.co.il/360/yama/"
            title="סיור וירטואלי 360°"
            allow="accelerometer; gyroscope; fullscreen"
            allowFullScreen
          />
          <button type="button" className="tour-modal-back-btn" onClick={() => setTourOpen(false)}>
            ← חזור להזמנה
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
                dateText={[eventDate && formatEventDate(eventDate), eventStart && `בשעה ${eventStart}`].filter(Boolean).join("\n")}
                venueText={address}
                extraLines={buildExtraDetailLines(eventCategory, categoryFields)}
                textStyle={textStyle}
              />
            ) : (
              <>
                <div
                  className="blank-bg"
                  style={{ background: "linear-gradient(to bottom, #4c6b85 0%, #4c6b85 34%, #323a3c 66%, #323a3c 100%)" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="blank-image" src={imageUrl} alt="הזמנה" />
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
              <span>אשרו הגעה כאן</span>
            </button>
          )}
        </section>

        {wantRsvp && (
          <section className="rsvp-panel">
            {/* Same photo as the invite itself, softened behind the form -
                continuity with the designed invite instead of an unrelated
                plain page for the RSVP step. Kept as its own absolutely-
                positioned layer (not touching sibling elements' own
                positioning) so it can never interfere with the back-arrow
                button below. */}
            {mode === "image" && imageUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="rsvp-bg-photo" src={imageUrl} alt="" aria-hidden="true" />
                <div className="rsvp-bg-scrim" />
              </>
            )}
            <button type="button" className="back-to-inv-cta" onClick={() => setShowRsvp(false)}>
              <span className="pull-arrows">
                <i className="a1">▲</i>
                <i className="a2">▲</i>
              </span>
              <span className="back-to-inv-label">צפייה בהזמנה</span>
            </button>

            <div className="rsvp-card">
              {submitted ? (
                <div className="rsvp-thanks-screen">
                  <p className="rsvp-thanks">
                    {submitted === "yes" ? "תודה שאישרתם הגעה!" : "תודה על התגובה"}
                  </p>
                  {headline && <p className="rsvp-thanks-headline">{headline}</p>}
                  {eventDate && (
                    <p className="rsvp-thanks-date">
                      {formatEventDate(eventDate)} {eventStart && `בשעה ${eventStart}`}
                    </p>
                  )}
                  {showNavBtn && address && (
                    <div className="rsvp-thanks-nav-row">
                      <a href={wazeUrl(address)} target="_blank" rel="noopener noreferrer" className="rsvp-thanks-nav-btn rsvp-thanks-waze">
                        ניווט ב-Waze
                      </a>
                      <a href={googleMapsUrl(address)} target="_blank" rel="noopener noreferrer" className="rsvp-thanks-nav-btn rsvp-thanks-maps">
                        ניווט ב-Maps
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <h2 className="rsvp-title">אנא אשרו הגעתכם</h2>

                  <div className="rsvp-field">
                    <label>שם פרטי *</label>
                    <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
                  </div>
                  <div className="rsvp-field">
                    <label>שם המשפחה *</label>
                    <input value={familyName} onChange={(e) => setFamilyName(e.target.value)} required />
                  </div>
                  <div className="rsvp-field">
                    <label>טלפון (ספרות בלבד) *</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05XXXXXXXX"
                      inputMode="numeric"
                      required
                    />
                  </div>
                  <div className="rsvp-field">
                    <label>כמה מגיעים?</label>
                    <div className="rsvp-stepper">
                      <button
                        type="button"
                        className="rsvp-stepper-btn"
                        onClick={() => setGuestCount((n) => Math.max(1, n - 1))}
                        aria-label="הפחתת אורח"
                      >
                        −
                      </button>
                      <span className="rsvp-stepper-value">{guestCount}</span>
                      <button
                        type="button"
                        className="rsvp-stepper-btn"
                        onClick={() => setGuestCount((n) => Math.min(20, n + 1))}
                        aria-label="הוספת אורח"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="rsvp-choice-label">מגיעים לאירוע? (הבחירה שולחת את הטופס)</p>
                  <div className="rsvp-choice-row">
                    <button
                      type="button"
                      className="rsvp-choice-btn"
                      disabled={sending}
                      onClick={() => submitRsvp(false)}
                    >
                      לא
                    </button>
                    <button
                      type="button"
                      className="rsvp-choice-btn"
                      disabled={sending}
                      onClick={() => submitRsvp(true)}
                    >
                      כן
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </div>

      {isOwner && (
        <a href={`/dashboard/${id}/guests`} className="owner-back-fab" title="חזרה לפאנל הניהול">
          🛠️
        </a>
      )}

      <button type="button" className="blank-share-fab" onClick={() => setShareOpen(true)}>
        📤 שתפו
      </button>

      <div className={`blank-share-modal${shareOpen ? " open" : ""}`} onClick={() => setShareOpen(false)}>
        <div className="blank-share-card" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="blank-share-close" onClick={() => setShareOpen(false)}>
            ×
          </button>
          <div className="blank-share-title">שתפו את ההזמנה</div>
          <div className="share-tile-grid">
            <a className="share-tile share-tile-whatsapp" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer">
              וואטסאפ
            </a>
            <button type="button" className="share-tile share-tile-whatsapp-contact" onClick={openWhatsNumberModal}>
              וואטסאפ לאיש קשר
            </button>
            <a className="share-tile share-tile-sms" href={`sms:?&body=${shareText}`}>
              SMS
            </a>
            <button type="button" className="share-tile share-tile-copy" onClick={copyLink}>
              העתקת קישור
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
          <div className="blank-share-title">שליחה בוואטסאפ</div>
          <form className="whats-number-form" onSubmit={submitWhatsNumber}>
            <label className="whats-number-label">מספר הטלפון של איש הקשר</label>
            <input
              className="whats-number-input"
              value={whatsNumberValue}
              onChange={(e) => setWhatsNumberValue(e.target.value)}
              placeholder="05X-XXXXXXX"
              inputMode="numeric"
              autoFocus
            />
            <div className="whats-number-actions">
              <button type="button" className="whats-number-cancel" onClick={() => setWhatsNumberOpen(false)}>
                ביטול
              </button>
              <button type="submit" className="whats-number-submit">
                פתחו וואטסאפ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
