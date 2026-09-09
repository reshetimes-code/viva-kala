"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import { useLocale } from "@/lib/i18n/LanguageProvider";

const COPY = {
  he: {
    title: "חיתוך התמונה",
    hint: "גררו והתאימו את האזור - התמונה תיחתך במדוייק לגודל האזור שבו תוצג",
    alt: "לחיתוך",
    cancel: "ביטול",
    confirm: "✓ אישור חיתוך",
  },
  en: {
    title: "Crop the image",
    hint: "Drag and adjust the area - the image will be cropped exactly to the size it's shown in",
    alt: "To crop",
    cancel: "Cancel",
    confirm: "✓ Confirm crop",
  },
};

interface Props {
  imageSrc: string;
  aspectRatio: number;
  roundPreview?: boolean;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

export default function ImageCropModal({ imageSrc, aspectRatio, roundPreview, onConfirm, onCancel }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const { locale } = useLocale();
  const t = COPY[locale];

  useEffect(() => {
    if (!imgRef.current) return;
    const cropper = new Cropper(imgRef.current, {
      aspectRatio,
      viewMode: 1,
      autoCropArea: 1,
      dragMode: "move",
      background: false,
      responsive: true,
    });
    cropperRef.current = cropper;
    // cropperjs's destroy() returns the Cropper instance (for chaining),
    // not void - wrap it so the effect's cleanup return type is a real
    // Destructor instead of "() => Cropper".
    return () => {
      cropper.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc, aspectRatio]);

  function handleConfirm() {
    const canvas = cropperRef.current?.getCroppedCanvas({ maxWidth: 1400, maxHeight: 1400 });
    if (!canvas) return;
    onConfirm(canvas.toDataURL("image/jpeg", 0.9));
  }

  // Rendered via a portal straight onto document.body - rather than inline
  // wherever this component happens to sit in the tree - so this fixed,
  // full-screen overlay is never accidentally boxed in or out-stacked by an
  // ancestor's own positioning/transform/z-index (e.g. buttons elsewhere on
  // the page rendering visually "above" what should be a modal on top).
  return createPortal(
    <div className="crop-modal-overlay">
      <div className="crop-modal-box">
        <h3 className="crop-modal-title">חיתוך התמונה</h3>
        <p className="crop-modal-hint">גררו והתאימו את האזור - התמונה תיחתך במדוייק לגודל האזור שבו תוצג</p>

        <div className={`crop-modal-stage${roundPreview ? " crop-round" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={imageSrc} alt="לחיתוך" style={{ display: "block", maxWidth: "100%" }} />
        </div>

        <div className="crop-modal-actions">
          <button type="button" className="crop-btn-cancel" onClick={onCancel}>
            ביטול
          </button>
          <button type="button" className="crop-btn-confirm" onClick={handleConfirm}>
            ✓ אישור חיתוך
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
