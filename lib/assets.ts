/**
 * Server-only access to the media manifest (public/media/assets.json).
 * Pages never hard-code media paths; they ask for a slot id and get back a
 * ResolvedSlot that says whether a real file can be shown.
 */
import fs from "node:fs";
import path from "node:path";
import { mediaManifestSchema, type MediaManifest, type MediaSlot } from "./schemas";
import { isReadyStatus, parseAspect, publicUrl } from "./media";

const PUBLIC_DIR = path.join(process.cwd(), "public");
export const MANIFEST_PATH = path.join(PUBLIC_DIR, "media", "assets.json");

let cached: MediaManifest | null = null;

export function parseManifest(raw: unknown, source = MANIFEST_PATH): MediaManifest {
  const result = mediaManifestSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid media manifest at ${source}:\n${issues}`);
  }
  return result.data;
}

/** Reads and validates the manifest. Re-read on every call in dev so dropped-in files show on refresh. */
export function getManifest(): MediaManifest {
  if (cached && process.env.NODE_ENV !== "development") return cached;
  const raw = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as unknown;
  cached = parseManifest(raw);
  return cached;
}

export function getSlotIds(manifest: MediaManifest = getManifest()): string[] {
  return manifest.slots.map((s) => s.id);
}

export class UnknownSlotError extends Error {
  constructor(id: string, known: string[]) {
    super(
      `Unknown media slot "${id}". Add it to public/media/assets.json (status "placeholder" + a one-line brief) or use one of: ${known.join(", ")}`,
    );
    this.name = "UnknownSlotError";
  }
}

export type PlaceholderReason = "placeholder-status" | "missing-file";

export type ResolvedSlot = {
  slot: MediaSlot;
  /** True when a real file can be shown. */
  available: boolean;
  reason: PlaceholderReason | null;
  /** Main file URL (MP4 for video). Null when the file is missing. */
  src: string | null;
  /** WebM URL for video, when present. */
  webmSrc: string | null;
  posterSrc: string | null;
  srcSet: string | null;
  aspect: string;
  aspectCss: string;
};

export type ResolveOptions = {
  manifest?: MediaManifest;
  /** Injected for tests. Receives a path relative to /public. */
  fileExists?: (relativePath: string) => boolean;
};

function defaultFileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(PUBLIC_DIR, relativePath));
}

export function resolveSlot(id: string, options: ResolveOptions = {}): ResolvedSlot {
  const manifest = options.manifest ?? getManifest();
  const exists = options.fileExists ?? defaultFileExists;
  const slot = manifest.slots.find((s) => s.id === id);
  if (!slot) throw new UnknownSlotError(id, getSlotIds(manifest));

  const { css } = parseAspect(slot.aspect);
  const mainExists = exists(slot.path);
  const webmExists = slot.altPath ? exists(slot.altPath) : false;
  const posterExists = slot.poster ? exists(slot.poster) : false;

  const hasFile = slot.type === "video" ? mainExists || webmExists : mainExists;
  const ready = isReadyStatus(slot.status);

  let reason: PlaceholderReason | null = null;
  if (!ready) reason = "placeholder-status";
  else if (!hasFile) reason = "missing-file";

  if (ready && !hasFile && process.env.NODE_ENV === "development") {
    console.warn(`[media] slot "${id}" is "${slot.status}" but ${slot.path} is missing in /public`);
  }

  const variants = slot.variants?.filter((v) => exists(v.path)) ?? [];
  const srcSet =
    slot.type === "image" && variants.length > 0
      ? variants.map((v) => `${publicUrl(v.path)} ${v.width}w`).join(", ")
      : null;

  return {
    slot,
    available: reason === null,
    reason,
    src: mainExists ? publicUrl(slot.path) : null,
    webmSrc: webmExists && slot.altPath ? publicUrl(slot.altPath) : null,
    posterSrc: posterExists && slot.poster ? publicUrl(slot.poster) : null,
    srcSet,
    aspect: slot.aspect,
    aspectCss: css,
  };
}
