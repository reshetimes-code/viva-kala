"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Deletes a user account (and everything under it - invites/rsvps/tables)
 *  after an in-page confirmation. `redirectTo` lets the detail page send the
 *  admin back to the list instead of just refreshing in place. */
export default function DeleteUserButton({
  userId,
  username,
  redirectTo,
}: {
  userId: number;
  username: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה במחיקה");
        setBusy(false);
        return;
      }
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch {
      setError("שגיאת רשת");
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button type="button" className="admin-delete-btn" onClick={() => setConfirming(true)}>
        🗑️ מחיקת משתמש
      </button>
    );
  }

  return (
    <div className="admin-delete-confirm">
      <span>למחוק את &quot;{username}&quot; לצמיתות? כל ההזמנות, האישורים והשולחנות שלו יימחקו.</span>
      <div className="admin-delete-confirm-actions">
        <button type="button" className="admin-delete-btn" onClick={handleDelete} disabled={busy}>
          {busy ? "מוחק..." : "כן, למחוק"}
        </button>
        <button type="button" className="admin-cancel-btn" onClick={() => setConfirming(false)} disabled={busy}>
          ביטול
        </button>
      </div>
      {error && <p className="admin-edit-msg admin-edit-msg-error">{error}</p>}
    </div>
  );
}
