import { ALONG_X, box, EXTRUDE_ALONG_X, gearOutline, rod } from "./geometry";
import type { Assembly, Shape, Tone, Vec2 } from "./types";

/**
 * Clutch and manual gearbox, schematic, shown as if the gearbox has been
 * unbolted from the engine. Everything turns around lines that run along X.
 * The input shaft is on the crankshaft's line (y = 0, z = 0); the output
 * shaft runs beside it, and the differential beside that.
 *
 * Positions and order matter more than looks: flywheel, clutch disc, pressure
 * plate and release bearing follow each other along the input shaft; each
 * gear on the input shaft meshes with one on the output shaft; and the small
 * gear on the end of the output shaft turns the big ring gear of the
 * differential.
 */

/** Sideways positions (Z) of the three lines of rotation, and of the middle of the case. */
export const INPUT_Z = 0;
export const OUTPUT_Z = 1;
export const DIFF_Z = 2.2;
const CASE_Z = 0.5;

/** The four gear pairs: where they sit along the shafts, and the size of the input-shaft gear. */
export const GEAR_PAIRS: Array<{ x: number; input: number }> = [
  { x: 0, input: 0.35 },
  { x: 0.7, input: 0.45 },
  { x: 1.4, input: 0.55 },
  { x: 2.1, input: 0.65 },
];
export const PINION = { x: -0.3, radius: 0.3 };
export const RING_GEAR = { x: -0.32, radius: 0.9 };

/** Lower and upper half of a round shape that lies along X. */
const LOWER: Vec2 = [0, 180];
const UPPER: Vec2 = [180, 180];

const along = (x0: number, x1: number, z: number, r: number, tone: Tone): Shape =>
  rod([x0, 0, z], [x1, 0, z], r, tone);

const gear = (x: number, z: number, radius: number, width = 0.3): Shape => ({
  kind: "extrude",
  outline: gearOutline(radius, Math.round(radius * 40)),
  depth: width,
  position: [x, 0, z],
  rotation: EXTRUDE_ALONG_X,
  tone: "steel",
});

/** One half of the case: bell housing over the clutch, gear case, and differential housing. */
const caseHalf = (sweep: Vec2): Shape[] => [
  {
    kind: "lathe",
    sweep,
    profile: [
      [1.6, 0],
      [1.7, 0],
      [1.7, 0.3],
      [1.1, 1.45],
      [1.0, 1.45],
      [1.6, 0.3],
      [1.6, 0],
    ],
    position: [-2.05, 0, INPUT_Z],
    rotation: ALONG_X,
    tone: "aluminium",
  },
  {
    kind: "lathe",
    sweep,
    profile: [
      [0.2, 0],
      [1.45, 0],
      [1.45, 3.3],
      [0, 3.3],
      [0, 3.2],
      [1.35, 3.2],
      [1.35, 0.1],
      [0.2, 0.1],
      [0.2, 0],
    ],
    position: [-0.6, 0, CASE_Z],
    rotation: ALONG_X,
    tone: "aluminium",
  },
  {
    kind: "lathe",
    sweep,
    profile: [
      [0.2, 0],
      [1.15, 0],
      [1.15, 1.2],
      [0.2, 1.2],
      [0.2, 1.1],
      [1.05, 1.1],
      [1.05, 0.1],
      [0.2, 0.1],
      [0.2, 0],
    ],
    position: [-0.75, 0, DIFF_Z],
    rotation: ALONG_X,
    tone: "aluminium",
  },
];

/** Four short coil springs in the clutch disc that soften the take-up of drive. */
const damperSprings: Shape[] = [0, 90, 180, 270].map((deg) => {
  const a = (deg * Math.PI) / 180;
  const centre: Vec2 = [0.5 * Math.cos(a), 0.5 * Math.sin(a)];
  const half: Vec2 = [-0.16 * Math.sin(a), 0.16 * Math.cos(a)];
  return rod(
    [-2.02, centre[1] - half[1], centre[0] - half[0]],
    [-2.02, centre[1] + half[1], centre[0] + half[0]],
    0.075,
    "steel",
  );
});

export const clutchGearbox: Assembly = {
  id: "clutch-gearbox",
  title: "Clutch and gearbox",
  note: "Schematic: simplified shapes, not to scale. Shown as if the gearbox has already been unbolted from the engine. Real gearboxes have more gears, and reverse is left out.",
  orientation:
    "The engine would be on the left. The clutch parts come off that side; the gearbox opens upwards.",
  camera: [0.2, 0.45, 0.85],
  pieces: [
    {
      id: "release-bearing",
      label: "Release bearing",
      removalOrder: 1,
      explodeOffset: [-1.1, 0, 0],
      description:
        "Pressing the clutch pedal pushes this bearing against the spring fingers of the pressure plate, which lets go of the clutch disc.",
      shapes: [
        {
          kind: "lathe",
          profile: [
            [0.2, 0],
            [0.4, 0],
            [0.4, 0.3],
            [0.2, 0.3],
            [0.2, 0],
          ],
          position: [-1.35, 0, INPUT_Z],
          rotation: ALONG_X,
          tone: "steel",
        },
        // Fork that pushes it.
        box([0.1, 0.8, 0.3], [-1.1, 0.75, INPUT_Z], "dark", 0.03),
      ],
    },
    {
      id: "pressure-plate",
      label: "Pressure plate",
      partId: "clutch",
      removalOrder: 2,
      explodeOffset: [-2.3, 0, 0],
      description:
        "Bolted to the flywheel. Its spring clamps the clutch disc against the flywheel so the engine drives the gearbox.",
      shapes: [
        {
          kind: "lathe",
          profile: [
            [1.3, 0],
            [1.3, 0.15],
            [1.0, 0.5],
            [0.45, 0.5],
            [0.45, 0.42],
            [0.95, 0.42],
            [1.2, 0.1],
            [1.2, 0],
            [1.3, 0],
          ],
          position: [-1.96, 0, INPUT_Z],
          rotation: ALONG_X,
          tone: "dark",
        },
        // The iron ring that presses on the disc, and the spring fingers.
        {
          kind: "lathe",
          profile: [
            [0.78, 0],
            [1.15, 0],
            [1.15, 0.1],
            [0.78, 0.1],
            [0.78, 0],
          ],
          position: [-1.96, 0, INPUT_Z],
          rotation: ALONG_X,
          tone: "cast-iron",
        },
        {
          kind: "lathe",
          profile: [
            [1.0, 0.3],
            [0.25, 0.52],
          ],
          position: [-1.96, 0, INPUT_Z],
          rotation: ALONG_X,
          tone: "steel",
        },
      ],
    },
    {
      id: "clutch-disc",
      label: "Clutch disc",
      partId: "clutch",
      removalOrder: 2,
      explodeOffset: [-3.3, 0, 0],
      description:
        "A disc with friction material on both faces. Its centre slides on the splines of the gearbox input shaft. It drops free when the pressure plate comes off.",
      shapes: [
        {
          kind: "lathe",
          profile: [
            [0.75, 0],
            [1.15, 0],
            [1.15, 0.12],
            [0.75, 0.12],
            [0.75, 0],
          ],
          position: [-2.08, 0, INPUT_Z],
          rotation: ALONG_X,
          tone: "friction",
        },
        along(-2.05, -1.99, INPUT_Z, 0.78, "steel"),
        {
          kind: "lathe",
          profile: [
            [0.13, 0],
            [0.28, 0],
            [0.28, 0.3],
            [0.13, 0.3],
            [0.13, 0],
          ],
          position: [-2.17, 0, INPUT_Z],
          rotation: ALONG_X,
          tone: "dark",
        },
        ...damperSprings,
      ],
    },
    {
      id: "flywheel",
      label: "Flywheel",
      removalOrder: 3,
      explodeOffset: [-4.4, 0, 0],
      description:
        "Bolted to the engine's crankshaft, so it always turns with the engine. The clutch disc is clamped against its face.",
      shapes: [
        {
          kind: "lathe",
          profile: [
            [0.2, 0],
            [1.42, 0],
            [1.42, 0.04],
            [1.5, 0.04],
            [1.5, 0.16],
            [1.42, 0.16],
            [1.42, 0.2],
            [0.2, 0.2],
            [0.2, 0],
          ],
          position: [-2.3, 0, INPUT_Z],
          rotation: ALONG_X,
          tone: "steel",
        },
      ],
    },
    {
      id: "case-upper",
      label: "Gearbox case (top half)",
      partId: "transmission",
      removalOrder: 4,
      explodeOffset: [0, 3.0, 0],
      description:
        "The case holds the shafts in line and keeps the gear oil in. Lifting off one half shows the gears.",
      shapes: caseHalf(UPPER),
    },
    {
      id: "selector-forks",
      label: "Selector forks",
      removalOrder: 5,
      explodeOffset: [0, 2.1, 0],
      description:
        "Moved by the gear lever. Each fork slides a collar along the output shaft to lock one gear to the shaft.",
      shapes: [
        rod([0, 0.95, OUTPUT_Z], [2.4, 0.95, OUTPUT_Z], 0.05, "steel"),
        box([0.1, 0.6, 0.7], [0.35, 0.62, OUTPUT_Z], "dark", 0.03),
        box([0.1, 0.6, 0.7], [1.75, 0.62, OUTPUT_Z], "dark", 0.03),
      ],
    },
    {
      id: "input-shaft",
      label: "Input shaft",
      partId: "transmission",
      removalOrder: 6,
      explodeOffset: [0, 1.2, -0.5],
      description:
        "Turned by the clutch disc on its splined end. It carries one gear of each pair.",
      shapes: [
        along(-2.2, 2.6, INPUT_Z, 0.12, "steel"),
        along(-0.5, -0.35, INPUT_Z, 0.25, "dark"),
        along(2.45, 2.6, INPUT_Z, 0.25, "dark"),
        ...GEAR_PAIRS.map(({ x, input }) => gear(x, INPUT_Z, input)),
      ],
    },
    {
      id: "output-shaft",
      label: "Output shaft",
      partId: "transmission",
      removalOrder: 6,
      explodeOffset: [0, 1.2, 0.3],
      description:
        "Carries the other gear of each pair. The pair that is locked to it sets how fast it turns. The small gear on its end drives the differential.",
      shapes: [
        along(-0.5, 2.6, OUTPUT_Z, 0.14, "steel"),
        along(2.45, 2.6, OUTPUT_Z, 0.25, "dark"),
        ...GEAR_PAIRS.map(({ x, input }) => gear(x, OUTPUT_Z, OUTPUT_Z - INPUT_Z - input)),
        gear(PINION.x, OUTPUT_Z, PINION.radius),
        // Sliding collars between the gear pairs.
        along(0.27, 0.43, OUTPUT_Z, 0.42, "dark"),
        along(1.67, 1.83, OUTPUT_Z, 0.42, "dark"),
      ],
    },
    {
      id: "differential",
      label: "Differential",
      removalOrder: 7,
      explodeOffset: [0, 1.0, 1.4],
      description:
        "Shares the drive between the two front wheels and lets them turn at different speeds in a corner. A CV axle plugs into each side.",
      shapes: [
        gear(RING_GEAR.x, DIFF_Z, RING_GEAR.radius, 0.22),
        {
          kind: "lathe",
          profile: [
            [0, 0],
            [0.5, 0],
            [0.55, 0.1],
            [0.55, 0.35],
            [0.4, 0.45],
            [0, 0.45],
          ],
          position: [-0.19, 0, DIFF_Z],
          rotation: ALONG_X,
          tone: "cast-iron",
        },
        along(-1.5, 1.2, DIFF_Z, 0.14, "steel"),
        along(-1.5, -1.2, DIFF_Z, 0.2, "dark"),
        along(0.9, 1.2, DIFF_Z, 0.2, "dark"),
      ],
    },
    {
      id: "case-lower",
      label: "Gearbox case (bottom half)",
      partId: "transmission",
      removalOrder: 8,
      explodeOffset: [0, 0, 0],
      description:
        "The other half of the case. The shafts and the differential sit in bearings in it. The wide end is the bell housing that covers the clutch.",
      shapes: caseHalf(LOWER),
    },
  ],
};
