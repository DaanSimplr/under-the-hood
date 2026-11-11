import { ALONG_X, box, circle, EXTRUDE_ALONG_X, rod, sector } from "./geometry";
import type { Assembly, Shape, Vec2, Vec3 } from "./types";

/**
 * Front brake corner, schematic. The axle runs along X; +X is outboard (the
 * wheel side). The caliper sits at the top of the disc.
 *
 * Positions and order matter more than looks: the centre of the disc (its
 * "hat") sits on the outboard face of the hub flange over the wheel studs,
 * the friction ring sits around the hub, the bracket straddles the disc edge,
 * a pad sits on each face of the ring, and the caliper wraps over both pads.
 */

/** The friction ring of the disc: where it sits along the axle, and its size. */
export const DISC_RING = { inboard: -0.26, outboard: -0.06, innerRadius: 0.76, radius: 1.4 };
/** Outboard face of the hub flange. The disc hat sits against it. */
export const FLANGE_FACE = 0.05;

const HAT_T = 0.08;
const PAD_FRICTION_T = 0.08;
const PAD_BACKING_T = 0.04;
const STUD_CIRCLE = 0.45;

const studAngles = [0, 72, 144, 216, 288].map((deg) => (deg * Math.PI) / 180);

/** Ring and hat wall of a vented disc, as a profile around the axle. */
const discProfile: Vec2[] = [
  [0.66, FLANGE_FACE],
  [0.66, DISC_RING.inboard],
  [DISC_RING.radius, DISC_RING.inboard],
  [DISC_RING.radius, -0.2],
  [0.86, -0.2],
  [0.86, -0.12],
  [DISC_RING.radius, -0.12],
  [DISC_RING.radius, DISC_RING.outboard],
  [DISC_RING.innerRadius, DISC_RING.outboard],
  [DISC_RING.innerRadius, FLANGE_FACE],
  [0.66, FLANGE_FACE],
];

/** A pad is a slice of a ring at the top of the disc: steel backing plate plus friction block. */
function pad(faceX: number, direction: 1 | -1): Shape[] {
  const friction = faceX + (direction * PAD_FRICTION_T) / 2;
  const backing = faceX + direction * (PAD_FRICTION_T + PAD_BACKING_T / 2);
  return [
    {
      kind: "extrude",
      outline: sector(0.98, 1.36, 67, 113),
      depth: PAD_FRICTION_T,
      position: [friction, 0, 0],
      rotation: EXTRUDE_ALONG_X,
      tone: "friction",
    },
    {
      kind: "extrude",
      outline: sector(0.95, 1.38, 64, 116),
      depth: PAD_BACKING_T,
      position: [backing, 0, 0],
      rotation: EXTRUDE_ALONG_X,
      tone: "steel",
    },
  ];
}

/** One arm of the bracket: a bridge over the disc edge with a leg on each side. */
function bracketArm(z: number): Shape {
  return {
    kind: "extrude",
    outline: [
      [-0.42, 0.9],
      [-0.3, 0.9],
      [-0.3, 1.46],
      [-0.03, 1.46],
      [-0.03, 0.96],
      [0.07, 0.96],
      [0.07, 1.6],
      [-0.42, 1.6],
    ],
    depth: 0.14,
    bevel: 0.015,
    position: [0, 0, z],
    tone: "dark",
  };
}

/** One arm of the caliper body, seen from the end of the car. */
function caliperArm(z: number): Shape {
  return {
    kind: "extrude",
    outline: [
      [-0.78, 0.88],
      [-0.43, 0.88],
      [-0.43, 1.5],
      [0.07, 1.5],
      [0.07, 0.98],
      [0.2, 0.98],
      [0.2, 1.7],
      [-0.78, 1.7],
    ],
    depth: 0.26,
    bevel: 0.03,
    position: [0, 0, z],
    tone: "accent",
  };
}

export const brakeCorner: Assembly = {
  id: "brake-corner",
  title: "Front brake corner",
  note: "Schematic: simplified shapes, not to scale. Real calipers, brackets and hubs vary by car.",
  orientation: "The axle runs left to right. The wheel side (outboard) is on the right.",
  camera: [0.56, 0.3, 0.72],
  pieces: [
    {
      id: "caliper",
      label: "Caliper",
      partId: "brake-caliper",
      removalOrder: 1,
      explodeOffset: [-0.3, 2.3, 0],
      labelAt: [-0.3, 1.95, 0],
      description:
        "Comes off first: remove the two guide pin bolts and lift it off the pads. It stays attached to its brake hose.",
      shapes: [
        // Two arms, each a C seen from the end: down the inboard side, over the disc edge,
        // and down the outboard side. The gap between them is the window over the pads.
        caliperArm(0.31),
        caliperArm(-0.31),
        // Piston housing inboard, and the bars that tie the arms together.
        {
          kind: "cylinder",
          args: [0.27, 0.27, 0.4],
          position: [-0.62, 1.16, 0],
          rotation: ALONG_X,
          tone: "accent",
        },
        box([0.35, 0.2, 0.88], [-0.605, 1.6, 0], "accent", 0.03),
        box([0.13, 0.24, 0.88], [0.135, 1.1, 0], "accent", 0.03),
        // Piston, pointing outboard at the inner pad.
        {
          kind: "cylinder",
          args: [0.2, 0.2, 0.09],
          position: [-0.425, 1.16, 0],
          rotation: ALONG_X,
          tone: "steel",
        },
        // Ears for the guide pins, with the two guide pin bolts.
        box([0.16, 0.2, 0.2], [-0.56, 1.2, 0.5], "accent", 0.03),
        box([0.16, 0.2, 0.2], [-0.56, 1.2, -0.5], "accent", 0.03),
        rod([-0.74, 1.2, 0.52], [-0.4, 1.2, 0.52], 0.045, "steel"),
        rod([-0.74, 1.2, -0.52], [-0.4, 1.2, -0.52], 0.045, "steel"),
        // Bleed nipple and the start of the brake hose.
        rod([-0.66, 1.68, 0.2], [-0.66, 1.82, 0.2], 0.03, "steel"),
        rod([-0.76, 1.3, -0.15], [-1.0, 1.42, -0.15], 0.05, "rubber"),
      ],
    },
    {
      id: "outer-pad",
      label: "Outer pad",
      partId: "brake-pads",
      removalOrder: 2,
      explodeOffset: [0.55, 1.5, 0],
      labelAt: [0.3, 1.0, 0.75],
      description:
        "Sits against the outboard face of the disc. Slides out of the bracket once the caliper is off.",
      shapes: pad(DISC_RING.outboard, 1),
    },
    {
      id: "inner-pad",
      label: "Inner pad",
      partId: "brake-pads",
      removalOrder: 2,
      explodeOffset: [-0.55, 1.5, 0],
      labelAt: [-0.5, 1.0, 0.75],
      description: "Sits against the inboard face of the disc, pushed by the caliper piston.",
      shapes: pad(DISC_RING.inboard, -1),
    },
    {
      id: "bracket",
      label: "Caliper bracket",
      removalOrder: 3,
      explodeOffset: [0, 0.72, 0],
      labelAt: [-0.2, 1.62, -0.8],
      description:
        "Bolted to the steering knuckle. It holds the pads and the caliper's guide pins. Only removed when changing the disc.",
      shapes: [
        bracketArm(0.6),
        bracketArm(-0.6),
        // Bar that ties the two arms together, with the two mounting bolts.
        box([0.12, 0.16, 1.34], [-0.36, 0.98, 0], "dark", 0.03),
        rod([-0.5, 0.98, 0.42], [-0.3, 0.98, 0.42], 0.06, "steel"),
        rod([-0.5, 0.98, -0.42], [-0.3, 0.98, -0.42], 0.06, "steel"),
      ],
    },
    {
      id: "disc",
      label: "Brake disc",
      partId: "brake-disc",
      removalOrder: 4,
      explodeOffset: [1.0, 0, 0],
      labelAt: [0, -1.05, 1.0],
      description:
        "Slides off the wheel studs once the caliper and bracket are off. Some have a small retaining screw.",
      shapes: [
        // Vented friction ring and the wall of the "hat".
        { kind: "lathe", profile: discProfile, rotation: ALONG_X, tone: "cast-iron" },
        // Face of the hat, with the centre bore and the five stud holes.
        {
          kind: "extrude",
          outline: circle(0, 0, DISC_RING.innerRadius, 64),
          holes: [
            circle(0, 0, 0.3, 40),
            ...studAngles.map((a) =>
              circle(STUD_CIRCLE * Math.cos(a), STUD_CIRCLE * Math.sin(a), 0.07, 16),
            ),
          ],
          depth: HAT_T,
          position: [FLANGE_FACE + HAT_T / 2, 0, 0],
          rotation: EXTRUDE_ALONG_X,
          tone: "cast-iron",
        },
      ],
    },
    {
      id: "hub",
      label: "Hub & bearing",
      partId: "wheel-hub",
      removalOrder: 5,
      explodeOffset: [0, 0, 0],
      labelAt: [-0.75, -0.7, 0],
      description:
        "Stays on the car for a pad or disc job. The disc and wheel bolt to its flange over the wheel studs.",
      shapes: [
        // Flange, bearing housing, and the centre spigot that locates the disc.
        {
          kind: "lathe",
          profile: [
            [0, -0.72],
            [0.46, -0.72],
            [0.52, -0.66],
            [0.52, -0.09],
            [0.6, -0.09],
            [0.6, FLANGE_FACE],
            [0.28, FLANGE_FACE],
            [0.28, 0.2],
            [0, 0.2],
          ],
          rotation: ALONG_X,
          tone: "steel",
        },
        // Axle nut.
        {
          kind: "cylinder",
          args: [0.13, 0.13, 0.1],
          position: [0.25, 0, 0],
          rotation: ALONG_X,
          tone: "dark",
        },
        ...studAngles.map((a) => {
          const at = (x: number): Vec3 => [
            x,
            STUD_CIRCLE * Math.sin(a),
            -STUD_CIRCLE * Math.cos(a),
          ];
          return rod(at(0), at(0.55), 0.05, "steel");
        }),
      ],
    },
  ],
};
