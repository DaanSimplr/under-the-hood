# Architecture

A static learning site about car parts, car systems, and how cars are taken
apart and put back together. It is aimed at curious beginners and hobbyists.

This document describes how the app is put together and why. For how to add
content, see [content-guide.md](./content-guide.md). For the look of the
generated media, see [style-brief.md](./style-brief.md).

---

## 1. Goals and non-goals

**Goals**

- Teach what each part does, where it sits, how systems connect, and how a
  teardown goes step by step.
- Every technical visual is built in code (SVG or 3D) so it is accurate and
  editable.
- The site works fully without any generated footage. Generated media arrives
  later and is picked up without code changes.
- Static output, fast, accessible (WCAG AA), works at 375px wide.

**Non-goals for v1**

- No backend, accounts or sync. Progress lives in `localStorage`.
- No real 3D models. The 3D view uses primitive shapes on purpose.
- No vehicle-specific data (torque values, part numbers).

---

## 2. Stack

| Concern     | Choice                                                  | Why                                                                       |
| ----------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| Framework   | Next.js 16 (App Router), TypeScript, `output: 'export'` | Static HTML per route, React Server Components read content at build time |
| Styling     | Tailwind CSS 4, design tokens as CSS variables          | One token set drives light and dark mode                                  |
| Content     | JSON + MDX in `/content`, validated with Zod            | Typed, fails the build on bad content                                     |
| MDX         | `@mdx-js/mdx` `evaluate()` in a Server Component        | No runtime MDX cost, custom components (`<Step>`, `<DiagramFocus>`)       |
| 2D diagrams | Inline SVG + React                                      | Accurate, themable, keyboard-accessible                                   |
| 3D          | React Three Fiber + drei, lazy-loaded                   | Only loaded when the exploded view scrolls into view                      |
| State       | Zustand + `persist` → `localStorage`                    | Storage is an adapter, so a backend can replace it                        |
| Search      | Fuse.js with a prebuilt index at `/search-index.json`   | Built once at build time, fetched on first search                         |
| Quality     | ESLint, Prettier, Vitest, Playwright                    | Logic tests plus smoke tests on the built site                            |

I kept Next.js as asked. Astro would also fit a content site well. But the
explorer, quiz, progress and 3D view are all React islands that share state,
and the App Router gives that with less glue.

---

## 3. Folder layout

```
/app
  layout.tsx                 root <html>, theme script, metadata (og-image slot)
  globals.css                design tokens + Tailwind
  search-index.json/route.ts static JSON: prebuilt Fuse index
  not-found.tsx              404 page (uses the same SiteShell)
  /(site)
    layout.tsx               wraps pages in SiteShell (header, nav, search, theme toggle, footer)
    page.tsx                 Home: hero loop + entry points
    systems/page.tsx         all systems grid
    systems/[system]/page.tsx
    parts/[part]/page.tsx
    teardowns/page.tsx
    teardowns/[slug]/page.tsx
    explorer/page.tsx
    glossary/page.tsx
    quiz/page.tsx            quiz index (added for navigation)
    quiz/[system]/page.tsx
    progress/page.tsx
/content
  systems/*.json  parts/*.json  teardowns/*.mdx  quizzes/*.json
  glossary.json   hotspots.json (diagram coordinates)
/components
  media/    MediaSlot (server), VideoLoop, ImageSlot, PlaceholderMedia, StartGuide (transition)
  diagram/  CarDrawing (pure SVG), CarExplorer, PartHotspot, DiagramFocus,
            SystemDiagrams, ExplodedView (client shell) + ExplodedViewCanvas (lazy R3F chunk)
  lesson/   lesson.tsx: StepCard, ToolList, SafetyCallout, DifficultyBadge, TorqueSpec, Term
            GlossaryText (auto glossary links), mdxComponents (Step + MDX mapping)
  quiz/     QuizRunner, QuestionCard
  progress/ ProgressHydrator, StepDoneToggle, TeardownProgress, PartProgress,
            QuizBest, ProgressDashboard
  search/   SearchDialog
  ui/       SiteShell, SiteHeader, NavLinks, ThemeToggle, PageHero, Container, primitives
/lib
  schemas.ts   Zod schemas (single source for content types)
  content.ts   loads + validates all content, checks cross-references
  mdx.tsx      compiles teardown bodies with the lesson components
  assets.ts    reads assets.json, resolves slots (server only)
  media.ts     pure helpers shared by server and client (aspect parsing …)
  progress.ts  progress store (Zustand) + pure reducers
  search.ts    builds search docs and the Fuse index
  glossary.ts  links glossary terms inside plain text
  safety.ts    standard safety callout texts
  diagram.ts   diagram geometry, connection map, plain-language locations
  quiz.ts      scoring helpers
  assemblies/  data for exploded views (brake-corner)
/scripts/serve-static.mjs   tiny static server for ./out (npm start, e2e)
/public/media/assets.json    THE CONTRACT with the media agent
/tests  unit (Vitest)   /e2e  smoke (Playwright)
```

---

## 4. Content model

All content is loaded at build time by `lib/content.ts`. Every file is parsed
with a Zod schema from `lib/schemas.ts`. After parsing, the loader checks the
links between files. A bad id **fails the build** with a message that names the
file and the field.

| Type     | Source                    | Key fields                                                                                                                                                                   |
| -------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| System   | `content/systems/*.json`  | `id, name, summary, order, heroSlot, partIds[]`                                                                                                                              |
| Part     | `content/parts/*.json`    | `id, name, systemId, aka[], summary, whatItDoes, howItWorks, location, connectsTo[], failureSymptoms[], removalDifficulty, toolsNeeded[], safetyNotes[], relatedTeardowns[]` |
| Teardown | `content/teardowns/*.mdx` | frontmatter `slug, title, systemId, partIds[], difficulty, timeEstimate, tools[], safety[], heroSlot?` + MDX body of `<Step>`s                                               |
| Quiz     | `content/quizzes/*.json`  | `systemId, questions[{ prompt, options[], answerIndex, explanation, partId? }]`                                                                                              |
| Glossary | `content/glossary.json`   | `[{ id, term, aka[], definition, partId? }]`                                                                                                                                 |
| Hotspots | `content/hotspots.json`   | `[{ id, x, y }]` in the car diagram's SVG coordinates                                                                                                                        |

**Cross-reference checks** (in `content.ts`):

- `system.partIds` and `part.systemId` agree both ways.
- `system.heroSlot` and `teardown.heroSlot` exist in the asset manifest.
- `part.location` exists in `hotspots.json`.
- `part.connectsTo`, `part.relatedTeardowns`, `teardown.partIds`,
  `quiz.questions[].partId` all point at real ids.
- `answerIndex` is inside `options`.
- Each teardown body has at least one `<Step id="…">`, the step ids are
  unique, and every `<DiagramFocus part="…">` names a real part.
- Each teardown's `safety[]` includes the five core topics: `jack-stands`,
  `battery-disconnect`, `hot-fluids`, `airbags`, `ev-high-voltage`.

**Teardown MDX components**: `<Step id title>`, `<DiagramFocus part>`,
`<SafetyCallout topic>`, `<TorqueSpec fastener range?>`, `<Term id>`,
`<ExplodedView assembly>`. Steps get their number from their position (the
loader scans the step ids in body order), so authors do not number them by
hand. The number is real text, so screen readers hear "Step 3 of 12". The
step `id` is what progress tracking stores.

**Facts**: anything I was unsure of is marked `// TODO verify`. In JSON it goes
in an optional `"todo"` array (validated, not shown on the site). In MDX it is
an MDX comment `{/* TODO verify: … */}`. Torque is never given as a single
number. `<TorqueSpec>` always says "see your vehicle's manual" and can show a
broad typical range. A unit test fails if a single N·m figure appears.

---

## 5. Media layer (the contract)

`public/media/assets.json` is the **only** place that knows media paths. Pages
ask for a slot by id: `<MediaSlot id="home-hero-loop" />`.

```
page (server) ── <MediaSlot id> ── lib/assets.ts: resolveSlot(id)
                                       │  reads manifest, checks status,
                                       │  checks the file exists in /public
                                       ▼
                         ResolvedSlot { slot, available, src, webmSrc, posterSrc }
                                       │
           ┌───────────────────────────┼───────────────────────────┐
     not available               type: image                  type: video
  <PlaceholderMedia>             <ImageSlot>                  <VideoLoop> (client)
  gradient + slot id label       <img> + srcset + alt          poster first, video
                                                               when in view and motion OK
```

Rules the code follows:

- **Unknown id**: throws a clear error in development. Slots are resolved on
  the server at build time, so the same error also fails `npm run build`.
  Nothing unknown can reach a visitor.
- **Placeholder** when `status` is `placeholder`, or when the file is missing
  from `/public`. The client also falls back to the placeholder if the file
  fails to load.
- **Video**: `autoplay muted loop playsInline`, `poster`, WebM (`altPath`)
  then MP4 (`path`). The server renders the poster only. The client swaps in
  the `<video>` once it is in view (or at once for `priority` slots). With
  `prefers-reduced-motion: reduce` it stays on the poster.
- **Image**: `<img>` with `srcset`/`sizes` when the manifest lists optional
  `variants`, `loading="lazy"` unless `priority`, and the manifest's `alt`.
- **Decorative only**: slots with `alt: ""` render with `aria-hidden`.
- Adding a slot: add it to the manifest with `status: "placeholder"` and a
  one-line `brief`. Never rename or remove a slot id.

**Slot → page wiring**

| Slot                        | Where                                                                                                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `home-hero-loop`            | Home hero background                                                                                                                                                                     |
| `explorer-bg-loop`          | Behind the car diagram on `/explorer`                                                                                                                                                    |
| `workshop-ambient-loop`     | `/teardowns` header and each teardown header (default `heroSlot`)                                                                                                                        |
| `teardown-intro-transition` | Plays once when the reader presses "Start the guide", then focus moves to the steps (skipped with reduced motion; in dev the placeholder flashes briefly so its position can be checked) |
| `system-<id>-hero` (8)      | Each system page header and its card on `/systems`                                                                                                                                       |
| `og-image`                  | Open Graph / Twitter image in the root metadata (only once available)                                                                                                                    |

Swapping in real media is: drop files at the manifest paths, set `status` to
`generated` or `approved`, rebuild. No code changes.

---

## 6. Interactive diagrams

**CarDrawing** is a pure SVG side view (car faces left, viewBox
`0 0 1000 440`). It draws the body, wheels and faint outlines of the main
internals. It has no state, so it renders on the server too.

**CarExplorer** (client) draws hotspots on top, one per part, placed with
`content/hotspots.json`.

- Click, Enter or Space on a hotspot opens a details drawer (summary + link
  to the part page). Esc closes it and returns focus to the hotspot.
- Hover or focus highlights the part and the parts it connects to (both
  directions) and draws lines between them.
- System filter chips. Filtered-out hotspots are hidden from the tab order.
- A plain part list under the diagram does the same thing, which helps on
  small screens where hotspots are close together.
- Hotspot colors come from per-system tokens.

- On `/explorer`, `?part=<id>` opens a part and `?system=<id>` sets the filter.
  On a system page the explorer starts filtered to that system.

**DiagramFocus** renders the same drawing with one part highlighted, as a
server component with no client JS. Its `<title>` describes the location in
words ("in the engine bay at the front of the car, near the top"). It is used
in teardown steps and on part pages ("Where it sits").

**ExplodedView** (client) shows one assembly from `lib/assemblies/`.
The brake corner is: hub with wheel studs, disc, caliper bracket, inner pad,
outer pad, caliper. Each piece has a rest position, an explode offset and a
removal order. Unit tests check the order (caliper → pads → bracket → disc,
hub stays) and the positions (a pad on each face of the disc, hub flange
inboard). A slider (0–100%) and Assemble/Explode buttons move pieces along
their offsets. Labels are plain DOM elements positioned each frame by
projecting their 3D anchor. This keeps them crisp and theme-aware, and avoids
drei `<Html>` creating extra React roots. An ordered list beside the canvas
gives the same information as text. The Three.js chunk
(`ExplodedViewCanvas`) loads only when the view comes within 300px of the
viewport (`next/dynamic` with `ssr: false` plus an IntersectionObserver).
It renders on demand (`frameloop="demand"`). If WebGL fails, an error
boundary shows a message and the list remains.

---

## 7. State: progress

`lib/progress.ts` exposes a Zustand store:

```ts
{
  visitedParts: Record<partId, isoDate>;
  learnedParts: Record<partId, isoDate>;
  teardownSteps: Record<slug, stepId[]>;
  quizScores: Record<systemId, { best; last; total; attempts; at }>;
}
```

All changes go through pure reducer functions (unit tested). Persistence is
the `persist` middleware with a `StateStorage` adapter:
`createProgressStore(() => localStorage)` builds the app's `useProgress`.
A backend would pass another adapter (`getItem`/`setItem`/`removeItem`, sync
or async) in that one place, and no component changes. Only data is saved,
under the key `under-the-hood:progress` (version 1, ready for migrations).

The store uses `skipHydration`. `ProgressHydrator` (in the site shell)
rehydrates it after mount, so static HTML never mismatches, and
`useProgressHydrated()` lets widgets show "Loading…" instead of a false "0
done". Widgets: `PartProgress` (visit + "Mark as learned"),
`StepDoneToggle`, `TeardownProgress`, `QuizBest` and `ProgressDashboard`.

---

## 8. Search

At build time `app/search-index.json/route.ts` (forced static) collects parts,
systems, teardowns and glossary terms into small documents. It also builds a
Fuse index with `Fuse.createIndex` and writes both as JSON. The header search
dialog (Ctrl/⌘ K or `/`) fetches the file on first open and runs
`Fuse.parseIndex`, so no indexing work happens in the browser.

---

## 9. Design tokens, theming, accessibility

- Tokens live in `app/globals.css` as CSS variables (`--bg`, `--fg`,
  `--muted`, `--accent`, `--surface`, `--border`, `--focus`, and one
  `--sys-<id>` per system). They are mapped into Tailwind with `@theme`.
- Dark mode: `data-theme="light|dark"` on `<html>`. A tiny inline script sets
  it before paint, from the saved choice or `prefers-color-scheme`.
- Focus: a 3px `--focus` outline on every interactive element.
- A skip link, landmark elements, one `h1` per page, labelled controls.
- Color pairs are picked to meet 4.5:1 for text.
- Mobile-first layouts, checked at 375px.
- Jargon: `<Term>` in MDX, and `linkifyGlossary()` for plain text from JSON.
  It links the first use of each glossary term in a block.

---

## 10. Performance

- Static HTML for every route. No client JS on content-only sections.
- System fonts (no font download).
- Videos never block first paint: the poster is server-rendered, the video is
  attached after hydration and only when in view.
- Three.js is in its own chunk and only loads on pages with an exploded view,
  when it scrolls into view.
- The search index is fetched only when search opens.
- Base CSS lives in cascade layers (`@layer base/components`), so Tailwind
  utilities always win. Unlayered element rules would silently override them.

Measured with Lighthouse 12 (mobile, simulated throttling) on the static build
served with gzip (`npm start`), with all media still placeholders: **performance
97**, accessibility 100, best practices 96, LCP 2.6 s, TBT 40 ms, CLS 0. Serve
the site compressed (any CDN or static host does). Without compression the
same page scores about 81.

---

## 11. Testing

- **Vitest** (`tests/`): content validation and cross-refs, asset resolution
  (placeholder rules, unknown ids), progress reducers, quiz scoring, search,
  glossary linking, aspect parsing, assembly order.
- **Playwright** (`e2e/`): runs against the static export (`out/`) on a small
  Node static server. It covers home, systems, a part page, a teardown, the
  explorer (mouse and keyboard), a quiz, search, the theme toggle, and no
  horizontal scroll at 375px.

---

## 12. Build plan (first pass)

1. Scaffold: Next.js, TypeScript, Tailwind tokens, layout, nav, dark mode, tooling.
2. Schemas + loaders + seed content (8 systems, 25 parts, 2 teardowns, 8 quizzes, ~30 glossary terms).
3. MediaSlot + wire every manifest slot.
4. CarExplorer (SVG) + ExplodedView (brake corner).
5. Progress store, search, quiz runner.
6. Docs: this file, `content-guide.md`, stub `style-brief.md`.
7. Tests + green `npm run build`.

Each step is one git commit.
