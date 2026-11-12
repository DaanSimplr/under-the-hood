import {
  ALONG_X,
  box,
  circle,
  EXTRUDE_ALONG_X,
  EXTRUDE_FLAT,
  rod,
  roundedRect,
  wrapOutline,
} from "./geometry";
import type { Assembly, Shape, Vec2 } from "./types";

/**
 * A four-cylinder petrol engine with one overhead camshaft, schematic. The
 * crankshaft runs along X at y = 0, the cylinders stand upright in a row, the
 * timing belt is on the -X end and the flywheel on the +X end.
 *
 * Positions and order matter more than looks: the pistons sit in the bores of
 * the block, the head gasket and cylinder head close the bores from above, the
 * camshaft sits on top of the head under the valve cover, and the oil pan
 * closes the block from below.
 */

/** Where the four cylinders sit along the crankshaft, and the size of their bores. */
export const CYLINDERS = [-1.5, -0.5, 0.5, 1.5];
export const BORE = 0.42;
/** Top face of the block. The head gasket and cylinder head sit on it. */
export const DECK = 2.6;

const PISTON_RADIUS = 0.4;
const THROW = 0.35;
const ROD_LENGTH = 1.85;
/** Pistons 1 and 4 are at the top of their stroke, 2 and 3 at the bottom. */
const crankpinY = (i: number) => (i === 0 || i === 3 ? THROW : -THROW);
const pistonPinY = (i: number) => crankpinY(i) + ROD_LENGTH;

const CAM_Y = 3.62;
const CAM_Z = -0.25;
const PLUG_Z = 0.3;
const TIMING_X = -2.35;

const blockOutline = roundedRect(0, 0, 4.2, 1.5, 0.12);
const bores = CYLINDERS.map((x) => circle(x, 0, BORE, 40));

const alongCrank = (x0: number, x1: number, y: number, z: number, r: number): Shape =>
  rod([x0, y, z], [x1, y, z], r, "steel");

const pistonProfile: Vec2[] = [
  [0, 0.35],
  [PISTON_RADIUS, 0.35],
  [PISTON_RADIUS, 0.28],
  [0.375, 0.28],
  [0.375, 0.25],
  [PISTON_RADIUS, 0.25],
  [PISTON_RADIUS, 0.2],
  [0.375, 0.2],
  [0.375, 0.17],
  [PISTON_RADIUS, 0.17],
  [PISTON_RADIUS, -0.25],
  [0, -0.25],
];

const pistonAndRod = (x: number, i: number): Shape[] => {
  const pin = pistonPinY(i);
  const crankpin = crankpinY(i);
  return [
    { kind: "lathe", profile: pistonProfile, position: [x, pin, 0], tone: "aluminium" },
    box([0.12, ROD_LENGTH - 0.25, 0.1], [x, (pin + crankpin) / 2, 0], "steel", 0.02),
    alongCrank(x - 0.1, x + 0.1, crankpin, 0, 0.2),
    alongCrank(x - 0.07, x + 0.07, pin, 0, 0.1),
  ];
};

/** One crank throw: the offset pin the connecting rod turns on, between two round webs. */
const crankThrow = (x: number, i: number): Shape[] => [
  alongCrank(x - 0.17, x + 0.17, crankpinY(i), 0, 0.12),
  alongCrank(x - 0.25, x - 0.17, 0, 0, 0.5),
  alongCrank(x + 0.17, x + 0.25, 0, 0, 0.5),
];

const sparkPlug = (x: number): Shape[] => [
  rod([x, 3.3, PLUG_Z], [x, 4.22, PLUG_Z], 0.07, "lamp"),
  rod([x, 4.12, PLUG_Z], [x, 4.42, PLUG_Z], 0.13, "dark"),
];

export const engine: Assembly = {
  id: "engine",
  title: "Four-cylinder engine",
  note: "Schematic: simplified shapes, not to scale. Engines differ in layout, and the order parts come off depends on the engine and the job.",
  orientation:
    "The crankshaft runs left to right. The timing belt is on the left end, the flywheel on the right.",
  camera: [0.5, 0.3, 0.8],
  pieces: [
    {
      id: "spark-plugs",
      label: "Spark plugs",
      partId: "spark-plug",
      removalOrder: 1,
      explodeOffset: [0, 5.3, 0],
      labelAt: [-1.5, 4.45, PLUG_Z],
      description:
        "One per cylinder, each under its ignition coil. They unscrew from the top of the cylinder head.",
      shapes: CYLINDERS.flatMap(sparkPlug),
    },
    {
      id: "valve-cover",
      label: "Valve cover",
      removalOrder: 2,
      explodeOffset: [0, 4.3, 0],
      labelAt: [1.7, 4.1, 0.5],
      description:
        "A lid over the top of the cylinder head. It keeps the oil in and covers the camshaft and valves.",
      shapes: [
        box([4.1, 0.6, 1.4], [0, 3.8, 0], "plastic", 0.12),
        rod([1.2, 4.08, -0.25], [1.2, 4.2, -0.25], 0.18, "dark"),
      ],
    },
    {
      id: "intake-manifold",
      label: "Intake manifold",
      removalOrder: 3,
      explodeOffset: [0, 2.9, -1.5],
      labelAt: [2.1, 3.55, -1.5],
      description:
        "Shares the incoming air out over the four cylinders. It is bolted to one side of the cylinder head.",
      shapes: [
        rod([-1.9, 3.3, -1.5], [1.9, 3.3, -1.5], 0.25, "plastic"),
        rod([1.9, 3.3, -1.5], [2.3, 3.3, -1.5], 0.2, "aluminium"),
        ...CYLINDERS.map((x) => rod([x, 3.05, -0.75], [x, 3.3, -1.35], 0.13, "plastic")),
      ],
    },
    {
      id: "exhaust-manifold",
      label: "Exhaust manifold",
      removalOrder: 3,
      explodeOffset: [0, 2.9, 1.5],
      labelAt: [-1.6, 3.1, 0.9],
      description:
        "Collects the burnt gas from the four cylinders into one pipe. It is bolted to the other side of the cylinder head.",
      shapes: [
        ...CYLINDERS.map((x) => rod([x, 3.0, 0.75], [x * 0.45, 2.4, 1.25], 0.12, "cast-iron")),
        rod([-0.75, 2.4, 1.25], [0.75, 2.4, 1.25], 0.16, "cast-iron"),
        rod([0, 2.4, 1.25], [0, 1.6, 1.35], 0.16, "cast-iron"),
        rod([0, 1.6, 1.35], [0, 1.52, 1.36], 0.24, "steel"),
      ],
    },
    {
      id: "timing-belt",
      label: "Timing belt",
      partId: "timing-belt",
      removalOrder: 4,
      explodeOffset: [-1.5, 0, 0],
      labelAt: [TIMING_X, 4.2, CAM_Z],
      description:
        "Links the crankshaft to the camshaft so the valves open in step with the pistons. On a real engine it runs behind a cover.",
      shapes: [
        {
          kind: "extrude",
          outline: wrapOutline([0, 0], 0.32, [-CAM_Z, CAM_Y], 0.57),
          holes: [wrapOutline([0, 0], 0.27, [-CAM_Z, CAM_Y], 0.52)],
          depth: 0.12,
          position: [TIMING_X, 0, 0],
          rotation: EXTRUDE_ALONG_X,
          tone: "rubber",
        },
      ],
    },
    {
      id: "camshaft",
      label: "Camshaft",
      removalOrder: 5,
      explodeOffset: [0, 3.6, 0],
      labelAt: [0.5, 3.8, CAM_Z],
      description:
        "Its egg-shaped lobes push the valves open as it turns. It sits in the top of the cylinder head and normally comes off with it.",
      shapes: [
        alongCrank(TIMING_X - 0.07, 2.05, CAM_Y, CAM_Z, 0.09),
        alongCrank(TIMING_X - 0.07, TIMING_X + 0.07, CAM_Y, CAM_Z, 0.52),
        ...CYLINDERS.flatMap((x) =>
          [-0.22, 0.22].map((dx) =>
            alongCrank(x + dx - 0.06, x + dx + 0.06, CAM_Y + 0.04, CAM_Z, 0.15),
          ),
        ),
      ],
    },
    {
      id: "cylinder-head",
      label: "Cylinder head",
      removalOrder: 5,
      explodeOffset: [0, 2.9, 0],
      labelAt: [2.1, 3.5, 0.75],
      description:
        "Closes the top of the cylinders. It holds the valves and has the passages for air, exhaust gas and coolant.",
      shapes: [box([4.2, 0.85, 1.5], [0, 3.07, 0], "aluminium", 0.04)],
    },
    {
      id: "head-gasket",
      label: "Head gasket",
      removalOrder: 6,
      explodeOffset: [0, 2.3, 0],
      labelAt: [-2.1, 2.7, 0.75],
      description:
        "A thin seal between the block and the head. It keeps the burning gas, the oil and the coolant apart.",
      shapes: [
        {
          kind: "extrude",
          outline: blockOutline,
          holes: bores,
          depth: 0.04,
          position: [0, DECK + 0.02, 0],
          rotation: EXTRUDE_FLAT,
          tone: "steel",
        },
      ],
    },
    {
      id: "oil-pan",
      label: "Oil pan (sump)",
      removalOrder: 7,
      explodeOffset: [0, -2.8, 0],
      labelAt: [-1.5, -0.4, 0.78],
      description:
        "A tray bolted under the block that holds the engine oil. The drain plug is at its lowest point.",
      shapes: [
        box([4.2, 0.8, 1.5], [0, -0.6, 0], "dark", 0.1),
        rod([1.2, -0.9, 0.74], [1.2, -0.9, 0.82], 0.07, "steel"),
      ],
    },
    {
      id: "pistons",
      label: "Pistons and connecting rods",
      removalOrder: 8,
      explodeOffset: [0, 1.6, 0],
      labelAt: [1.5, 2.6, 0],
      description:
        "Each piston is pushed down by the burning fuel, and its connecting rod turns that push into rotation of the crankshaft. They come out through the top of the block once the rod is unbolted from below.",
      shapes: CYLINDERS.flatMap(pistonAndRod),
    },
    {
      id: "flywheel",
      label: "Flywheel",
      removalOrder: 9,
      explodeOffset: [1.5, 0, 0],
      labelAt: [2.3, 1.1, 0],
      description:
        "A heavy disc on the end of the crankshaft that keeps the engine turning smoothly. The clutch bolts to it, and the starter motor turns its toothed rim.",
      shapes: [
        {
          kind: "lathe",
          profile: [
            [0, 0],
            [1.0, 0],
            [1.0, 0.03],
            [1.08, 0.03],
            [1.08, 0.13],
            [1.0, 0.13],
            [1.0, 0.16],
            [0, 0.16],
          ],
          position: [2.2, 0, 0],
          rotation: ALONG_X,
          tone: "steel",
        },
      ],
    },
    {
      id: "crankshaft",
      label: "Crankshaft",
      removalOrder: 10,
      explodeOffset: [0, -1.3, 0],
      labelAt: [0.5, 0.3, 0.8],
      description:
        "Turns the up-and-down movement of the pistons into rotation. It is held in the bottom of the block by bearing caps.",
      shapes: [
        alongCrank(TIMING_X - 0.1, 2.2, 0, 0, 0.14),
        alongCrank(TIMING_X - 0.07, TIMING_X + 0.07, 0, 0, 0.27),
        ...CYLINDERS.flatMap(crankThrow),
      ],
    },
    {
      id: "block",
      label: "Engine block",
      partId: "engine-block",
      removalOrder: 11,
      explodeOffset: [0, 0, 0],
      labelAt: [1.8, 1.9, 0.78],
      description:
        "The core that everything else bolts to. The four round holes are the cylinders that the pistons move in.",
      shapes: [
        // Upper part with the four bores.
        {
          kind: "extrude",
          outline: blockOutline,
          holes: bores,
          depth: 1.8,
          bevel: 0.02,
          position: [0, DECK - 0.9, 0],
          rotation: EXTRUDE_FLAT,
          tone: "cast-iron",
        },
        // Lower part, hollow, around the crankshaft.
        {
          kind: "extrude",
          outline: blockOutline,
          holes: [roundedRect(0, 0, 3.9, 1.2, 0.08)],
          depth: 1.0,
          bevel: 0.02,
          position: [0, 0.3, 0],
          rotation: EXTRUDE_FLAT,
          tone: "cast-iron",
        },
      ],
    },
  ],
};
