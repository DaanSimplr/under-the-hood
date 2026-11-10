import type { Assembly } from "./types";

/**
 * Front brake corner, schematic. The axle runs along X; +X is outboard (the
 * wheel side). The caliper sits at the top of the disc.
 *
 * Positions and order matter more than looks: the hub flange is innermost, the
 * disc slides over the wheel studs outboard of it, the bracket straddles the
 * disc edge, a pad sits on each face of the disc, and the caliper wraps over
 * both pads.
 */
const DISC_X = 0.2;
const DISC_T = 0.12;
const PAD_T = 0.1;

const studs = [0, 72, 144, 216, 288].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return {
    kind: "cylinder" as const,
    args: [0.05, 0.05, 0.55] as [number, number, number],
    position: [0.2, 0.42 * Math.sin(a), 0.42 * Math.cos(a)] as [number, number, number],
    rotation: [0, 0, Math.PI / 2] as [number, number, number],
    tone: "steel" as const,
  };
});

export const brakeCorner: Assembly = {
  id: "brake-corner",
  title: "Front brake corner",
  note: "Schematic: simple shapes, not to scale. Real calipers, brackets and hubs vary by car.",
  orientation: "The axle runs left to right. The wheel side (outboard) is on the right.",
  pieces: [
    {
      id: "caliper",
      label: "Caliper",
      partId: "brake-caliper",
      removalOrder: 1,
      explodeOffset: [0.5, 2.4, 0],
      labelAt: [0.2, 1.85, 0],
      description:
        "Comes off first: remove the two guide pin bolts and lift it off the pads. It stays attached to its brake hose.",
      shapes: [
        // Inner housing with the piston (inboard side).
        { kind: "box", size: [0.22, 0.6, 1.0], position: [DISC_X - 0.27, 1.15, 0], tone: "accent" },
        // Outer "fingers" (outboard side).
        { kind: "box", size: [0.14, 0.5, 0.9], position: [DISC_X + 0.25, 1.15, 0], tone: "accent" },
        // Bridge over the disc edge.
        {
          kind: "box",
          size: [0.66, 0.16, 0.95],
          position: [DISC_X - 0.02, 1.52, 0],
          tone: "accent",
        },
        // Piston face, pointing outboard at the inner pad.
        {
          kind: "cylinder",
          args: [0.18, 0.18, 0.08],
          position: [DISC_X - 0.14, 1.1, 0],
          rotation: [0, 0, Math.PI / 2],
          tone: "steel",
        },
      ],
    },
    {
      id: "outer-pad",
      label: "Outer pad",
      partId: "brake-pads",
      removalOrder: 2,
      explodeOffset: [0.45, 1.45, 0],
      labelAt: [0.3, 0.55, 0.6],
      description:
        "Sits against the outboard face of the disc. Slides out of the bracket once the caliper is off.",
      shapes: [
        {
          kind: "box",
          size: [PAD_T, 0.42, 0.85],
          position: [DISC_X + DISC_T / 2 + PAD_T / 2, 1.1, 0],
          tone: "friction",
        },
      ],
    },
    {
      id: "inner-pad",
      label: "Inner pad",
      partId: "brake-pads",
      removalOrder: 2,
      explodeOffset: [-0.45, 1.45, 0],
      labelAt: [-0.3, 0.55, 0.6],
      description: "Sits against the inboard face of the disc, pushed by the caliper piston.",
      shapes: [
        {
          kind: "box",
          size: [PAD_T, 0.42, 0.85],
          position: [DISC_X - DISC_T / 2 - PAD_T / 2, 1.1, 0],
          tone: "friction",
        },
      ],
    },
    {
      id: "bracket",
      label: "Caliper bracket",
      removalOrder: 3,
      explodeOffset: [-0.2, 0.62, 0],
      labelAt: [0, 0.25, -0.75],
      description:
        "Bolted to the steering knuckle. It holds the pads and the caliper's guide pins. Only removed when changing the disc.",
      shapes: [
        { kind: "box", size: [0.55, 0.14, 1.3], position: [DISC_X - 0.05, 1.68, 0], tone: "dark" },
        {
          kind: "box",
          size: [0.14, 0.5, 0.18],
          position: [DISC_X - 0.3, 1.38, 0.62],
          tone: "dark",
        },
        {
          kind: "box",
          size: [0.14, 0.5, 0.18],
          position: [DISC_X - 0.3, 1.38, -0.62],
          tone: "dark",
        },
      ],
    },
    {
      id: "disc",
      label: "Brake disc",
      partId: "brake-disc",
      removalOrder: 4,
      explodeOffset: [0.75, 0, 0],
      labelAt: [0.3, -1.1, 0.8],
      description:
        "Slides off the wheel studs once the caliper and bracket are off. Some have a small retaining screw.",
      shapes: [
        // Friction ring.
        {
          kind: "cylinder",
          args: [1.4, 1.4, DISC_T],
          position: [DISC_X, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          tone: "cast-iron",
        },
        // "Hat" that sits on the hub flange.
        {
          kind: "cylinder",
          args: [0.72, 0.72, 0.15],
          position: [DISC_X - 0.075, 0, 0],
          rotation: [0, 0, Math.PI / 2],
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
      labelAt: [-0.6, -0.95, 0],
      description:
        "Stays on the car for a pad or disc job. The disc and wheel bolt to its flange over the wheel studs.",
      shapes: [
        // Flange.
        {
          kind: "cylinder",
          args: [0.68, 0.68, 0.14],
          position: [-0.02, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          tone: "steel",
        },
        // Bearing housing / knuckle stub.
        {
          kind: "cylinder",
          args: [0.5, 0.55, 0.5],
          position: [-0.35, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          tone: "dark",
        },
        ...studs,
      ],
    },
  ],
};
