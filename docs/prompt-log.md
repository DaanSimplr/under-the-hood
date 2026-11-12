# Prompt log

One entry per slot in `public/media/assets.json`. Look and rules are in
[style-brief.md](./style-brief.md).

Generated on 2026-11-11 through the Higgsfield MCP. Seeds: the MCP does not
return or accept a seed for these models, so the Higgsfield job id is logged
instead. A job can be looked up again by that id.

The [second pass](#second-pass-2026-11-12) replaced the files of most slots
and added the part page stills. The per-slot entries under [Slots](#slots)
describe the first pass.

## Shared prompt parts

Every still prompt is `[SUBJECT] STYLE CAMERA COMPOSITION FORMAT NEGATIVE`.

**STYLE** (word for word from the brief):

```
STYLE: premium automotive workshop meets technical museum, calm and precise,
photoreal, deep graphite and near-black environment, dark seamless floor,
warm highlights on brushed metal, a single thin burnt-orange (#ff8a4c) rim
light as the only saturated color, large soft key light from above, gentle
falloff, light haze, no lens flare, mid-tone exposure with detail in the
shadows, 50-85mm lens, shallow depth of field.
```

The home hero prompt has `dark seamless floor with a soft reflection` in place
of `dark seamless floor`.

**NEGATIVE** (word for word from the brief):

```
NEGATIVE: no logos, no badges, no brand-identifiable design, no licence
plates, no text, no letters, no numbers, no labels, no people, no hands,
no faces, no crash or damage, no cartoon, no neon, no lens flare.
```

**System hero COMPOSITION and FORMAT:**

```
COMPOSITION: the subject sits in the right half of the frame, in the upper
two thirds, the left half is calm dark empty space, calm dark edges.
FORMAT: 21:9 ultra-wide cinematic still.
```

## Shared settings

- **Still model:** Soul Cinema (`soul_cinematic`), quality `2k`, text-to-image,
  no reference image. 0.12 credits per still. Output is 2048x1152 at 16:9 and
  2528x1088 at 21:9.
- **Deviations from the brief:** the brief names Nano Banana Pro and Seedance
  2.0 `std` 1080p; the 10-credit budget forced Soul Cinema and Seedance 2.0
  Mini 720p. The home hero was not passed as a style reference to later slots,
  to keep the coupe out of the part shots. Each subject sentence asks for a
  "clearly visible and softly lit" subject because the first batch came out
  darker than the brief's mid-tone target.
- **Grade:** every file gets a linear lift in post (`out = in * a + b`) because
  the raw stills are very dark. Values are listed per slot.
- **Image encode:** sharp, cover-crop with Lanczos to the slot resolution,
  WebP quality 94 (all under `maxSizeKB` at that quality).
- **Video encode:** ffmpeg 9. MP4: libx264 High, `yuv420p`, CRF 17 with
  `maxrate` capped at 88% of the size budget, `aq-mode=3`, 30 fps,
  `+faststart`, no audio. WebM: libvpx-vp9, CRF 24, constant quality, no audio.
  Poster: WebP quality 80 from frame 0 of the MP4.
- **Post-built loops:** the still is upscaled to 3840x2160, then `zoompan`
  breathes the zoom between 1.015 and 1.055 on a cosine, and a dithered
  Gaussian light blob moves on a cosine path and is screen-blended on top.
  Both motions have a period equal to the clip length, so the last frame leads
  back into the first with no jump.

## Slots

### home-hero-loop

- **Still:** 4 variations, same prompt. Jobs `bf86df27` (v1), `14120f0c` (v2),
  `41be47aa` (v3), `8ac3f8e0` (v4). **Chosen: v3**
  (`41be47aa-15c7-429f-90f6-0f229a74092a`), picked by the owner. v1 was
  rejected for badge-like lettering on the tailgate.
- **Still prompt:**

  ```
  A generic unbadged modern coupe seen from a rear three-quarter side view in
  a dark studio, the car mostly a silhouette drawn by rim light along its
  roofline and shoulder, a few faint out-of-focus mechanical parts (a gear, a
  coil spring, a brake disc, a wheel) floating softly ghosted in the dark air
  behind and above it, like an exploded view fading into haze. STYLE (with
  "dark seamless floor with a soft reflection"). CAMERA: static, eye level.
  COMPOSITION: the car sits in the right 55 percent of the frame, vertically
  centred, the left 45 percent is calm dark empty studio, calm dark edges all
  around. FORMAT: 16:9 wide cinematic still. NEGATIVE.
  ```

- **Video:** Seedance 2.0 Mini (`seedance_2_0_mini`), 6 s, 720p, 16:9,
  `generate_audio: false`, v3 as `start_image` and `end_image`. Job
  `4d8a6f0b-da57-416d-ad28-2b0ec7759a53`. 6 credits. One take.
- **Video prompt:**

  ```
  Locked-off static shot of the same dark studio scene. Very slow, subtle
  motion only: a soft light sweep glides along the car's roofline and
  shoulder, thin haze drifts slowly through the dark air, the faint ghosted
  mechanical parts above the car float and turn almost imperceptibly. The
  camera makes a barely visible slow push-in and eases back to its starting
  position. The car stays perfectly still and unchanged, the orange tail light
  glow stays steady. Calm, precise, photoreal, dark graphite environment.
  Seamless loop, the last frame is identical to the first frame. No cuts, no
  shake, no zoom snaps, no new objects, no logos, no badges, no licence
  plates, no text, no people.
  ```

- **Post:** the clip came back as 1280x720, 24 fps, 145 frames. The last frame was close to the first but not identical, so the last 8 frames are crossfaded into the first 8 and the clip starts at source frame 8. It is then retimed to exactly 6 s, converted to 30 fps with blended frames (`minterpolate`, `mi_mode=blend`), graded `a=1.2, b=5` and upscaled to 1920x1080 with Lanczos at encode. 180 frames. The measured difference across the loop point equals the difference between two normal neighbouring frames.

### explorer-bg-loop

- **Still:** 2 variations. Jobs `4df95555` (a), `0b861e7d` (b). **Chosen: a**
  (`4df95555-fec5-45c6-a2ab-c6547ba0e730`). b has a bright orange streak.
- **Subject:** `An abstract dark blueprint grid of thin faint lines receding in
depth across the whole frame, an even low-contrast texture with a very soft
wash of light, no objects, no drawings of parts, no bright spots.`
- **CAMERA / COMPOSITION / FORMAT:** `static` / `no subject, even texture over
the whole frame, calm dark edges` / `16:9 wide cinematic still`.
- **Post:** no generated video. Built with ffmpeg from the still: grade
  `a=1.15, b=4`, zoom breathing, a cool blue-grey light blob (peak RGB
  26,30,38) drifting left to right and back. 5 s, 150 frames, 1920x1080.

### workshop-ambient-loop

- **Still:** 4 variations over two rounds. Round 1: jobs `b887c3e4` (a),
  `de755e57` (b). Round 2: jobs `7e9f8350` (c), `e54f30b2` (d).
  **Chosen: d** (`e54f30b2-b130-40da-b3a7-b194dcd6a53a`). Round 1 put the
  tools at the top of the frame, where the wide header crops them out.
- **Subject (round 2):** `A clean workshop workbench seen from slightly above,
its top surface running horizontally through the vertical middle of the frame,
with a few generic plain hand tools (spanners, a ratchet, screwdrivers) laid
out neatly in a row on it, softly lit, the background defocused, all tools
unmarked with blank handles.`
- **CAMERA / COMPOSITION / FORMAT (round 2):** `static, slightly high` / `the
tools sit in the right half of the frame and exactly in the vertical centre, in
the middle third of the height, the top third and bottom third are calm and
dark, the left half is calm dark empty bench, calm dark edges` / `16:9 wide
cinematic still`.
- **Post:** no generated video. Built with ffmpeg from the still: grade
  `a=1.15, b=4`, zoom breathing, a warm light blob (peak RGB 60,50,42) sweeping
  along the bench and back. 6 s, 180 frames, 1920x1080.

### teardown-intro-transition

- **Still:** 2 variations. Jobs `8e4849cc` (a), `6a9b2726` (b). **Chosen: a**
  (`8e4849cc-7caf-4f73-b206-d0256db7b4f4`). Its panels fill the frame, which
  the split needs.
- **Subject:** `A flat frontal view of two large abstract panels of graphite
and brushed metal that meet at a single straight vertical seam in the exact
centre of the frame, a thin line of orange light glowing in the narrow gap
between them, plain smooth surfaces, symmetric.`
- **CAMERA / COMPOSITION / FORMAT:** `static, straight on` / `symmetric, the
vertical seam exactly in the centre, the panels fill the frame, calm dark
edges` / `16:9 wide cinematic still`.
- **Post:** no generated video. Built with ffmpeg from the still at 1280x720,
  grade `a=1.15, b=4`. The seam is found by scanning for the most orange
  column (x 633 to 649). The image is cut into a left and right panel that
  slide off-screen with a smoothstep ease between 0.15 s and 1.6 s, over a
  blurred orange glow that fades to a calm dark graphite frame between 0.9 s
  and 1.8 s. 2 s, 60 frames. The poster is the closed first frame.

### system-engine-hero

- Jobs `31ed700b` (a), `239c9e43` (b). **Chosen: b**
  (`239c9e43-08d4-4981-9b71-e5eb1815d218`).
- **Subject:** `A generic unbranded car engine sitting in a dark engine bay,
shown like a museum exhibit, clearly visible and softly lit from above, plain
cast metal surfaces.` CAMERA: `static`.
- **Post:** crop to 2520x1080, grade `a=1.2, b=5`, WebP q94.

### system-drivetrain-hero

- Jobs `7a59b1c1` (a), `a2166f99` (b). **Chosen: b**
  (`a2166f99-5a9d-4f6c-b9e7-0eac97f2d17a`).
- **Subject:** `A generic unbranded gearbox housing with a driveshaft extending
from it, seen from a low angle, shown like a museum exhibit, clearly visible
and softly lit, plain cast aluminium surfaces.` CAMERA: `static, slightly low`.
- **Post:** crop to 2520x1080, grade `a=1.2, b=5`, WebP q94.

### system-brakes-hero

- Jobs `34661e3d` (a), `0c4a2f61` (b). **Chosen: b**
  (`0c4a2f61-7536-4f4c-a50c-69e53968f215`).
- **Subject:** `A brake disc and plain unmarked caliper seen behind simple plain
wheel spokes, a faint warm glow on the disc, clearly visible and softly lit,
the tyre sidewall smooth and blank.` CAMERA: `static, eye level`.
- **Post:** the caliper came out with embossed logo-like lettering. It is
  removed with a feathered Gaussian blur patch (sigma 7) over source region
  x 2090, y 300, 140x290. Then crop to 2520x1080, grade `a=1.2, b=5`, WebP q94.
  The patch also softens one wheel spoke. A second round (jobs `233d8171`, `2c697614`) asked for a blank caliper face, but both results were worse (wheel cropped off, or no caliper visible), so b stays.

### system-suspension-hero

- Jobs `d8d9eedf` (a), `2e3359f1` (b). **Chosen: b**
  (`2e3359f1-174b-46ee-9912-5aeeaf80b218`).
- **Subject:** `A car suspension coil spring and damper with a control arm,
standing like a museum exhibit, lit softly from the side, clearly visible,
plain unmarked metal.` CAMERA: `static, eye level`.
- **Post:** crop to 2520x1080, grade `a=1.2, b=5`, WebP q94.

### system-electrical-hero

- Jobs `91863081` (a), `e80a9646` (b). **Chosen: b**
  (`e80a9646-8c30-4bb4-9e10-b4c721ce113b`). a has label stickers with
  text-like marks.
- **Subject:** `A plain black unlabelled car battery with a tidy bundled wiring
loom running from it, shown like a museum exhibit, clearly visible and softly
lit with a faint cool blue fill light, completely blank surfaces with no
stickers.` CAMERA: `static, eye level`.
- **Post:** crop to 2520x1080, grade `a=1.2, b=5`, WebP q94.

### system-cooling-hero

- Jobs `0c611d00` (a), `0eceb916` (b). **Chosen: b**
  (`0eceb916-cf8b-49f0-9f5c-6ef1cde333ce`).
- **Subject:** `A car radiator with fine aluminium fins and plain black rubber
hoses, shown like a museum exhibit, cool tones, a light mist drifting past,
clearly visible and softly lit.` CAMERA: `static, eye level`.
- **Post:** crop to 2520x1080, grade `a=1.2, b=5`, WebP q94.

### system-fuel-exhaust-hero

- Jobs `c42eb491` (a), `d2921026` (b). **Chosen: b**
  (`d2921026-60f5-407a-b6a7-d09faf321f93`).
- **Subject:** `A stainless steel exhaust pipe and silencer seen from below at a
low angle, shown like a museum exhibit, warm light on the metal, clearly
visible and softly lit, plain unmarked surfaces.` CAMERA: `static, low angle`.
- **Post:** crop to 2520x1080, grade `a=1.2, b=5`, WebP q94.

### system-body-chassis-hero

- Jobs `c7af3dd5` (a), `ad51c5f3` (b). **Chosen: a**
  (`c7af3dd5-5f84-47df-be30-23b56984b831`). b has a large clipped white light
  at the top.
- **Subject:** `A bare unpainted generic car body shell in raw grey steel,
without doors, wheels or glass, resting on a simple stand, clean soft overhead
light, clearly visible.` CAMERA: `static, eye level`.
- **Post:** crop to 2520x1080, grade `a=1.2, b=5`, WebP q94.

### og-image

- **Source:** home hero v3 (`41be47aa`). No generation, no credits.
- **Post:** scaled to 630 px high, the right 120 px cropped off, 200 px added
  on the left by mirroring and blurring the dark studio so the car starts at
  about 41% of the width. Grade `a=1.25, b=6`. PNG, 1200x630, quantised to a
  256-colour palette with dithering to get under 300 KB.

## Second pass (2026-11-12)

Generated by the owner in Claude chat on 2026-11-11, where the free-trial
unlimited generations work (they are refused from Claude Code). One take per
item, no variations. The results were fetched by job id, then graded and
encoded here with ffmpeg 9.

### Settings

- **Stills:** Nano Banana Pro (`nano_banana_pro`), `2k`, text-to-image.
  Output is 3168x1344 at 21:9 and 2752x1536 at 16:9. No grade: these come out
  at the brief's mid-tone exposure.
- **Video:** Seedance 2.0 (`seedance_2_0`), `mode: std`, 16:9,
  `generate_audio: false`. The runs came back at 720p, 24 fps, not the 1080p
  the brief names, so they are upscaled to the slot resolution at encode.
- **Loop post:** the last frames are crossfaded into the first frames, the
  clip is retimed to the slot duration and converted to 30 fps with blended
  frames (`minterpolate`, `mi_mode=blend`). The conversion runs on two
  copies of the clip back to back and the output is cut from the middle, so
  the frames at the loop point are blended like any others.
- **Encode:** as in the first pass (MP4 CRF 17 with capped `maxrate`, WebM
  VP9 CRF 24, poster WebP quality 80 from frame 0, stills WebP quality 94).

### Videos

The prompt for `home-hero-loop` is the first-pass prompt, unchanged.

- **home-hero-loop:** job `e36426f0-5f7d-456b-a0fe-3a5261791d1c`, 6 s, still v3 as start and
  end image. 12-frame crossfade, grade `a=1.2, b=5`, 1920x1080, 180 frames.
- **explorer-bg-loop:** job `5962c950-b19b-417d-a559-a08b4111ccca`, 5 s, still a as start and
  end image. 8-frame crossfade, grade `a=1.15, b=4`. The take has a bright
  beam of light crossing the grid, so the highlights are compressed with
  `curves=all='0/0 0.25/0.25 0.6/0.42 1/0.5'` to keep the background
  low-contrast. 1920x1080, 150 frames. Prompt:

  ```
  Locked-off static shot of the same abstract dark blueprint grid. Very slow,
  subtle motion only: a soft cool wash of light drifts across the grid from
  left to right and fades, thin haze moves slowly in the depth of the frame,
  the camera glides forward almost imperceptibly and eases back to its
  starting position. The grid lines stay unchanged, even and low-contrast, no
  bright spots. Seamless loop, the last frame is identical to the first frame.
  No cuts, no shake, no new objects, no drawings of parts, no text, no
  numbers, no people.
  ```

- **workshop-ambient-loop:** job `3b9c736f-d136-417d-a604-2c47ecaae7c9`, 6 s, still d as
  start and end image. 8-frame crossfade, grade `a=1.15, b=4`, 1920x1080,
  180 frames. Prompt:

  ```
  Locked-off static shot of the same clean workbench with hand tools. Very
  slow, subtle motion only: a warm soft light sweeps gently along the bench
  and back, fine dust drifts through the light, the defocused background
  shifts almost imperceptibly as the camera makes a barely visible slow
  push-in and eases back to its starting position. The tools stay perfectly
  still and unchanged. Calm, precise, photoreal. Seamless loop, the last
  frame is identical to the first frame. No cuts, no shake, no new objects,
  no hands, no people, no text, no logos.
  ```

- **teardown-intro-transition:** job `209ad04e-df3f-4936-9122-059ead132799`, 4 s
  (the model's minimum), still a as start image only. Retimed to 2 s, 30 fps,
  60 frames, grade `a=1.15, b=4`, 1280x720. The poster is the closed first
  frame. Prompt:

  ```
  Locked-off frontal shot. The two large graphite and brushed-metal panels
  slide smoothly apart from the centre seam, the left panel to the left and
  the right panel to the right, like heavy precision doors. Warm orange light
  glows in the widening gap, then softens and fades as the panels leave the
  frame, ending on a calm, dark, empty graphite space. One smooth continuous
  motion, no cuts, no shake, no new objects, no text, no logos, no people.
  ```

### System heroes

Same subjects, COMPOSITION and FORMAT as the first pass, except that the
brakes subject asks for `a plain caliper with a completely smooth blank
face`. Post: scale and cover-crop to 2520x1080, WebP q94.

| Slot                       | Job                                    |
| -------------------------- | -------------------------------------- |
| `system-engine-hero`       | `f46914d6-57eb-4bab-b988-8191fc91902e` |
| `system-drivetrain-hero`   | `4e6148a9-8951-4919-bc55-45bc4ddce8b1` |
| `system-brakes-hero`       | `58feff54-acf6-4e49-92c6-d02460825f40` |
| `system-suspension-hero`   | `4b2a25e4-413f-49ac-b7a8-42f52d1ee7e6` |
| `system-electrical-hero`   | `91faba6e-e6ea-4948-919e-c5704f67f8dd` |
| `system-cooling-hero`      | `d05b1201-6157-4246-a06e-8ab685cc0835` |
| `system-fuel-exhaust-hero` | `0cd4813c-4902-4ff5-a54b-d929c030a6c0` |

- **system-fuel-exhaust-hero:** the stand carries a small plaque with
  text-like marks. They are removed with a Gaussian blur patch (sigma 7) over
  source region x 1746, y 1201, 356x46.
- **system-body-chassis-hero:** not replaced. The new take (job
  `c61d9078-8bfb-4b28-8482-a72ba884d153`) reads as a recognisable 1980s saloon shell,
  which the brief forbids, so the first-pass file stays.

### Part page stills (new slots)

Each prompt is the subject, then `shown alone on a low dark plinth like a
museum exhibit, clearly visible and softly lit, plain unmarked surfaces.
CAMERA: static, eye level.`, then STYLE, the lines below and NEGATIVE. Post:
scale and cover-crop to 1600x900, WebP q94.

```
COMPOSITION: the subject sits in the centre of the frame and fills about
half of its height, calm dark empty space around it, calm dark edges.
FORMAT: 16:9 wide cinematic still.
```

| Slot                            | Subject                                                                 | Job                                    |
| ------------------------------- | ----------------------------------------------------------------------- | -------------------------------------- |
| `part-airbag-module-hero`       | A plain steering wheel centre pad with a folded fabric airbag behind it | `620ea4cb-f4d9-489a-b1c7-830763d768f6` |
| `part-alternator-hero`          | A generic car alternator with its pulley and cooling vents              | `8a3b1d4d-d811-42de-82db-db349588f13f` |
| `part-battery-hero`             | A plain black unlabelled car battery with two terminals                 | `326910d3-6eac-4b01-93ec-2b27475a8bf6` |
| `part-brake-caliper-hero`       | A plain brake caliper with a completely smooth blank face               | `5f35be03-b5e8-479b-b3cd-607392e9d389` |
| `part-brake-disc-hero`          | A ventilated brake disc standing upright                                | `0bd10919-9e72-4d52-b3ce-6e39408bb083` |
| `part-brake-pads-hero`          | A pair of plain brake pads leaning against each other                   | `2db59ede-f7cc-4fa9-9121-1e23416f15de` |
| `part-bumper-beam-hero`         | A bare aluminium bumper beam with its two crash boxes                   | `32c09912-97ba-4651-9f00-b1f6e30e5c25` |
| `part-catalytic-converter-hero` | A stainless steel catalytic converter with a short pipe at each end     | `d23c0a97-01f5-4aa6-95f4-ea990b5b330b` |
| `part-clutch-hero`              | A clutch disc and pressure plate standing side by side                  | `ded6cbfd-ead4-4dbc-84db-e76ccc9d992d` |
| `part-control-arm-hero`         | A forged suspension control arm with its bushes and ball joint          | `f3b23e39-3103-44fd-b7ca-e62ba106b557` |
| `part-cv-axle-hero`             | A CV axle shaft with a ribbed rubber boot at each end                   | `4e932496-ba80-4daa-b94d-7a04ccd8a42b` |
| `part-engine-block-hero`        | A bare four-cylinder engine block with open cylinder bores              | `9362e498-9f87-41f5-9119-6185129d2b76` |
| `part-fuel-pump-hero`           | An in-tank electric fuel pump module                                    | `7155eacc-da46-4348-8b90-8a880ac621d8` |
| `part-muffler-hero`             | A stainless steel exhaust silencer with its inlet and tail pipe         | `20a13b0b-9022-48d2-b1a3-6883ebcc8cc9` |
| `part-radiator-hero`            | A car radiator with fine aluminium fins and plain end tanks             | `58aca3fa-e357-4e78-a8d1-2207db40a04e` |
| `part-spark-plug-hero`          | A single spark plug standing upright, blank white insulator             | `f151f493-9751-4d42-bf82-a40ae4d42d64` |
| `part-starter-motor-hero`       | A generic starter motor with its small pinion gear                      | `ae67c7e9-4eb6-4c3d-9efe-e5b24a0cb9b2` |
| `part-steering-rack-hero`       | A steering rack with a rubber boot and tie rod at each end              | `5f403ae7-79d6-4c1e-a292-cbca3c0469ec` |
| `part-strut-hero`               | A suspension strut with its coil spring and top mount                   | `bb6e54fa-2308-441a-8ace-4d5e9895d82d` |
| `part-subframe-hero`            | A bare steel front subframe                                             | `59d8fe54-a9bb-46d9-bdce-a094b83dd5f2` |
| `part-thermostat-hero`          | A small engine coolant thermostat with its spring, beside its housing   | `7f6d6757-a646-4672-963d-dcb464eba19a` |
| `part-timing-belt-hero`         | A toothed timing belt looped around two plain toothed pulleys           | `0f876dfd-018e-459f-b909-bf3f61bd6a18` |
| `part-transmission-hero`        | A generic manual gearbox housing in plain cast aluminium                | `2f4f88dc-3631-48fe-a23c-2573f7deb0b5` |
| `part-water-pump-hero`          | A generic engine water pump with its impeller and pulley                | `636e238f-dcbe-4497-b4b9-2a9f77a29602` |
| `part-wheel-hub-hero`           | A wheel hub and bearing unit with its wheel studs                       | `87bf4036-2b7a-4d7c-b4f5-9e92c6c336bc` |

### Rejected

- **3D car page header:** a still (job `9447166a-1970-48ee-95f9-202e30383166`) and a Seedance loop
  from it (job `9468760e-802b-4085-a7d2-a225af0159fe`) were generated for a new slot. The
  car is recognisable as a current production hatchback, and the clip opens
  the doors instead of returning to its first frame. Neither is used and no
  slot was added.
