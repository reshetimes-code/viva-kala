"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const ADMIN_LINKS = [
  { href: "/admin", label: "ניהול משתמשים" },
  { href: "/admin/leads", label: "לידים מהאתר" },
  { href: "/dashboard", label: "חזרה לדשבורד שלי" },
];

/** A single hamburger menu reused on every admin screen, so all admin
 *  sections stay reachable from one place instead of one-off back-links. */
export default function AdminMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

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
        </div>
      )}
    </div>
  );
}
