"use client";

import { useEffect, useState } from "react";

/** Wraps internal app pages (dashboard, guest manager, admin, create forms)
 *  in the same phone-frame mockup used for the guest-facing invite view,
 *  whenever they're opened on a desktop browser - the whole product stays
 *  "an app on a phone" even when someone's testing it from a laptop. */
export default function DesktopPhoneWrapper({
  children,
  title = "VIVA",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const [desktopWrap, setDesktopWrap] = useState(false);
  const [iframeSrc, setIframeSrc] = useState("");

  useEffect(() => {
    function isMobileUA() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    function isInIframe() {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    }
    const params = new URLSearchParams(window.location.search);
    if (!isInIframe() && !isMobileUA() && window.innerWidth > 768 && !params.has("mobile")) {
      const sep = window.location.search ? "&" : "?";
      setIframeSrc(`${window.location.pathname}${window.location.search}${sep}mobile=true`);
      setDesktopWrap(true);
    }
  }, []);

  if (!desktopWrap) return <>{children}</>;

  return (
    <div className="desktop-wrapper">
      <div className="mobile-frame">
        <div className="desktop-title">{title}</div>
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
