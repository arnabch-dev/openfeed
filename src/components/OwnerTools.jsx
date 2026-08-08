import { useEffect, useRef, useState } from "react";
import { apiConfigured, getToken, ownerLogin, sendInteraction } from "../lib/feedx.js";

function loadMap(k) {
  try { return JSON.parse(localStorage.getItem(k) || "{}"); } catch { return {}; }
}
function saveMap(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

// Tags for a post are stamped on its <article data-tags="a|b|c"> by DayView, so the
// interaction payload can be built from the prebuilt DOM without shipping feed data.
function tagsForArticle(article) {
  const raw = article && article.dataset ? article.dataset.tags || "" : "";
  return raw ? raw.split("|").filter(Boolean) : [];
}

// Interaction-only island. It renders the owner toggle and, when owner mode is
// on, decorates the statically-rendered articles (read / liked / hidden) by
// stamping data-attributes and updating the meta line. No feed content is
// passed to the client — it reads the prebuilt DOM.
// NOTE: owner mode is currently unguarded (no password). Gate this before
// wiring real owner-only actions.
export default function OwnerTools() {
  const [owner, setOwner] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [busy, setBusy] = useState(false);

  const ownerRef = useRef(false);
  const showHiddenRef = useRef(false);
  const read = useRef({});
  const liked = useRef({});
  const hidden = useRef({});

  const signal = (kind, id, value) => {
    try {
      const root = document.getElementById("feed-root");
      const date = root ? root.dataset.date : "";
      if (window.feedline && window.feedline[kind]) window.feedline[kind](id, date, value);
    } catch {}
  };

  // Record an interaction against FeedX. Owner-only by construction: every caller is
  // reached only in owner mode, and sendInteraction additionally no-ops without a
  // token. `kind` is a FeedX InteractionType (open | like | hide | ...).
  const fireInteraction = (kind, id) => {
    const root = document.getElementById("feed-root");
    const article = root ? root.querySelector(`article[data-id="${id}"]`) : null;
    sendInteraction(id, tagsForArticle(article), kind);
  };

  const recompute = () => {
    const root = document.getElementById("feed-root");
    if (!root) return;
    const articles = root.querySelectorAll("article[data-id]");
    const metaEl = document.getElementById("meta-line");
    const toggleEl = document.getElementById("hidden-toggle");
    const base = root.dataset.metaBase || "";

    if (!ownerRef.current) {
      root.removeAttribute("data-owner");
      root.removeAttribute("data-show-hidden");
      articles.forEach((a) => {
        a.removeAttribute("data-read");
        a.removeAttribute("data-hidden");
        const like = a.querySelector(".like-btn");
        if (like) { like.setAttribute("data-liked", "0"); const l = like.querySelector(".like-label"); if (l) l.textContent = "Like"; }
      });
      root.querySelectorAll("section.group").forEach((s) => { s.style.display = ""; });
      if (metaEl) metaEl.textContent = base;
      if (toggleEl) toggleEl.hidden = true;
      return;
    }

    root.setAttribute("data-owner", "1");
    if (showHiddenRef.current) root.setAttribute("data-show-hidden", "1");
    else root.removeAttribute("data-show-hidden");

    let hiddenCount = 0, pieces = 0, readCount = 0;
    const domains = new Set();
    articles.forEach((a) => {
      const id = a.dataset.id;
      const isHidden = !!hidden.current[id];
      const isRead = !!read.current[id];
      const isLiked = !!liked.current[id];
      if (isHidden) { a.setAttribute("data-hidden", "1"); hiddenCount++; } else a.removeAttribute("data-hidden");
      if (isRead) a.setAttribute("data-read", "1"); else a.removeAttribute("data-read");
      const like = a.querySelector(".like-btn");
      if (like) { like.setAttribute("data-liked", isLiked ? "1" : "0"); const l = like.querySelector(".like-label"); if (l) l.textContent = isLiked ? "Liked" : "Like"; }
      const shown = !(isHidden && !showHiddenRef.current);
      if (shown) { pieces++; domains.add(a.dataset.domain); if (isRead) readCount++; }
    });

    root.querySelectorAll("section.group").forEach((sec) => {
      const arts = sec.querySelectorAll("article[data-id]");
      let visible = 0;
      arts.forEach((a) => { if (!(a.hasAttribute("data-hidden") && !showHiddenRef.current)) visible++; });
      sec.style.display = visible === 0 ? "none" : "";
    });

    if (metaEl) {
      metaEl.textContent = `${pieces} ${pieces === 1 ? "piece" : "pieces"} · ${domains.size} ${domains.size === 1 ? "source" : "sources"} · ${readCount} read`;
    }
    if (toggleEl) {
      if (hiddenCount > 0) {
        toggleEl.hidden = false;
        toggleEl.textContent = showHiddenRef.current ? `hide the ${hiddenCount} you put away` : `${hiddenCount} put away`;
      } else toggleEl.hidden = true;
    }
  };

  // Wire the prebuilt DOM once, and hydrate persisted state.
  useEffect(() => {
    read.current = loadMap("feedline.read");
    liked.current = loadMap("feedline.liked");
    hidden.current = loadMap("feedline.hidden");
    try { if (sessionStorage.getItem("feedline.owner") === "1") setOwner(true); } catch {}

    const root = document.getElementById("feed-root");
    if (!root) return;

    const onClick = (e) => {
      const toggle = e.target.closest("#hidden-toggle");
      if (toggle) { setShowHidden((v) => !v); return; }
      if (!ownerRef.current) return;
      const like = e.target.closest(".like-btn");
      if (like) { flip("feedline.liked", liked, like.dataset.id, "like"); return; }
      const hide = e.target.closest(".hide-btn");
      if (hide) { flip("feedline.hidden", hidden, hide.dataset.id, "hide"); return; }
      const link = e.target.closest(".article-link");
      if (link) markRead(link.dataset.id);
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  const flip = (key, ref, id, kind) => {
    const next = { ...ref.current };
    if (next[id]) delete next[id]; else next[id] = true;
    ref.current = next;
    saveMap(key, next);
    const on = !!next[id];
    signal(kind, id, on);
    // Append-only log: only record like/hide when turning it ON (there's no
    // "unlike" event type). kind maps directly to a FeedX InteractionType.
    if (on) fireInteraction(kind, id);
    recompute();
  };
  const markRead = (id) => {
    if (read.current[id]) return;
    read.current = { ...read.current, [id]: true };
    saveMap("feedline.read", read.current);
    signal("impression", id, true);
    fireInteraction("open", id); // a click-through to read is an "open"
    recompute();
  };

  useEffect(() => { ownerRef.current = owner; recompute(); }, [owner]);
  useEffect(() => { showHiddenRef.current = showHidden; recompute(); }, [showHidden]);

  const toggleOwner = async () => {
    if (owner) {
      try { sessionStorage.removeItem("feedline.owner"); } catch {}
      setShowHidden(false); setOwner(false);
      return;
    }
    // Gate owner mode behind the FeedX admin password (verified against the API,
    // which returns a Bearer token stored for the session). If the API isn't
    // configured, fall back to the old unguarded local-only owner mode.
    if (apiConfigured() && !getToken()) {
      const password = typeof window !== "undefined" ? window.prompt("FeedX admin password") : "";
      if (!password) return;
      setBusy(true);
      let ok = false;
      try { ok = await ownerLogin(password); } catch { ok = false; }
      setBusy(false);
      if (!ok) { try { window.alert("Wrong password or FeedX unreachable."); } catch {} return; }
    }
    try { sessionStorage.setItem("feedline.owner", "1"); } catch {}
    setOwner(true);
  };

  return (
    <>
      <button className="btn btn-secondary" onClick={toggleOwner} disabled={busy} style={{ borderRadius: 999, fontSize: 13, whiteSpace: "nowrap", gap: 9, paddingLeft: 8, opacity: busy ? 0.6 : 1, cursor: busy ? "wait" : "pointer" }} title="Owner tools">
        <span style={{ width: 22, height: 22, borderRadius: 999, flex: "none", transition: "all .2s", background: owner ? "var(--color-accent)" : "var(--color-neutral-300)", boxShadow: "inset -5px -5px 0 0 " + (owner ? "var(--color-accent-2)" : "var(--color-neutral-400)") }} />
        <span>{busy ? "Checking…" : owner ? "Owner mode on" : "It's me"}</span>
      </button>
    </>
  );
}
