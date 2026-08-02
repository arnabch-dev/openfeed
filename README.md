<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/header/graph.svg?title=openfeed&subtitle=Everything+worth+reading,+gathered+by+date&align=left&mode=dark" />
    <img alt="openfeed" src="https://shieldcn.dev/header/graph.svg?title=openfeed&subtitle=Everything+worth+reading,+gathered+by+date&align=left&mode=light" />
  </picture>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Astro-BC52EE.svg?logo=astro&variant=ghost&size=xs&mode=dark" />
    <img alt="Astro" src="https://shieldcn.dev/badge/Astro-BC52EE.svg?logo=astro&variant=ghost&size=xs&mode=light" />
  </picture>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/React-149ECA.svg?logo=react&variant=ghost&size=xs&mode=dark" />
    <img alt="React" src="https://shieldcn.dev/badge/React-149ECA.svg?logo=react&variant=ghost&size=xs&mode=light" />
  </picture>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/TypeScript-3178C6.svg?logo=typescript&variant=ghost&size=xs&mode=dark" />
    <img alt="TypeScript" src="https://shieldcn.dev/badge/TypeScript-3178C6.svg?logo=typescript&variant=ghost&size=xs&mode=light" />
  </picture>
</p>

**openfeed** is a personalized reading feed. Everything worth reading from the sources you keep is gathered and laid out one day at a time — a calm, static page for each date instead of an infinite scroll.

> You know *what* to read, *where* to read, and *how much* to read. But the amount of content piling up — especially in this AI race — is a lot. So why not hand all the hard work to **openfeed** and **FeedX**?

The site is built with [Astro](https://astro.build) and follows an **island architecture**: every day and every tag is a fully pre-rendered static HTML page, and only the small interactive pieces (theme, calendar, owner tools) ship as client-side React. No feed content is fetched or re-rendered in the browser.

## Built with

openfeed is only the reading surface. The gathering, crawling, and distilling underneath are powered by a few frameworks I built recently to solve this problem efficiently:

<p>
  <a href="https://github.com/ArnabChatterjee20k/FeedX">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/FeedX-core%20engine-8c491a.svg?logo=github&variant=ghost&size=xs&mode=dark" />
      <img alt="FeedX — core engine" src="https://shieldcn.dev/badge/FeedX-core%20engine-8c491a.svg?logo=github&variant=ghost&size=xs&mode=light" />
    </picture>
  </a>
  <a href="https://github.com/ArnabChatterjee20k/Scout">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Scout-framework-56633f.svg?logo=github&variant=ghost&size=xs&mode=dark" />
      <img alt="Scout — framework" src="https://shieldcn.dev/badge/Scout-framework-56633f.svg?logo=github&variant=ghost&size=xs&mode=light" />
    </picture>
  </a>
  <a href="https://github.com/ArnabChatterjee20k/domdistill">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/domdistill-framework-56633f.svg?logo=github&variant=ghost&size=xs&mode=dark" />
      <img alt="domdistill — framework" src="https://shieldcn.dev/badge/domdistill-framework-56633f.svg?logo=github&variant=ghost&size=xs&mode=light" />
    </picture>
  </a>
</p>

- **[FeedX](https://github.com/ArnabChatterjee20k/FeedX)** — the core engine that gathers, scores, and produces the daily feed.
- **[Scout](https://github.com/ArnabChatterjee20k/Scout)** — a framework for collecting sources.
- **[domdistill](https://github.com/ArnabChatterjee20k/domdistill)** — a framework for distilling pages down to their readable substance.

## Features

- **A page per day** — each date is its own pre-rendered URL (`/2026-07-25`), grouped by source, largest source first.
- **Tag pages** — every tag is its own static page (`/tag/databases`) aggregating matches across every day.
- **Calendar** — jump to any day that has a feed; days without one are dimmed.
- **Light & dark** — theme is applied before first paint (no flash) and persists across navigations.
- **Owner tools** — a private mode to track what you've read and to like or hide items, kept in your browser only. Everyone else reads along freely.

## How it works

Content comes from JSON files in `feeds/`, one per day:

```jsonc
// feeds/2026-07-25.json
{
  "date": "2026-07-25",
  "generated_at": "2026-07-25T17:40:02Z",
  "count": 10,
  "items": [
    {
      "id": "6a53b068397fe94a8582",
      "url": "https://browser.engineering/",
      "title": null,
      "summary": "A modern web browser book that explains its components and architecture.",
      "tags": ["web", "browsers", "programming"],
      "scraped_at": "2026-07-12T15:19:02Z"
    }
  ]
}
```

At build time, `getStaticPaths` reads every file and emits one static page per date and per tag. Drop a new `YYYY-MM-DD.json` into `feeds/` and it becomes its own page on the next build — the number of days can grow without adding any client-side cost.

These `feeds/` files are **auto-populated**: this repo is the public template, while the actual daily feeds live in a separate **private fork** where [FeedX](https://github.com/ArnabChatterjee20k/FeedX) writes a fresh JSON file on a schedule and rebuilds. The public repo stays clean; the real reading lives privately.

### Interaction islands

Only three small React components hydrate, and none of them carry feed content:

| Island | Responsibility |
| :----- | :------------- |
| `ThemeToggle` | Flips `<html data-theme>` and persists the choice. |
| `Calendar` | Renders the date picker and navigates to prebuilt pages (carries only the list of dates). |
| `OwnerTools` | Decorates the static article DOM with read / liked / hidden state. |

## Project structure

```text
/
├── feeds/                  # one JSON file per day (the data)
├── src/
│   ├── components/
│   │   ├── DayView.astro    # static day view (no hydration)
│   │   ├── ThemeToggle.jsx  # island
│   │   ├── Calendar.jsx     # island
│   │   └── OwnerTools.jsx   # island
│   ├── layouts/Layout.astro
│   ├── lib/
│   │   ├── feeds.js         # build-time feed loader + tag index
│   │   └── format.js        # shared formatting helpers
│   ├── pages/
│   │   ├── index.astro      # latest day
│   │   ├── [date].astro     # a page per date
│   │   └── tag/[tag].astro  # a page per tag
│   └── styles/openfeed.css  # design tokens + component classes
└── astro.config.mjs
```

## Commands

All commands are run from the root of the project:

| Command            | Action                                       |
| :----------------- | :------------------------------------------- |
| `npm install`      | Install dependencies                         |
| `npm run dev`      | Start the dev server at `localhost:4321`     |
| `npm run build`    | Build the static site to `./dist/`           |
| `npm run preview`  | Preview the production build locally         |

> **Note:** owner mode is currently unguarded (no password). Gate it before wiring any real owner-only actions.
