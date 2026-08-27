"use client";

interface Guest {
  id: number;
  guestName: string;
  familyName: string;
}

/** A round table drawn with actual seats arranged around it, like guests
 *  sitting around a real table - not just a plain list of names. */
export default function RoundTable({ tableNumber, guests }: { tableNumber: string; guests: Guest[] }) {
  const size = 260;
  const radius = 108;
  const center = size / 2;

  return (
    <div className="rt-wrap" style={{ width: size, height: size }}>
      <div className="rt-table">
        <span className="rt-table-number">{tableNumber}</span>
      </div>
      {guests.map((g, i) => {
        const angle = (i / Math.max(guests.length, 1)) * 2 * Math.PI - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return (
          <div key={g.id} className="rt-seat" style={{ left: x, top: y }}>
            <div className="rt-seat-dot" />
            <span className="rt-seat-name">
              {g.guestName} {g.familyName}
            </span>
          </div>
        );
      })}
    </div>
  );
}
