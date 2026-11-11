/**
 * The outer skin of the schematic car, as one smooth surface that is cut into
 * panels (bonnet, doors, roof and so on).
 *
 * The car points towards -X, Y is up, and +Z is the car's left side. The skin
 * is a grid: "stations" along the length, and at each station a row of points
 * that runs from the bottom of the left side, up over the top, and down the
 * right side. A panel is a rectangle of that grid.
 */
import { smoothCurve } from "./geometry";
import type { Vec2 } from "./types";

/** Main dimensions, in metres. Everything else in the car model hangs off these. */
export const CAR = {
  front: -2.15,
  rear: 2.15,
  halfWidth: 0.88,
  frontAxle: -1.3,
  rearAxle: 1.3,
  wheelRadius: 0.32,
  wheelZ: 0.76,
  archRadius: 0.36,
} as const;

/**
 * Row numbers on one side of the car. Rows 0 to `shoulder` are the side of the
 * body, `shoulder` to `glassTop` the side windows (or the edge of the bonnet
 * and boot lid), `glassTop` to `railTop` the roof rail and pillars, and
 * `railTop` to `centre` half of the roof, bonnet, boot lid or a window.
 */
export const ROWS = { sill: 0, shoulder: 8, glassTop: 13, railTop: 15, centre: 20 } as const;

/** Lengthwise positions where panels meet. */
export const CUTS = {
  nose: -2.05,
  frontArch: CAR.frontAxle - CAR.archRadius,
  cowl: -0.95,
  frontDoor: -0.85,
  roofFront: -0.25,
  pillarFront: 0.15,
  midDoor: 0.2,
  pillarRear: 0.25,
  rearDoor: CAR.rearAxle - CAR.archRadius,
  roofRear: 1.05,
  rearArch: CAR.rearAxle + CAR.archRadius,
  deck: 1.75,
  tail: 2.05,
} as const;

const topLine = smoothCurve([
  [-2.15, 0.64],
  [-2.05, 0.72],
  [-1.6, 0.84],
  [-0.95, 0.92],
  [-0.25, 1.36],
  [0.35, 1.43],
  [1.05, 1.38],
  [1.75, 1.03],
  [2.05, 0.99],
  [2.15, 0.9],
]);
const shoulderLine = smoothCurve([
  [-2.15, 0.58],
  [-1.6, 0.76],
  [-0.95, 0.86],
  [0, 0.9],
  [1.2, 0.92],
  [1.75, 0.93],
  [2.15, 0.86],
]);
/** Half width at the shoulder, as a share of the full half width. Rounds off the corners. */
const widthLine = smoothCurve([
  [-2.15, 0.6],
  [-2.05, 0.74],
  [-1.85, 0.88],
  [-1.5, 0.96],
  [-0.8, 1],
  [0.8, 1],
  [1.5, 0.97],
  [1.9, 0.88],
  [2.05, 0.76],
  [2.15, 0.62],
]);
const sillLine = smoothCurve([
  [-2.15, 0.28],
  [-1.75, 0.2],
  [1.75, 0.2],
  [2.15, 0.3],
]);
/** Where the roof rail (or bonnet edge) sits: how far in, and how far up from shoulder to top. */
const railIn = smoothCurve([
  [-0.95, 0.8],
  [-0.25, 0.74],
  [1.05, 0.74],
  [1.75, 0.8],
]);
const railUp = smoothCurve([
  [-0.95, 0.7],
  [-0.25, 0.9],
  [1.05, 0.9],
  [1.75, 0.7],
]);

const SIDE_ROWS = ROWS.shoulder;
const GLASS_STEPS = [0.2, 0.4, 0.6, 0.8, 0.93, 1];
const TOP_STEPS = [0.07, 0.25, 0.45, 0.65, 0.85, 1];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Height of the lower edge of the body side, including the wheel arches. */
export function lowerEdge(x: number): number {
  let y = sillLine(x);
  for (const axle of [CAR.frontAxle, CAR.rearAxle]) {
    const dx = x - axle;
    if (Math.abs(dx) < CAR.archRadius)
      y = Math.max(y, CAR.wheelRadius + Math.sqrt(CAR.archRadius ** 2 - dx ** 2));
  }
  return y;
}

/** Height of the skin on the centre line (bonnet, roof, boot lid). */
export function topHeight(x: number): number {
  return topLine(x);
}

/** The left half of the body's cross-section at x, as [y, z] points for rows 0 to `ROWS.centre`. */
export function section(x: number): Vec2[] {
  const w = CAR.halfWidth * widthLine(x);
  const bottom = lowerEdge(x);
  const shoulder = shoulderLine(x);
  const top = Math.max(topLine(x), shoulder + 0.02);
  const railY = lerp(shoulder, top, railUp(x));
  const railZ = w * railIn(x);
  const points: Vec2[] = [];
  for (let i = 0; i <= SIDE_ROWS; i++) {
    const t = i / SIDE_ROWS;
    points.push([lerp(bottom, shoulder, t), lerp(w - 0.04, w, t) + 0.03 * Math.sin(Math.PI * t)]);
  }
  for (const s of GLASS_STEPS) points.push([lerp(shoulder, railY, s), lerp(w, railZ, s ** 1.4)]);
  for (const s of TOP_STEPS)
    points.push([railY + (top - railY) * (1 - (1 - s) ** 2), railZ * (1 - s)]);
  return points;
}

const round = (x: number) => Math.round(x * 1e4) / 1e4;

/** Stations every 5 cm, plus one exactly at every panel cut. */
export const STATIONS: number[] = (() => {
  const xs = new Set<number>();
  for (let x = CAR.front; x <= CAR.rear + 1e-9; x += 0.05) xs.add(round(x));
  for (const x of Object.values(CUTS)) xs.add(round(x));
  return [...xs].sort((a, b) => a - b);
})();

const FULL_ROWS = ROWS.centre * 2 + 1;
const SECTIONS = STATIONS.map(section);

function stationIndex(x: number): number {
  const i = STATIONS.indexOf(round(x));
  if (i < 0) throw new Error(`No body station at x=${x}`);
  return i;
}

/** Point of the full skin grid. Rows past the centre are the right side (z flipped). */
function gridPoint(station: number, row: number): [number, number, number] {
  const right = row > ROWS.centre;
  const [y, z] = SECTIONS[station]![right ? FULL_ROWS - 1 - row : row]!;
  return [STATIONS[station]!, y, right ? -z : z];
}

export type Patch = {
  /** From and to along the length. Both must be in `CUTS` or on the 5 cm grid. */
  x: [number, number];
  /** From and to row on the left side (see `ROWS`). */
  rows: [number, number];
  /** "left" for one side only (mirrored pieces), "both" for both sides. */
  sides: "left" | "both";
};

export type Surface = { positions: number[]; indices: number[] };

class SurfaceBuilder {
  positions: number[] = [];
  indices: number[] = [];
  private seen = new Map<number, number>();

  vertex(station: number, row: number): number {
    const key = station * FULL_ROWS + row;
    let index = this.seen.get(key);
    if (index === undefined) {
      index = this.positions.length / 3;
      this.positions.push(...gridPoint(station, row));
      this.seen.set(key, index);
    }
    return index;
  }

  quad(a: number, b: number, c: number, d: number) {
    this.indices.push(a, b, c, a, c, d);
  }

  strip(s0: number, s1: number, r0: number, r1: number) {
    for (let s = s0; s < s1; s++)
      for (let r = r0; r < r1; r++)
        this.quad(
          this.vertex(s, r),
          this.vertex(s + 1, r),
          this.vertex(s + 1, r + 1),
          this.vertex(s, r + 1),
        );
  }
}

/** Cuts a panel out of the body skin. `cap` also closes the front or rear end of the car. */
export function bodyPanel(patches: Patch[], cap?: "front" | "rear"): Surface {
  const b = new SurfaceBuilder();
  for (const { x, rows, sides } of patches) {
    const s0 = stationIndex(x[0]);
    const s1 = stationIndex(x[1]);
    b.strip(s0, s1, rows[0], rows[1]);
    if (sides === "both") b.strip(s0, s1, FULL_ROWS - 1 - rows[1], FULL_ROWS - 1 - rows[0]);
  }
  if (cap) {
    const s = cap === "front" ? 0 : STATIONS.length - 1;
    for (let r = 0; r < ROWS.centre; r++)
      b.quad(
        b.vertex(s, r),
        b.vertex(s, r + 1),
        b.vertex(s, FULL_ROWS - 2 - r),
        b.vertex(s, FULL_ROWS - 1 - r),
      );
  }
  return { positions: b.positions, indices: b.indices };
}
