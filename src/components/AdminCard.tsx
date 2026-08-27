"use client";

import { useState, type ReactNode } from "react";

/** A responsive stand-in for a wide data table: shows one key line up front
 *  and reveals the rest of the fields in a dropdown on tap, so admin screens
 *  never need horizontal scrolling inside the narrow phone-frame view. */
export function AdminCard({
  title,
  subtitle,
  badge,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`admin-card${open ? " is-open" : ""}`}>
      <button type="button" className="admin-card-summary" onClick={() => setOpen((v) => !v)}>
        <span className="admin-card-summary-text">
          <span className="admin-card-title">{title}</span>
          {subtitle && <span className="admin-card-subtitle">{subtitle}</span>}
        </span>
        {badge}
        <span className="admin-card-chevron">▾</span>
      </button>
      {open && <div className="admin-card-body">{children}</div>}
    </div>
  );
}

export function AdminCardRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="admin-card-row">
      <span className="admin-card-row-label">{label}</span>
      <span className="admin-card-row-value">{value}</span>
    </div>
  );
}
