"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/lib/i18n/LanguageProvider";

const COPY = {
  he: {
    deleteUser: "🗑️ מחיקת משתמש",
    confirmText: (username: string) =>
      `למחוק את "${username}" לצמיתות? כל ההזמנות, האישורים והשולחנות שלו יימחקו.`,
    deleting: "מוחק...",
    yesDelete: "כן, למחוק",
    cancel: "ביטול",
    deleteError: "שגיאה במחיקה",
    networkError: "שגיאת רשת",
  },
  en: {
    deleteUser: "🗑️ Delete user",
    confirmText: (username: string) =>
      `Permanently delete "${username}"? All their invites, RSVPs and tables will be deleted.`,
    deleting: "Deleting...",
    yesDelete: "Yes, delete",
    cancel: "Cancel",
    deleteError: "Error deleting user",
    networkError: "Network error",
  },
};

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
  const { locale } = useLocale();
  const t = COPY[locale];
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
        setError(data.error || t.deleteError);
        setBusy(false);
        return;
      }
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch {
      setError(t.networkError);
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button type="button" className="admin-delete-btn" onClick={() => setConfirming(true)}>
        {t.deleteUser}
      </button>
    );
  }

  return (
    <div className="admin-delete-confirm">
      <span>{t.confirmText(username)}</span>
      <div className="admin-delete-confirm-actions">
        <button type="button" className="admin-delete-btn" onClick={handleDelete} disabled={busy}>
          {busy ? t.deleting : t.yesDelete}
        </button>
        <button type="button" className="admin-cancel-btn" onClick={() => setConfirming(false)} disabled={busy}>
          {t.cancel}
        </button>
      </div>
      {error && <p className="admin-edit-msg admin-edit-msg-error">{error}</p>}
    </div>
  );
}
