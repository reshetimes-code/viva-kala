"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ADMIN_LINKS = [
  { href: "/admin", label: "ניהול משתמשים" },
  { href: "/admin/leads", label: "לידים מהאתר" },
];

/** A single hamburger menu reused on every admin screen, so all admin
 *  sections stay reachable from one place instead of one-off back-links. */
export default function AdminMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Clears both the regular session cookie and the superadmin cookie (see
  // /api/auth/logout) - a single logout works no matter which of the two
  // doors (oren's own login, or /superadmin) got you in here.
  async function handleLogout() {
    setOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="admin-menu" ref={ref}>
      <button
        type="button"
        className="admin-menu-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="תפריט ניהול"
      >
        ☰
      </button>
      {open && (
        <div className="admin-menu-dropdown">
          {ADMIN_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="admin-menu-link" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <button type="button" className="admin-menu-link admin-menu-logout" onClick={handleLogout}>
            יציאה
          </button>
        </div>
      )}
    </div>
  );
}
