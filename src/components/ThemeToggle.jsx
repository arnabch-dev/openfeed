import { useEffect, useState } from "react";

const SunIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
const MoonIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8.5 8.5 0 1 1 10 4a6.5 6.5 0 0 0 10 10.5Z" /></svg>
);

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  // The <html data-theme> attribute is set by an inline head script before
  // paint; read it back once we hydrate so the icon matches.
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || "light");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("feedline.theme", next); } catch {}
    setTheme(next);
  };

  const isDark = theme === "dark";
  return (
    <button
      className="btn btn-secondary"
      onClick={toggle}
      style={{ borderRadius: 999, padding: "8px 12px" }}
      title={isDark ? "Back to daylight" : "Read in the dark"}
      aria-label={isDark ? "Back to daylight" : "Read in the dark"}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
