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
      if (res.ok) {
        // router.push() alone can serve /dashboard from Next's client-side
        // Router Cache - a stale copy rendered under the PREVIOUS session,
        // from before this swapped the cookie. That's what made this look
        // broken: the first click "did nothing" (silently landed on cached,
        // wrong-session content) and only a second navigation forced a
        // fresh fetch. router.refresh() forces this one to actually re-run
        // server-side with the new session, the same fix LoginPage already
        // uses after its own fetch+cookie swap.
        router.replace("/dashboard");
        router.refresh();
      }
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
