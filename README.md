# Under the Hood

A static learning site about car parts, and about how cars are built and taken
apart. It is for curious beginners and hobbyists.

- Next.js 16 (App Router, static export), TypeScript, Tailwind CSS 4
- Content in `/content` (JSON + MDX), validated with Zod
- SVG car explorer, and lazy-loaded React Three Fiber views: a whole car that
  comes apart and an exploded brake corner
- Progress in `localStorage` (Zustand), search with a prebuilt Fuse.js index

## Run it

```bash
npm install
npm run dev            # http://localhost:3000
```

```bash
npm run build          # static site in ./out (validates all content first)
npm start              # serve ./out at http://localhost:4173
```

## Check it

```bash
npm test               # Vitest: content validation + logic
npm run lint           # ESLint
npm run typecheck      # TypeScript
npx playwright install chromium   # once
npm run test:e2e       # Playwright smoke tests (builds and serves ./out)
```

## Docs

- [docs/architecture.md](docs/architecture.md): how it fits together
- [docs/content-guide.md](docs/content-guide.md): how to add a part, guide, quiz or term
- [docs/style-brief.md](docs/style-brief.md): look of the generated media (filled in by the media agent)

## Media

All media goes through `public/media/assets.json`. To add real footage, drop
the files at the paths listed there, set the slot's `status` to `generated` or
`approved`, and rebuild. No code changes are needed.
