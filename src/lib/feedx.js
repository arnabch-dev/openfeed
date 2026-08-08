// Client-side bridge to the FeedX API for owner-mode interactions.
//
// openfeed is a static site on a different origin than FeedX, so we can't rely on
// FeedX's SameSite=Lax httponly cookie. Instead the owner logs in with the FeedX
// admin password, we store the returned JWT in sessionStorage, and send it as a
// Bearer token on interaction POSTs. All of this runs only in the browser (islands).

const API = (import.meta.env.PUBLIC_FEEDX_API_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "feedx.token";

export function apiConfigured() {
  return !!API;
}

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
}

// Verify the FeedX admin password and stash the token. Returns true on success.
export async function ownerLogin(password) {
  if (!API) throw new Error("PUBLIC_FEEDX_API_URL is not set");
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) return false;
  const data = await res.json().catch(() => ({}));
  if (data && data.token) {
    setToken(data.token);
    return true;
  }
  return false;
}

// Record an interaction against a Content item. `kind` is a FeedX InteractionType
// (impression | open | read | like | bookmark | share | hide). No-op (returns false)
// unless the API is configured, we hold a token, and we have an id + tags. Failures
// are swallowed so reading is never disrupted by a logging hiccup.
export async function sendInteraction(id, tags, kind) {
  const token = getToken();
  if (!API || !token || !id || !Array.isArray(tags) || tags.length === 0) return false;
  try {
    const res = await fetch(`${API}/interactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, interaction: kind, tags }),
    });
    if (res.status === 401) setToken(""); // token expired/invalid — force re-login
    return res.ok;
  } catch {
    return false;
  }
}
