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

/** Jumps straight into another account's own dashboard - swaps the current
 *  session for that user's, then navigates to their main page. Defaults to
 *  the superadmin's impersonate route; a hall reuses this same component
 *  against its own scoped one (/api/hall/clients/[userId]/impersonate) -
 *  see HallClientCard. */
export default function ImpersonateButton({
  userId,
  endpoint,
  label,
  className,
}: {
  userId: number;
  endpoint?: string;
  label?: string;
  className?: string;
}) {
  const { locale } = useLocale();
  const t = COPY[locale];
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      const res = await fetch(endpoint ?? `/api/admin/impersonate/${userId}`, { method: "POST" });
      if (res.ok) router.push("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className={className ?? "admin-impersonate-btn"} onClick={handleClick} disabled={busy}>
      {busy ? t.entering : label ?? t.goToDashboard}
    </button>
  );
}
