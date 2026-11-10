# Content guide

How to add or change parts, systems, teardown guides, quizzes and glossary
terms. All content lives in `/content`, and every file is checked when you run
`npm run build` or `npm test`. If something is wrong, the build stops and
tells you the file and the field.

> **Golden rules**
>
> 1. Plain language. Write for a curious beginner. Explain a term the first
>    time, or make sure it is in the glossary.
> 2. Never invent numbers. No torque values, part numbers or intervals unless
>    you are sure. Use a broad range with "see your vehicle's manual", or leave
>    it out.
> 3. Mark anything you are unsure of with `// TODO verify` (see below).
> 4. Technical pictures are made in code (SVG or 3D), never generated images.

---

## Ids

Ids are `kebab-case` (`brake-pads`, `fuel-exhaust`). The file name must match
the id: `content/parts/brake-pads.json` has `"id": "brake-pads"`. Never rename
an id that is already published. Progress saved in people's browsers and links
from other pages use it.

---

## Add a part

1. **Create `content/parts/<id>.json`:**

   ```json
   {
     "id": "oil-pump",
     "name": "Oil pump",
     "systemId": "engine",
     "aka": ["lubrication pump"],
     "summary": "One sentence: what it is.",
     "whatItDoes": "A short paragraph: its job in the car.",
     "howItWorks": "A short paragraph: how it does that job.",
     "location": "oil-pump",
     "connectsTo": ["engine-block"],
     "failureSymptoms": ["Low oil pressure warning light"],
     "removalDifficulty": 4,
     "toolsNeeded": ["Socket set", "Torque wrench"],
     "safetyNotes": ["Let the engine cool before draining oil."],
     "relatedTeardowns": [],
     "todo": ["// TODO verify: anything you are unsure of"]
   }
   ```

   | Field               | Notes                                                                     |
   | ------------------- | ------------------------------------------------------------------------- |
   | `systemId`          | One of the 8 system ids.                                                  |
   | `location`          | A hotspot id in `content/hotspots.json` (step 3).                         |
   | `connectsTo`        | Other part ids. Links are shown both ways, so list each pair once.        |
   | `removalDifficulty` | 1 (beginner) to 5 (expert).                                               |
   | `relatedTeardowns`  | Teardown slugs.                                                           |
   | `todo`              | Optional. Not shown on the site. Each entry starts with `// TODO verify`. |

2. **Add the id to the system's `partIds`** in `content/systems/<system>.json`.
   The order there is the order on the system page.

3. **Place it on the diagram.** Add `{ "id": "oil-pump", "x": 260, "y": 300 }`
   to `content/hotspots.json`. Coordinates are in the car drawing's
   `1000 × 440` viewBox. The car faces left, the front wheel centre is at
   `(230, 352)` and the rear wheel centre is at `(780, 352)`. Keep hotspots at
   least ~40 units apart. Check it at `/explorer`.

4. **Optional: add a quiz question** with `"partId": "oil-pump"`, and a glossary
   entry if the part has a jargon name.

5. Run `npm test`.

---

## Add a teardown guide

Create `content/teardowns/<slug>.mdx`:

```mdx
---
slug: replace-spark-plugs
title: Replace spark plugs
summary: One or two sentences for the guide list.
systemId: engine
partIds: [spark-plug, engine-block]
difficulty: 2
timeEstimate: 30–60 minutes
heroSlot: workshop-ambient-loop # optional, defaults to this
tools:
  - Spark plug socket
  - Torque wrench
safety:
  - topic: jack-stands
    note: Not needed for this job. The car stays on its wheels.
  - topic: battery-disconnect
  - topic: hot-fluids
    note: Only work on a cold engine.
  - topic: airbags
    note: No airbag parts involved.
  - topic: ev-high-voltage
    note: Hybrids have plugs too, but never touch orange cables.
---

Intro paragraph. Link jargon with <Term id="torque">torque</Term>.

<Step id="cool-down" title="Let the engine cool">

Markdown goes here. Leave a blank line after the opening tag and before
the closing tag, or the markdown will not be formatted.

<DiagramFocus part="spark-plug" />

<TorqueSpec fastener="Spark plugs" />

</Step>
```

**Safety is required.** Every guide must list all five core topics:
`jack-stands`, `battery-disconnect`, `hot-fluids`, `airbags`,
`ev-high-voltage`. Add a `note` to say how each applies to this job, even when
it is "not needed for this job". Extra topics: `brake-dust`, `eye-protection`,
`spring-tension`. The standard texts live in `lib/safety.ts`.

**Components you can use in MDX**

| Component                                  | What it does                                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `<Step id="…" title="…">…</Step>`          | One numbered step with a "Done" checkbox. `id` must be unique and stable.                       |
| `<DiagramFocus part="…" />`                | Car diagram with that part highlighted.                                                         |
| `<ExplodedView assembly="brake-corner" />` | The 3D exploded view (lazy-loaded).                                                             |
| `<SafetyCallout topic="…" />`              | Standard callout. Put children inside to replace the text.                                      |
| `<TorqueSpec fastener="…" range="…" />`    | Always says "see your vehicle's manual". `range` is optional and must be a broad typical range. |
| `<Term id="…">word</Term>`                 | Links a word to the glossary entry.                                                             |

Comments use MDX syntax: `{/* TODO verify: … */}`. They are not shown on the
site.

Step numbers come from the order of the steps. Don't number them by hand.
Changing a step's `id` resets that step for anyone who already ticked it.

Then add the slug to `relatedTeardowns` on the main parts.

---

## Add a quiz question

Edit `content/quizzes/<systemId>.json`:

```json
{
  "prompt": "What does the thermostat do?",
  "options": ["…", "…", "…", "…"],
  "answerIndex": 0,
  "explanation": "Shown after answering. Say why the answer is right.",
  "partId": "thermostat"
}
```

`answerIndex` starts at 0. Each quiz needs at least 3 questions. Keep wrong
options plausible but clearly wrong once you know the answer.

---

## Add a glossary term

Add to `content/glossary.json`:

```json
{ "id": "torque", "term": "Torque", "aka": [], "definition": "…", "partId": "optional-part-id" }
```

Terms and their `aka` aliases are **linked automatically** the first time they
appear in a part's or system's text (plurals included). Avoid aliases that are
everyday words or mean something else in another context. For example,
"rotor" also names a part inside the alternator, so the brake entry uses
"Brake rotor".

---

## Add a system

The eight systems are fixed in `lib/schemas.ts` (`SYSTEM_IDS`). Adding one
means adding it there, adding a `--sys-<id>` color in `app/globals.css` (light
and dark), a JSON file in `content/systems/`, a quiz, and a hero media slot.

---

## Media

Content never contains media paths. Systems and guides point at a slot id
(`heroSlot`). Slots live in `public/media/assets.json`. To add one, append it
with `"status": "placeholder"` and a one-line `"brief"`, then reference its id.
Never rename or remove an existing slot. See [architecture.md](./architecture.md#5-media-layer-the-contract).

---

## Checking your work

```bash
npm test          # validates all content and runs unit tests
npm run dev       # look at it at http://localhost:3000
npm run build     # the full static build (also validates)
```
