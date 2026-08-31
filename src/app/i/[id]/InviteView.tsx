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

  // Nudge people to actually RSVP - a lot of guests open the invite, look at
  // the picture and never bother confirming, which leaves the host unable to
  // plan seating. A gentle popup right on open converts a lot more of them.
  useEffect(() => {
    if (!wantRsvp) return;
    const t = setTimeout(() => setShowWelcomeAlert(true), 900);
    return () => clearTimeout(t);
  }, [wantRsvp]);

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

  // The "planning an event too?" cross-sell no longer asks guests to fill in
  // a second form - they already gave their name and phone in the RSVP form
  // above, so a "yes" here just forwards those straight to the leads table.
  async function sendLeadFromRsvp() {
    setLeadPopupSending(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${guestName} ${familyName}`.trim(), phone, sourceInviteId: id }),
      });
      setLeadPopupSent(true);
      setTimeout(() => setShowLeadPopup(false), 1400);
    } finally {
      setLeadPopupSending(false);
    }
  }

  function declineLead() {
    setShowLeadPopup(false);
  }

  const ctaColors =
    mode === "template" && templateId
      ? TEMPLATE_CTA_COLORS[templateId] ?? DEFAULT_CTA_COLORS
      // A photo invite has its own per-image accent color (gold-ish,
      // chosen to go with that specific photo) - use it here too instead
      // of one flat dark-gray bar on every single invite regardless of
      // its actual design.
      : textStyle?.accentColor
        ? { bg: `${textStyle.accentColor}dd`, color: "#1c1c1e" }
        : DEFAULT_CTA_COLORS;

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

  // No phone-frame mockup on desktop, by explicit choice - the invite
  // itself fills whatever window it's opened in, 100% width, even on a
  // wide desktop browser (object-fit: cover on the photo handles a 9:16
  // image sitting in a wider frame).

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
        <div className="lead-alert-overlay" onClick={declineLead}>
          <div className="lead-alert-card" onClick={(e) => e.stopPropagation()}>
            {leadPopupSent ? (
              <>
                <div className="lead-alert-icon">🎉</div>
                <p className="lead-alert-thanks">מעולה! ניצור איתכם קשר בקרוב</p>
              </>
            ) : (
              <>
                <h3 className="welcome-alert-subtitle">רגע לפני שממשיכים...</h3>
                <p className="welcome-alert-emphasis">חוגגים אירוע בקרוב? תרצו לקבל הטבה מיוחדת מאיתנו?</p>
                <div className="lead-alert-row">
                  <button type="button" className="lead-alert-no" onClick={declineLead}>
                    לא, תודה
                  </button>
                  <button
                    type="button"
                    className="lead-alert-yes"
                    disabled={leadPopupSending}
                    onClick={sendLeadFromRsvp}
                  >
                    כן, רוצה!
                  </button>
                </div>
              </>
            )}
          </div>
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
            <button type="button" className="back-to-inv-cta" onClick={() => setShowRsvp(false)}>
              <span className="pull-arrows">
                <i className="a1">▲</i>
                <i className="a2">▲</i>
              </span>
            </button>

            <div className="rsvp-card">
              {submitted ? (
                <div>
                  <p className="rsvp-thanks">
                    {submitted === "yes" ? "תודה שאישרתם הגעה! 🎉" : "תודה על התגובה 🙏"}
                  </p>
                  {headline && <p style={{ marginTop: 14, color: "#4a3f30" }}>{headline}</p>}
                  {eventDate && (
                    <p style={{ marginTop: 8, color: "#4a3f30" }}>
                      {formatEventDate(eventDate)} {eventStart && `בשעה ${eventStart}`}
                    </p>
                  )}
                  {showNavBtn && address && (
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18 }}>
                      <a
                        href={wazeUrl(address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-block",
                          padding: "12px 22px",
                          borderRadius: 999,
                          background: "#33ccff",
                          color: "#fff",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        ניווט ב-Waze
                      </a>
                      <a
                        href={googleMapsUrl(address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-block",
                          padding: "12px 22px",
                          borderRadius: 999,
                          background: "#4285f4",
                          color: "#fff",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
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

      <button type="button" className="blank-share-fab" onClick={() => setShareOpen(true)}>
        📤 שתפו
      </button>

      <div className={`blank-share-modal${shareOpen ? " open" : ""}`} onClick={() => setShareOpen(false)}>
        <div className="blank-share-card" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="blank-share-close" onClick={() => setShareOpen(false)}>
            ×
          </button>
          <div className="blank-share-title">שתפו את ההזמנה</div>
          <div className="blank-share-grid">
            <a className="btn-circle whatsapp" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer">
              <i>💬</i>
              <span>וואטסאפ</span>
            </a>
            <button type="button" className="btn-circle whatsapp-number" onClick={openWhatsNumberModal}>
              <i>📱</i>
              <span>וואטסאפ לאיש קשר</span>
            </button>
            <a className="btn-circle sms" href={`sms:?&body=${shareText}`}>
              <i>✉️</i>
              <span>SMS</span>
            </a>
            <button type="button" className="btn-circle copy-link-btn" onClick={copyLink}>
              <i>🔗</i>
              <span>העתקת קישור</span>
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
