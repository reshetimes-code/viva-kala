"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useLocale } from "@/lib/i18n/LanguageProvider";

const COPY = {
  he: {
    alt: "קוד QR",
    shareTitle: "קוד QR",
    share: "📤 שיתוף (וואטסאפ ועוד)",
    download: "⬇️ הורדת קוד ה-QR",
  },
  en: {
    alt: "QR code",
    shareTitle: "QR code",
    share: "📤 Share (WhatsApp and more)",
    download: "⬇️ Download QR code",
  },
};

export default function QrCode({
  value,
  size = 180,
  downloadFileName,
}: {
  value: string;
  size?: number;
  /** When set, also renders a small "download" link (and, where the browser
   *  supports it, a "share" button) under the code, saving/sharing it as a
   *  PNG under this filename - for codes meant to be printed or shared (e.g.
   *  the venue table-lookup QR), rather than just viewed. */
  downloadFileName?: string;
}) {
  const { locale } = useLocale();
  const t = COPY[locale];
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  // Web Share API's file support (navigator.canShare({ files })) is what
  // lets "share" hand the actual PNG straight to WhatsApp/etc instead of
  // just a link - only real on mobile browsers, and only once dataUrl (and
  // so the file to share) actually exists. Checked once client-side rather
  // than assumed, since desktop Chrome/Firefox implement navigator.share
  // for URLs/text but not files, and would otherwise show a share button
  // that silently fails.
  const [canShareFile, setCanShareFile] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: size, margin: 1 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  useEffect(() => {
    if (!dataUrl || !downloadFileName) return;
    let cancelled = false;
    fetch(dataUrl)
      .then((r) => r.blob())
      .then((blob) => {
        if (cancelled) return;
        const file = new File([blob], `${downloadFileName}.png`, { type: "image/png" });
        const supported =
          typeof navigator !== "undefined" && !!navigator.canShare && navigator.canShare({ files: [file] });
        setCanShareFile(supported);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [dataUrl, downloadFileName]);

  async function share() {
    if (!dataUrl || !downloadFileName) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${downloadFileName}.png`, { type: "image/png" });
      await navigator.share({ files: [file], title: t.shareTitle });
    } catch {
      // User cancelled the share sheet, or the share itself failed - either
      // way there's nothing to recover: the download link right next to
      // this button still works as a fallback.
    }
  }

  if (!dataUrl) return <div style={{ width: size, height: size }} />;

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt={t.alt} width={size} height={size} style={{ borderRadius: 12 }} />
      {downloadFileName && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {canShareFile && (
            <button type="button" onClick={share} className="qr-download-link qr-share-btn">
              {t.share}
            </button>
          )}
          <a href={dataUrl} download={`${downloadFileName}.png`} className="qr-download-link">
            {t.download}
          </a>
        </div>
      )}
    </div>
  );
}
