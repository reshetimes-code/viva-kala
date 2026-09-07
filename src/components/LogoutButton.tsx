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
      🚪
    </button>
  );
}
