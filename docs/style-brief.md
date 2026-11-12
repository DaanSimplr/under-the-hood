# Style brief

> **Owner: the media agent.** The manifest points here
> (`"styleBrief": "docs/style-brief.md"`). Every prompt reuses the
> **style block** below word for word. Final prompts are in
> [prompt-log.md](./prompt-log.md).

## Ground rules from the app (do not change)

- Generated media is **decorative only**: hero backgrounds, ambient loops and
  transitions. It never explains how a part works. The SVG and 3D diagrams do
  that.
- No logos, badges, brand-identifiable cars, readable text or licence plates.
- Text is drawn in code on top of the media, on a solid panel, so frames do
  not need empty space. The one exception is `og-image`, which needs space on
  the left.
- Ambient loops sit behind content and should be **low-contrast** and calm.
  Loops must loop seamlessly.
- Respect each slot's `aspect`, `resolution`, `durationSec` and `maxSizeKB` in
  `public/media/assets.json`.
- Video: deliver MP4 (H.264) at `path` and WebM (VP9/AV1) at `altPath`, plus a
  WebP poster at `poster` (the first frame, or a calm frame). No audio track.
- Both light and dark site themes show the media. Mid-tone, moody footage
  works for both.

## Look and mood

A premium workshop crossed with a technical museum after closing time. Calm,
precise, slightly cinematic. Objects are shown like exhibits: clean, unbranded,
on a dark seamless floor. Photoreal, never cartoon or CGI-toy.

## Palette

- **Base:** deep graphite to near-black, taken from the dark theme
  (`--bg #0f1115`, `--surface #171a21`, `--surface-2 #20242d`).
- **One accent:** burnt orange, the site's `--accent` (`#b23c0c` light,
  `#ff8a4c` dark). Used as a thin rim light or a small glow, on under 10% of
  the frame.
- **Metal:** warm highlights on brushed steel and aluminium, cool grey shadows.
- **System tint:** a hero may carry a faint hint of its `--sys-*` color in the
  fill light (cool blue for cooling and electrical, warm for brakes and
  exhaust). Orange stays the only saturated color.
- Blacks never crush to pure `#000`, highlights never clip. Mid-tone overall,
  so the image holds up next to both the light and the dark page.

## Lighting

Large soft key light from above and slightly behind. One narrow rim light that
draws the outline. Gentle falloff into darkness. A light haze is fine. No lens
flares, no hard specular hot spots, no neon, no colored gels besides the accent.

## Camera and motion

- 50–85 mm look, shallow depth of field, eye level or slightly low.
- One slow, smooth move per clip: orbit of at most 10°, slow dolly, or a slight
  push-in. No cuts, no shake, no zoom snaps.
- Loops: motion lives in the light (a soft sweep), drifting dust or haze, and a
  barely moving camera. First frame = last frame (the same still is used as
  start and end frame). If a jump remains, fix it in post with a crossfade or
  ping-pong.

## Composition (from the page layouts)

The text panel is solid (`bg/90` + blur), so contrast is safe. The goal is that
the panel does not cover the subject.

| Where                                  | Panel sits                                      | Put the subject                           |
| -------------------------------------- | ----------------------------------------------- | ----------------------------------------- |
| Home hero (16:9, cropped to cover)     | left, vertically centred, ≤ 36 rem              | right 55% of frame, centred vertically    |
| System / teardown headers (21:9, 16:9) | bottom-left, ≤ 42 rem                           | right half, upper two thirds              |
| System cards on `/systems`             | image shown whole above the title               | subject must still read at ~400 px wide   |
| Part pages (16:9, shown whole)         | none, the image sits beside the title           | centred, about half the frame height      |
| Explorer background                    | whole frame, at 60% opacity, behind the diagram | no subject, even texture, no bright spots |
| `og-image`                             | title added in code on the left                 | left 45% dark and empty, subject right    |

At 375 px the panel covers most of the hero, so the edges of every frame must
be calm and dark. Keep important detail out of the outer 8%.

## Subjects per slot

| Slot                        | Subject (decorative, no technical claims)                                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `home-hero-loop`            | Generic unbadged coupé/saloon silhouette, three-quarter rear-side view, mostly outline in rim light, faint ghosted parts floating out of focus behind it |
| `explorer-bg-loop`          | Abstract dark blueprint grid receding in depth, soft light drifting across. No drawings of real parts                                                    |
| `workshop-ambient-loop`     | Clean workbench, generic hand tools laid out, defocused background, slow light movement                                                                  |
| `teardown-intro-transition` | Abstract graphite and brushed-metal panels sliding apart from the centre, orange light in the gap. Ends calm                                             |
| `system-engine-hero`        | Generic engine in a dark bay, soft top light                                                                                                             |
| `system-drivetrain-hero`    | Gearbox housing and driveshaft from a low angle                                                                                                          |
| `system-brakes-hero`        | Disc and caliper behind plain wheel spokes, faint warm glow on the disc                                                                                  |
| `system-suspension-hero`    | Coil spring and damper with a control arm, side light                                                                                                    |
| `system-electrical-hero`    | Unlabelled battery and tidy wiring loom, cool blue fill                                                                                                  |
| `system-cooling-hero`       | Radiator fins and hoses, cool tones, light mist                                                                                                          |
| `system-fuel-exhaust-hero`  | Exhaust pipe and silencer from below, warm light                                                                                                         |
| `system-body-chassis-hero`  | Bare unpainted body shell on a stand, clean overhead light                                                                                               |
| `part-<id>-hero` (25)       | The part alone on a low dark plinth, like a museum exhibit                                                                                               |
| `og-image`                  | Crop/variant of the approved home hero still, subject right                                                                                              |

## Prompt template

```
[SUBJECT from the table] .
STYLE: premium automotive workshop meets technical museum, calm and precise,
photoreal, deep graphite and near-black environment, dark seamless floor,
warm highlights on brushed metal, a single thin burnt-orange (#ff8a4c) rim
light as the only saturated color, large soft key light from above, gentle
falloff, light haze, no lens flare, mid-tone exposure with detail in the
shadows, 50-85mm lens, shallow depth of field.
CAMERA: [still: static | video: one slow smooth move, e.g. 8 degree orbit].
COMPOSITION: [where the subject goes, from the layout table], calm dark edges.
FORMAT: [aspect], [duration for video, seamless loop, last frame equals first].
NEGATIVE: no logos, no badges, no brand-identifiable design, no licence plates,
no text, no letters, no numbers, no labels, no people, no hands, no faces,
no crash or damage, no cartoon, no neon, no lens flare.
```

## Things to avoid

Logos, badges, signature grilles or lamp shapes, licence plates, any readable
text or numbers (including on tools, batteries and tyres), people and faces,
gore, crashes, damage, cartoon or toy looks, fast cuts, camera shake, harsh
flares, and close-ups precise enough to read as a technical reference.

## Models

Details per slot are in [prompt-log.md](./prompt-log.md).

- **Stills:** Nano Banana Pro, 2k, text-to-image, no reference image. 16:9
  comes out at 2752x1536 and 21:9 at 3168x1344. No grade needed.
- **Video:** Seedance 2.0 `std`, `generate_audio: false`, the approved
  still as `start_image` and, for loops, also as `end_image`. The takes so
  far came back at 720p and are upscaled at encode.
- **Still on the first-pass model (Soul Cinema, 2k):** the stills behind the
  four videos, `system-body-chassis-hero` and `og-image`. Soul Cinema
  renders this look very dark, so those files get a linear lift in post
  (about `x1.2 + 5`), and so do the videos made from them.
- **Where to generate:** the free-trial unlimited generations work in Claude
  chat, Cowork and ChatGPT, not from Claude Code. Results can be fetched from
  the account by job id afterwards.

## Encoding settings

- **MP4:** H.264 High, `yuv420p`, CRF 17 with `maxrate` capped below
  `maxSizeKB`, `-movflags +faststart`, `-an`, 30 fps.
- **WebM:** VP9, constant quality CRF 24, `-an`.
- **Poster:** WebP, quality ~80, from frame 0 of the final encode.
- **Images:** WebP at the slot's exact resolution (cover-crop, Lanczos),
  quality stepped down from 94 until under `maxSizeKB`.
- **`og-image`:** PNG, 1200x630, palette-quantised if needed to stay under
  300 KB.
- Lower bitrate before resolution. The teardown transition is trimmed or
  retimed to 2 s.
