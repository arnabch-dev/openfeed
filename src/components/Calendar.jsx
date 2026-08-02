import { useMemo, useState } from "react";
import { MONTHS, muted, parseISO, toISO } from "../lib/format.js";

const CalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="4" /><path d="M8 3v4M16 3v4M3 11h18" /></svg>
);

// Interaction-only island: the calendar popover. It receives the list of
// dates that have a feed (small metadata, not content) and navigates to the
// matching prebuilt page when a day is picked.
export default function Calendar({ dates = [], current, latest }) {
  const has = useMemo(() => new Set(dates), [dates]);
  const start = parseISO(current);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(start.getMonth());
  const [year, setYear] = useState(start.getFullYear());

  const go = (d) => { window.location.href = "/" + d; };

  const cells = useMemo(() => {
    const lead = new Date(year, month, 1).getDay();
    const nDays = new Date(year, month + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < lead; i++) out.push({ key: "lead" + i, empty: true });
    for (let n = 1; n <= nDays; n++) {
      const iso = toISO(new Date(year, month, n));
      out.push({ key: iso, label: n, iso, has: has.has(iso), sel: iso === current });
    }
    return out;
  }, [month, year, has, current]);

  return (
    <>
      <button
        className="cal-btn"
        onClick={() => setOpen((v) => !v)}
        style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, padding: "5px 14px 5px 12px", borderRadius: 999, transition: "all .15s", background: open ? "var(--color-neutral-200)" : "transparent", color: muted(70), border: "1px solid " + (open ? "var(--color-accent-300)" : "var(--color-divider)") }}
      >
        <CalIcon />
        <span>{open ? "Close" : "Pick a date"}</span>
      </button>

      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 10, zIndex: 30, background: "var(--color-neutral-100)", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-lg)", padding: "18px 20px", boxShadow: "var(--shadow-lg)", width: 320, animation: "fl-rise .18s ease-out" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <button className="btn btn-ghost" onClick={() => { setMonth((m) => m === 0 ? 11 : m - 1); setYear((y) => month === 0 ? y - 1 : y); }} style={{ borderRadius: 999, padding: "4px 10px" }}>&larr;</button>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{MONTHS[month] + " " + year}</span>
            <button className="btn btn-ghost" onClick={() => { setMonth((m) => m === 11 ? 0 : m + 1); setYear((y) => month === 11 ? y + 1 : y); }} style={{ borderRadius: 999, padding: "4px 10px" }}>&rarr;</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.5, marginBottom: 4, textAlign: "center" }}>
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {cells.map((c) => c.empty ? (
              <span key={c.key} style={{ height: 34 }} />
            ) : (
              <button
                key={c.key}
                onClick={c.has ? () => go(c.iso) : undefined}
                disabled={!c.has}
                style={{ height: 34, borderRadius: 999, fontFamily: "var(--font-body)", fontSize: 13, transition: "all .15s", cursor: c.has ? "pointer" : "default", background: c.sel ? "var(--color-accent)" : c.has ? "var(--color-accent-2-200)" : "transparent", color: c.sel ? "var(--color-bg)" : c.has ? "var(--color-accent-2-800)" : muted(30), border: "1px solid " + (c.sel ? "var(--color-accent)" : "transparent"), fontWeight: c.has ? 600 : 400 }}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 14 }}>
            <span style={{ fontSize: 11.5, color: muted(55) }}>Sage days have a feed waiting.</span>
            <button className="btn btn-ghost" onClick={() => go(latest)} style={{ borderRadius: 999, fontSize: 12, textDecoration: "underline", padding: "4px 8px" }}>Today</button>
          </div>
        </div>
      )}
    </>
  );
}
