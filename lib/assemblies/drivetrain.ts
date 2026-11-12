import { ALONG_X, box, rod } from "./geometry";
import type { Assembly, Shape, Vec2, Vec3 } from "./types";

/**
 * The drivetrain of a front-wheel-drive car, schematic, seen from the front
 * of the car. The engine sits sideways, so its crankshaft runs along X (across
 * the car) at y = 0. The gearbox is bolted to its right end, and a driveshaft
 * runs from the gearbox to each front wheel hub, behind the engine.
 *
 * Positions and order matter more than looks: flywheel on the engine, clutch
 * on the flywheel, gearbox over the clutch, and the two CV axles between the
 * differential in the gearbox and the wheel hubs.
 */

/** Line through the differential and both wheel hubs: lower than the crankshaft and behind it. */
const AXLE_Y = -0.5;
const AXLE_Z = 1.0;
/** How far out the wheel hubs are. */
export const HUB_X = 5.2;
/** The differential housing sticks out of the gearbox between these points. */
export const DIFF = { left: 0.1, right: 1.0 };

/** Rotation that points a round shape's axis towards +X or -X. */
const towards = (side: number): Vec3 => (side > 0 ? ALONG_X : [0, 0, Math.PI / 2]);

const BOOT: Vec2[] = [
  [0.28, 0],
  [0.24, 0.08],
  [0.27, 0.14],
  [0.19, 0.22],
  [0.22, 0.28],
  [0.13, 0.37],
  [0.1, 0.45],
];

const onAxle = (x0: number, x1: number, r: number, tone: Shape["tone"]): Shape =>
  rod([x0, AXLE_Y, AXLE_Z], [x1, AXLE_Y, AXLE_Z], r, tone);

/** One CV axle, from the differential (inner end) out to a wheel hub. */
function cvAxle(inner: number, side: 1 | -1): Shape[] {
  const outer = side * (HUB_X + 0.4);
  const boot = (x: number, direction: number): Shape => ({
    kind: "lathe",
    profile: BOOT,
    position: [x, AXLE_Y, AXLE_Z],
    rotation: towards(direction),
    tone: "rubber",
  });
  return [
    // Inner joint and boot at the gearbox.
    onAxle(inner, inner + side * 0.5, 0.28, "steel"),
    boot(inner + side * 0.5, side),
    onAxle(inner + side * 0.5, outer - side * 1.05, 0.09, "steel"),
    // Outer joint and boot at the wheel, and the splined end that goes through the hub.
    boot(outer - side * 0.6, -side),
    onAxle(outer - side * 0.6, outer - side * 0.25, 0.3, "steel"),
    onAxle(outer - side * 0.25, outer, 0.12, "steel"),
  ];
}

/** A wheel hub: bearing, flange and wheel studs. */
function hub(side: 1 | -1): Shape[] {
  const studs = [0, 72, 144, 216, 288].map((deg) => {
    const a = (deg * Math.PI) / 180;
    const at = (x: number): Vec3 => [
      side * x,
      AXLE_Y + 0.38 * Math.sin(a),
      AXLE_Z + 0.38 * Math.cos(a),
    ];
    return rod(at(HUB_X + 0.5), at(HUB_X + 0.85), 0.04, "steel");
  });
  return [
    {
      kind: "lathe",
      profile: [
        [0.14, 0],
        [0.36, 0],
        [0.36, 0.4],
        [0.55, 0.4],
        [0.55, 0.52],
        [0.22, 0.52],
        [0.22, 0.7],
        [0.14, 0.7],
        [0.14, 0],
      ],
      position: [side * HUB_X, AXLE_Y, AXLE_Z],
      rotation: towards(side),
      tone: "steel",
    },
    ...studs,
  ];
}

export const drivetrain: Assembly = {
  id: "drivetrain",
  title: "Front-wheel-drive drivetrain",
  note: "Schematic: simplified shapes, not to scale. This is the usual layout for a front-wheel-drive car with a manual gearbox; rear- and four-wheel-drive cars are laid out differently.",
  orientation:
    "Seen from the front of the car. The engine is on the left, the gearbox on the right.",
  camera: [0.25, 0.35, 0.9],
  pieces: [
    {
      id: "cv-axles",
      label: "CV axles (driveshafts)",
      partId: "cv-axle",
      removalOrder: 1,
      explodeOffset: [0, 0, 2.4],
      labelAt: [3.2, AXLE_Y + 0.1, AXLE_Z],
      description:
        "One to each front wheel. They come out first: each is released from its wheel hub and pulled out of the gearbox.",
      shapes: [...cvAxle(DIFF.right, 1), ...cvAxle(DIFF.left, -1)],
    },
    {
      id: "gearbox",
      label: "Transmission (gearbox)",
      partId: "transmission",
      removalOrder: 2,
      explodeOffset: [3.0, 0, 0],
      labelAt: [1.3, 0.95, 0.15],
      description:
        "Unbolts from the engine and slides straight off. The wide end covers the clutch; the bulge at the back holds the differential.",
      shapes: [
        // Bell housing over the clutch.
        {
          kind: "lathe",
          profile: [
            [1.06, 0],
            [1.14, 0],
            [1.14, 0.25],
            [0.8, 0.9],
            [0, 0.9],
          ],
          position: [-0.6, 0, 0],
          rotation: ALONG_X,
          tone: "aluminium",
        },
        box([1.5, 1.3, 1.4], [1.05, 0, 0.15], "aluminium", 0.15),
        box([0.25, 1.0, 1.0], [1.925, 0, 0.15], "aluminium", 0.08),
        // Differential housing, in line with the wheels.
        {
          kind: "lathe",
          profile: [
            [0, 0],
            [0.35, 0],
            [0.62, 0.2],
            [0.62, 0.7],
            [0.35, 0.9],
            [0, 0.9],
          ],
          position: [DIFF.left, AXLE_Y, AXLE_Z],
          rotation: ALONG_X,
          tone: "aluminium",
        },
        // Gear selector on top.
        rod([1.0, 0.65, 0.15], [1.0, 0.95, 0.15], 0.07, "steel"),
        box([0.5, 0.06, 0.12], [1.15, 0.95, 0.15], "steel", 0.02),
      ],
    },
    {
      id: "clutch",
      label: "Clutch",
      partId: "clutch",
      removalOrder: 3,
      explodeOffset: [1.5, 0, 0],
      labelAt: [-0.4, 0.9, 0],
      description:
        "A friction disc and the sprung cover that clamps it. Both are bolted to the flywheel and show once the gearbox is off.",
      shapes: [
        rod([-0.57, 0, 0], [-0.5, 0, 0], 0.78, "friction"),
        rod([-0.6, 0, 0], [-0.4, 0, 0], 0.22, "steel"),
        {
          kind: "lathe",
          profile: [
            [0.9, 0],
            [0.9, 0.12],
            [0.6, 0.3],
            [0.25, 0.3],
            [0.25, 0.22],
            [0.55, 0.22],
            [0.82, 0.08],
            [0.82, 0],
            [0.9, 0],
          ],
          position: [-0.5, 0, 0],
          rotation: ALONG_X,
          tone: "dark",
        },
      ],
    },
    {
      id: "flywheel",
      label: "Flywheel",
      removalOrder: 4,
      explodeOffset: [0.7, 0, 0],
      labelAt: [-0.7, 1.05, 0],
      description:
        "A heavy disc bolted to the end of the crankshaft. The clutch presses against its smooth face.",
      shapes: [
        {
          kind: "lathe",
          profile: [
            [0, 0],
            [0.95, 0],
            [0.95, 0.03],
            [1.02, 0.03],
            [1.02, 0.13],
            [0.95, 0.13],
            [0.95, 0.16],
            [0, 0.16],
          ],
          position: [-0.75, 0, 0],
          rotation: ALONG_X,
          tone: "steel",
        },
      ],
    },
    {
      id: "engine",
      label: "Engine",
      removalOrder: 5,
      explodeOffset: [0, 0, 0],
      labelAt: [-2.1, 2.3, 0],
      description: "Where the power comes from. It stays in the car for a clutch or gearbox job.",
      shapes: [
        box([2.65, 0.5, 1.4], [-2.075, -0.75, 0], "dark", 0.08),
        box([2.65, 1.9, 1.5], [-2.075, 0.45, 0], "cast-iron", 0.04),
        box([2.65, 0.55, 1.5], [-2.075, 1.675, 0], "aluminium", 0.04),
        box([2.5, 0.35, 1.3], [-2.075, 2.125, 0], "plastic", 0.1),
      ],
    },
    {
      id: "hubs",
      label: "Wheel hubs",
      removalOrder: 5,
      explodeOffset: [0, 0, 0],
      labelAt: [HUB_X + 0.5, AXLE_Y + 0.6, AXLE_Z],
      description:
        "Each front wheel bolts to one. The splined end of a CV axle goes through its centre and turns it.",
      shapes: [...hub(1), ...hub(-1)],
    },
  ],
};
