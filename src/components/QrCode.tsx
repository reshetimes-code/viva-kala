"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QrCode({
  value,
  size = 180,
  downloadFileName,
}: {
  value: string;
  size?: number;
  /** When set, also renders a small "download" link under the code that
   *  saves it as a PNG under this filename - for codes meant to be printed
   *  or shared (e.g. the venue table-lookup QR), rather than just viewed. */
  downloadFileName?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

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

  if (!dataUrl) return <div style={{ width: size, height: size }} />;

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt="קוד QR" width={size} height={size} style={{ borderRadius: 12 }} />
      {downloadFileName && (
        <a href={dataUrl} download={`${downloadFileName}.png`} className="qr-download-link">
          ⬇️ הורדת קוד ה-QR
        </a>
      )}
    </div>
  );
}
