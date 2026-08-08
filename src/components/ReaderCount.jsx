import { useEffect, useState } from "react";

// Live, global "N reading now" badge.
//
// Uses Appwrite's Presences API with an anonymous guest session — no login, no API
// key. Runs entirely in the browser (island), so it's safe on a static SSG site:
// nothing here touches `window` during render (count starts null), so it can hydrate
// via client:idle. The Appwrite SDK is imported dynamically inside the effect so it
// never ends up in the SSG build.
//
// Requirements (see .env.example): Appwrite server >= 1.9.5 and a Web platform
// registered for this origin. If anything is missing or errors, the badge silently
// renders nothing — it must never disrupt reading.
//
// Scope: global. Every reader upserts one presence tagged { channel: "site" } and we
// count distinct online users across the whole site.
export default function ReaderCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    const endpoint = import.meta.env.PUBLIC_APPWRITE_ENDPOINT;
    const project = import.meta.env.PUBLIC_APPWRITE_PROJECT_ID;
    if (!endpoint || !project) return;

    let cancelled = false;

    (async () => {
      let sdk;
      try {
        sdk = await import("appwrite");
      } catch {
        return; // SDK not installed
      }
      const { Client, Account, Presences, ID, Permission, Role } = sdk;
      if (!Presences) return; // SDK/server too old for the Presences API

      const client = new Client().setEndpoint(endpoint).setProject(project);
      const account = new Account(client);

      // Reuse an existing session, else create an anonymous one — then read the
      // user id, which we need to grant ourselves update on our presence.
      let me;
      try {
        me = await account.get();
      } catch {
        try {
          await account.createAnonymousSession();
          me = await account.get();
        } catch {
          return; // anonymous auth blocked / origin not registered
        }
      }
      if (cancelled || !me) return;

      const presences = new Presences(client);

      // 1. Announce ourselves once. read(any) so everyone can count us; update for
      //    OUR user to avoid any auth issue writing our own presence. No delete /
      //    heartbeat — the presence auto-expires, so cleanup takes care of itself.
      try {
        await presences.upsert({
          presenceId: ID.unique(),
          status: "online",
          metadata: { channel: "site" },
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          permissions: [Permission.read(Role.any()), Permission.update(Role.user(me.$id))],
        });
      } catch {}
      if (cancelled) return;

      // 2. List once — a snapshot of who's here (including us). That's it.
      try {
        const res = await presences.list({ total: true });
        const list = res && res.presences ? res.presences : [];
        const users = new Set(list.map((p) => p.userId || p.$id));
        setCount(users.size);
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Hide the badge entirely when nobody's reading.
  if (count == null || count < 1) return null;

  return (
    <span className="reader-badge" title="People reading now">
      <span className="reader-dot" />
      {count} reading now
    </span>
  );
}
