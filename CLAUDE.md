# Project context: Under the Hood

This file is standing background about the project. It is not a task. The
request in the chat is the task; use this file to carry it out in a way that
fits the rest of the codebase.

"Under the Hood" is a static learning site about car parts for beginners. It is
Next.js 16 (App Router) with `output: "export"`, TypeScript strict, Tailwind
CSS 4, content as JSON and MDX validated with Zod, Zustand for progress,
Fuse.js for search, and a lazy React Three Fiber exploded view.

The owner keeps asking for changes over many sessions, so the priority is that
the codebase stays consistent: a change should look like it was written by the
same person who wrote the rest.

## Read first

Before changing anything, read [docs/architecture.md](docs/architecture.md),
and [docs/content-guide.md](docs/content-guide.md) if the change touches
`/content`. They are the source of truth for structure and rules. If a change
makes either one inaccurate, update it in the same change.

## How the code is organised, and why it matters

- **Static export.** There is no server at runtime, so no API routes, server
  actions, cookies, or request-time data. Every dynamic route needs
  `generateStaticParams` and `dynamicParams = false`. Internal links end with a
  trailing slash.
- **Server by default.** Pages are Server Components that read content through
  `lib/content.ts`. Add `"use client"` only to the smallest component that
  needs interactivity, and pass it plain serialisable data. Never import
  `lib/content.ts` or `lib/assets.ts` (they use `node:fs`) into client code.
- **Logic lives in `/lib` as pure functions**, because Vitest only runs
  `tests/**/*.test.ts` in a node environment. Components stay thin. New logic
  gets a unit test.
- **Content types come only from `lib/schemas.ts`.** To change the shape of
  content, change the schema, the cross-reference checks in `lib/content.ts`,
  the content files, and the content guide together.
- **Media goes only through `<MediaSlot id>` and `public/media/assets.json`.**
  Never hard-code a media path, and never rename or remove a slot id.
  `docs/style-brief.md`, `docs/prompt-log.md` and the files under
  `public/media` belong to a separate media agent; leave them alone unless
  asked.
- **Colours come from the tokens in `app/globals.css`** (light and dark), used
  through Tailwind classes or `var()`. No new raw hex values in components.
  Base CSS stays inside `@layer`, otherwise it silently overrides Tailwind
  utilities.
- **Reuse what exists before adding anything:** `components/ui/primitives.tsx`,
  `cn` from `lib/cn.ts`, `systemColor` from `lib/systems.ts`, and the `@/`
  import alias. New components go in the matching `components/<area>` folder.
- **Stored ids are permanent.** Ids (parts, systems, teardown slugs, step ids,
  slot ids) and the localStorage key `under-the-hood:progress` are saved in
  visitors' browsers. Do not rename them. If the stored progress shape changes,
  bump the version and write a migration.
- **Content is plain language for beginners.** Never invent numbers such as
  torque values or part numbers; mark anything uncertain with "TODO verify" as
  the content guide describes.
- **Accessible and mobile-first:** one `h1` per page, keyboard support, visible
  focus, reduced motion respected, no horizontal scroll at 375px.

## How to work

- Make the smallest change that fully does what was asked. Do not refactor,
  rename, reformat or "improve" code that was not mentioned; if something looks
  worth fixing, say so at the end instead.
- Do not add a dependency without asking first and saying why the existing
  stack cannot do it.
- When replacing something, delete the old version. No dead code,
  commented-out blocks, or duplicate components.
- If the request is ambiguous or conflicts with the docs, ask before building.
- The working tree may contain uncommitted work from the media agent. Do not
  revert, tidy or commit it.

## Before saying it is done

Run these and report which ran and what they showed, including anything that
failed or was skipped:

```bash
npm run typecheck
npm run lint
npm test
npm run format:check
```

For changes to pages or interactive components, also run:

```bash
npm run build
npm run test:e2e
```
