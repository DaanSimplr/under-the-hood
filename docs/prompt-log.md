# Prompt log

One entry per slot in `public/media/assets.json`. Look and rules are in
[style-brief.md](./style-brief.md).

Generated on 2026-11-11 through the Higgsfield MCP. Seeds: the MCP does not
return or accept a seed for these models, so the Higgsfield job id is logged
instead. A job can be looked up again by that id.

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
