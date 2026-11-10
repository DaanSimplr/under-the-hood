/** Pure media helpers, safe to import from client and server code. */

export type Aspect = { w: number; h: number; css: string; ratio: number };

/** "16:9" -> { w: 16, h: 9, css: "16 / 9", ratio: 1.777… } */
export function parseAspect(aspect: string): Aspect {
  const match = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(aspect.trim());
  if (!match) throw new Error(`Invalid aspect "${aspect}", expected something like "16:9"`);
  const w = Number(match[1]);
  const h = Number(match[2]);
  if (!(w > 0 && h > 0)) throw new Error(`Invalid aspect "${aspect}", both sides must be > 0`);
  return { w, h, css: `${w} / ${h}`, ratio: w / h };
}

/** Turns a manifest path (relative to /public) into a site URL. */
export function publicUrl(relativePath: string): string {
  return `/${relativePath.replace(/^\/+/, "")}`;
}

/** Statuses that mean "a real file should be shown". */
export function isReadyStatus(status: string): boolean {
  return status === "generated" || status === "approved";
}
