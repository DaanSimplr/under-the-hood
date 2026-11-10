import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getManifest, parseManifest, resolveSlot, UnknownSlotError } from "@/lib/assets";
import { parseAspect } from "@/lib/media";
import type { MediaManifest } from "@/lib/schemas";

const manifest: MediaManifest = parseManifest({
  version: 1,
  slots: [
    {
      id: "clip",
      type: "video",
      role: "hero",
      path: "media/clip.mp4",
      altPath: "media/clip.webm",
      poster: "media/clip.webp",
      aspect: "16:9",
      loop: true,
      alt: "",
      brief: "test",
      status: "generated",
    },
    {
      id: "still",
      type: "image",
      role: "hero",
      path: "media/still.webp",
      aspect: "21:9",
      alt: "A still",
      brief: "test",
      status: "approved",
      variants: [
        { path: "media/still-800.webp", width: 800 },
        { path: "media/still-1600.webp", width: 1600 },
      ],
    },
    {
      id: "todo",
      type: "image",
      role: "hero",
      path: "media/todo.webp",
      aspect: "1:1",
      alt: "",
      brief: "test",
      status: "placeholder",
    },
  ],
});

const allExist = () => true;
const noneExist = () => false;

describe("resolveSlot", () => {
  it("throws a clear error for an unknown id", () => {
    expect(() => resolveSlot("nope", { manifest, fileExists: allExist })).toThrow(UnknownSlotError);
    expect(() => resolveSlot("nope", { manifest, fileExists: allExist })).toThrow(
      /Unknown media slot "nope"/,
    );
  });

  it("shows a placeholder while status is placeholder, even if a file exists", () => {
    const r = resolveSlot("todo", { manifest, fileExists: allExist });
    expect(r.available).toBe(false);
    expect(r.reason).toBe("placeholder-status");
  });

  it("shows a placeholder when a generated file is missing", () => {
    const r = resolveSlot("clip", { manifest, fileExists: noneExist });
    expect(r.available).toBe(false);
    expect(r.reason).toBe("missing-file");
    expect(r.src).toBeNull();
  });

  it("resolves video sources, WebM and poster when present", () => {
    const r = resolveSlot("clip", { manifest, fileExists: allExist });
    expect(r.available).toBe(true);
    expect(r.src).toBe("/media/clip.mp4");
    expect(r.webmSrc).toBe("/media/clip.webm");
    expect(r.posterSrc).toBe("/media/clip.webp");
    expect(r.aspectCss).toBe("16 / 9");
  });

  it("accepts a video that only has its WebM file", () => {
    const r = resolveSlot("clip", { manifest, fileExists: (p) => p.endsWith(".webm") });
    expect(r.available).toBe(true);
    expect(r.src).toBeNull();
    expect(r.webmSrc).toBe("/media/clip.webm");
  });

  it("builds a srcset from the image variants that exist", () => {
    const r = resolveSlot("still", { manifest, fileExists: (p) => !p.includes("1600") });
    expect(r.srcSet).toBe("/media/still-800.webp 800w");
  });
});

describe("the real manifest (the contract with the media agent)", () => {
  const real = getManifest();
  const ids = real.slots.map((s) => s.id);

  it("still contains every original slot id", () => {
    for (const id of [
      "home-hero-loop",
      "explorer-bg-loop",
      "workshop-ambient-loop",
      "teardown-intro-transition",
      "system-engine-hero",
      "system-drivetrain-hero",
      "system-brakes-hero",
      "system-suspension-hero",
      "system-electrical-hero",
      "system-cooling-hero",
      "system-fuel-exhaust-hero",
      "system-body-chassis-hero",
      "og-image",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("resolves every slot without throwing", () => {
    for (const id of ids) expect(() => resolveSlot(id)).not.toThrow();
  });

  it("is referenced by code or content for every slot (nothing orphaned)", () => {
    const roots = ["app", "components", "content"];
    let haystack = "";
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (/\.(tsx?|json|mdx)$/.test(entry.name)) haystack += fs.readFileSync(p, "utf8");
      }
    };
    roots.forEach((r) => walk(path.join(process.cwd(), r)));
    for (const id of ids)
      expect(haystack, `slot "${id}" is not used anywhere`).toContain(`"${id}"`);
  });
});

describe("parseAspect", () => {
  it("parses ratios, including decimals", () => {
    expect(parseAspect("16:9").css).toBe("16 / 9");
    expect(parseAspect("1.91:1").ratio).toBeCloseTo(1.91);
  });
  it("rejects nonsense", () => {
    expect(() => parseAspect("wide")).toThrow();
    expect(() => parseAspect("0:9")).toThrow();
  });
});
