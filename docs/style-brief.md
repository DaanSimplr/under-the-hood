# Style brief (stub)

> **Owner: the media agent.** This file is a placeholder. The media agent
> fills it in before it generates footage, and the manifest points to it
> (`"styleBrief": "docs/style-brief.md"`).

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

## To be filled in by the media agent

- Look and mood:
- Palette (the site's accent is a burnt orange, `#b23c0c` light / `#ff8a4c` dark):
- Lighting:
- Camera and motion:
- Subjects per slot:
- Prompt template:
- Things to avoid:
- Encoding settings:
