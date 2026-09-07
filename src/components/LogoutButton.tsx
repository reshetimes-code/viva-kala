"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Small icon button for the dashboard header - clears the session cookie
 *  via the (already existing but previously unused-in-UI) /api/auth/logout
 *  route, then sends the user back to /login. */
export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      className="dash-logout-btn"
      onClick={handleLogout}
      disabled={loading}
      title="התנתקות"
      aria-label="התנתקות"
    >
      {/* Emoji door icon rendered as a blank/garbled glyph on some devices -
          a plain SVG (door-frame + exit arrow) is legible everywhere. */}
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h7" />
        <path d="M10 12h11" />
        <path d="M17 8l4 4-4 4" />
      </svg>
    </button>
  );
}
