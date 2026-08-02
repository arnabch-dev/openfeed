// Loads every day's feed from the JSON files in /feeds at build time.
// Each file looks like { date, generated_at, count, items: [...] }.
// Everything here runs at build time only — none of it ships to the client.
import { slugify } from "./format.js";

const modules = import.meta.glob("/feeds/*.json", { eager: true });

function normalize(day) {
  return {
    date: day.date,
    summary: day.summary || "",
    generated_at: day.generated_at || null,
    items: Array.isArray(day.items) ? day.items : [],
  };
}

// Newest day first.
export function getFeed() {
  return Object.values(modules)
    .map((m) => m.default || m)
    .filter((d) => d && d.date && Array.isArray(d.items))
    .map(normalize)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Ascending list of every date that has a feed.
export function getDates() {
  return getFeed().map((d) => d.date).sort();
}

export function getLatestDate() {
  const dates = getDates();
  return dates.length ? dates[dates.length - 1] : null;
}

export function getDay(date) {
  return getFeed().find((d) => d.date === date) || null;
}

// { earlier, later } — the adjacent dates in chronological order, or null.
export function getAdjacent(date) {
  const dates = getDates();
  const i = dates.indexOf(date);
  return {
    earlier: i > 0 ? dates[i - 1] : null,
    later: i >= 0 && i < dates.length - 1 ? dates[i + 1] : null,
  };
}

// slug -> { slug, name, results: [{ date, item }] }, results newest-first.
export function getTagIndex() {
  const feed = getFeed(); // already newest-first
  const map = new Map();
  feed.forEach((day) => {
    day.items.forEach((it) => {
      const seen = new Set();
      it.tags.forEach((t) => {
        const slug = slugify(t);
        if (!slug || seen.has(slug)) return;
        seen.add(slug);
        if (!map.has(slug)) map.set(slug, { slug, name: t, results: [] });
        map.get(slug).results.push({ date: day.date, item: it });
      });
    });
  });
  return map;
}
