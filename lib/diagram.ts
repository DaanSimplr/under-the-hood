/** Shared constants and helpers for the 2D car diagram (pure, client-safe). */

export const DIAGRAM_VIEWBOX = { width: 1000, height: 440 } as const;

export const WHEELS = [
  { cx: 230, cy: 352, r: 62 },
  { cx: 780, cy: 352, r: 62 },
] as const;

/** Plain-language description of a point on the side view, for screen readers and captions. */
export function describeLocation(x: number, y: number): string {
  const along = x < 350 ? "front" : x < 700 ? "middle" : "rear";
  const height =
    y < 235 ? "near the top" : y < 330 ? "about halfway up" : "low down, near the road";
  if (along === "front" && y < 330) return `in the engine bay at the front of the car, ${height}`;
  const nearWheel = WHEELS.some((w) => Math.hypot(w.cx - x, w.cy - y) <= w.r + 15);
  if (nearWheel) return `at the ${along === "front" ? "front" : "rear"} wheel`;
  return `towards the ${along} of the car, ${height}`;
}

export type DiagramPart = {
  id: string;
  name: string;
  systemId: string;
  summary: string;
  connectsTo: string[];
  x: number;
  y: number;
};

/** Connection map in both directions: a part lists what it connects to, and is listed by others. */
export function buildConnections(parts: Pick<DiagramPart, "id" | "connectsTo">[]) {
  const map = new Map<string, Set<string>>();
  for (const p of parts) map.set(p.id, new Set());
  for (const p of parts) {
    for (const other of p.connectsTo) {
      if (!map.has(other)) continue;
      map.get(p.id)!.add(other);
      map.get(other)!.add(p.id);
    }
  }
  return map;
}
