"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/lib/i18n/LanguageProvider";

const COPY = {
  he: {
    entering: "נכנס...",
    goToDashboard: "🔑 לעמוד הראשי שלו",
  },
  en: {
    entering: "Entering...",
    goToDashboard: "🔑 Go to their dashboard",
  },
};

/** Jumps the admin straight into an event owner's own dashboard - swaps the
 *  admin's session for that user's, then navigates to their main page. */
export default function ImpersonateButton({ userId }: { userId: number }) {
  const { locale } = useLocale();
  const t = COPY[locale];
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/impersonate/${userId}`, { method: "POST" });
      if (res.ok) router.push("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="admin-impersonate-btn" onClick={handleClick} disabled={busy}>
      {busy ? t.entering : t.goToDashboard}
    </button>
  );
}
