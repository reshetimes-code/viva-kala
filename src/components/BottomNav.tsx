import Link from "next/link";

/** Fixed bottom action bar for the logged-in area, so the most important
 *  actions for the one invite an account owns are always one tap away -
 *  instead of scrolling back up to a card full of buttons. */
export default function BottomNav({ inviteId }: { inviteId: string }) {
  return (
    <nav className="bottom-nav">
      <Link href="/dashboard" className="bottom-nav-item">
        <span className="bottom-nav-icon">🏠</span>
        <span>ראשי</span>
      </Link>
      <Link href={`/dashboard/${inviteId}/guests`} className="bottom-nav-item">
        <span className="bottom-nav-icon">🪑</span>
        <span>אורחים</span>
      </Link>
      <Link href={`/dashboard/${inviteId}/edit`} className="bottom-nav-item">
        <span className="bottom-nav-icon">✏️</span>
        <span>עריכה</span>
      </Link>
      <Link href={`/i/${inviteId}`} className="bottom-nav-item">
        <span className="bottom-nav-icon">👁</span>
        <span>ההזמנה</span>
      </Link>
    </nav>
  );
}
