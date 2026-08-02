// Shared formatting helpers used by both the Astro pages (build time) and
// the interactive islands (client). No DOM or framework dependencies.

export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export const muted = (pct) => `color-mix(in srgb, var(--color-text) ${pct}%, transparent)`;

export function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

export function titleOf(it) {
  if (it.title) return it.title;
  try {
    const u = new URL(it.url);
    const rest = (u.pathname + u.hash).replace(/^\/$/, "");
    return u.hostname.replace(/^www\./, "") + rest;
  } catch { return it.url; }
}

export function fmtStamp(s) {
  const d = new Date(s);
  if (isNaN(d)) return "";
  return "gathered " + d.getDate() + " " + MONTHS[d.getMonth()].slice(0, 3) + ", " +
    String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

export function parseISO(s) { const p = s.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
export function toISO(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

export function dayLabel(iso) {
  const d = parseISO(iso);
  return d.getDate() + " " + MONTHS[d.getMonth()].slice(0, 3);
}

// URL-safe tag identity. Case-insensitive, collapses punctuation to dashes.
export function slugify(tag) {
  return String(tag).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Group a day's items by domain, largest group first (matches the design).
export function groupByDomain(items) {
  const map = new Map();
  items.forEach((it) => {
    const dm = domainOf(it.url);
    if (!map.has(dm)) map.set(dm, []);
    map.get(dm).push(it);
  });
  return Array.from(map.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([domain, list]) => ({
      domain,
      countLabel: list.length === 1 ? "1 piece" : list.length + " pieces",
      items: list,
    }));
}
