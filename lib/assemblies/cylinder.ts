import { box, circle, EXTRUDE_ALONG_X, EXTRUDE_FLAT, rod, sector, wrapOutline } from "./geometry";
import type { Assembly, Shape, Vec2 } from "./types";

/**
 * One cylinder of a petrol engine, cut away so the inside shows. The
 * crankshaft runs along X below the cylinder; the front half of the cylinder
 * wall and of the head is left out.
 *
 * Positions and order matter more than looks: the piston (with its rings)
 * slides in the cylinder, a pin joins it to the connecting rod, the rod's
 * lower end is clamped around the crankshaft by a cap, and the head with its
 * two valves and the spark plug closes the cylinder from above.
 */

export const BORE = 1;
/** Top of the cylinder. The head sits on it. */
export const DECK = 4.2;
export const PISTON_RADIUS = 0.97;

const CRANK_Y = -0.6;
const THROW = 0.8;
/** The piston is shown at the top of its stroke. */
const CRANKPIN_Y = CRANK_Y + THROW;
const PIN_Y = CRANKPIN_Y + 3.2;
const HEAD_TOP = DECK + 1.2;
const VALVE_X = 0.5;
/** Valves and spark plug sit just in front of the cut face of the head. */
const CUT_Z = 0.12;

const ringGrooves = [0.5, 0.3, 0.1];

const pistonProfile: Vec2[] = [
  [0, 0.7],
  [PISTON_RADIUS, 0.7],
  ...ringGrooves.flatMap((y): Vec2[] => [
    [PISTON_RADIUS, y + 0.1],
    [0.88, y + 0.1],
    [0.88, y],
    [PISTON_RADIUS, y],
  ]),
  [PISTON_RADIUS, -0.6],
  [0, -0.6],
];

const ring = (y: number): Shape => ({
  kind: "lathe",
  profile: [
    [0.89, 0.01],
    [BORE, 0.01],
    [BORE, 0.09],
    [0.89, 0.09],
    [0.89, 0.01],
  ],
  position: [0, PIN_Y + y, 0],
  tone: "dark",
});

/** Half of the ring that clamps around the crankpin: the rod's half (top) or the cap (bottom). */
const bigEnd = (from: number, to: number): Shape => ({
  kind: "extrude",
  outline: sector(0.3, 0.52, from, to, 16),
  depth: 0.5,
  position: [0, CRANKPIN_Y, 0],
  rotation: EXTRUDE_ALONG_X,
  tone: "steel",
});

const valve = (x: number): Shape[] => [
  // Head of the valve, sealing against the roof of the cylinder, and its stem.
  {
    kind: "lathe",
    profile: [
      [0, 0],
      [0.36, 0],
      [0.36, 0.05],
      [0.08, 0.3],
      [0, 0.3],
    ],
    position: [x, DECK + 0.02, CUT_Z],
    tone: "steel",
  },
  rod([x, DECK + 0.3, CUT_Z], [x, HEAD_TOP + 0.85, CUT_Z], 0.07, "steel"),
  // Spring that pulls the valve shut, with the retainer on top.
  {
    kind: "coil",
    radius: 0.2,
    wire: 0.04,
    turns: 5,
    height: 0.62,
    position: [x, HEAD_TOP + 0.36, CUT_Z],
    tone: "steel",
  },
  rod([x, HEAD_TOP + 0.7, CUT_Z], [x, HEAD_TOP + 0.76, CUT_Z], 0.25, "dark"),
];

/** Crank web: joins the main shaft to the offset crankpin, with a counterweight opposite it. */
const crankWeb = (x: number): Shape => ({
  kind: "extrude",
  outline: wrapOutline([0, CRANK_Y - 0.45], 0.95, [0, CRANKPIN_Y], 0.45),
  depth: 0.3,
  position: [x, 0, 0],
  rotation: EXTRUDE_ALONG_X,
  tone: "steel",
});

export const cylinder: Assembly = {
  id: "cylinder",
  title: "One cylinder",
  note: "Schematic: simplified shapes, not to scale. The front of the cylinder and head is cut away to show the inside, and the camshaft that opens the valves is left out.",
  orientation: "The crankshaft runs left to right under the cylinder.",
  camera: [0.35, 0.25, 0.9],
  pieces: [
    {
      id: "spark-plug",
      label: "Spark plug",
      partId: "spark-plug",
      removalOrder: 1,
      explodeOffset: [0, 5.0, 0],
      labelAt: [0.4, DECK + 1.3, CUT_Z],
      description:
        "Screws into the head with its tip in the top of the cylinder. Its spark lights the mix of fuel and air.",
      shapes: [
        rod([0, DECK + 0.05, CUT_Z], [0, DECK + 0.2, CUT_Z], 0.03, "steel"),
        rod([0, DECK + 0.15, CUT_Z], [0, DECK + 0.9, CUT_Z], 0.12, "steel"),
        rod([0, DECK + 0.9, CUT_Z], [0, DECK + 1.15, CUT_Z], 0.18, "steel"),
        rod([0, DECK + 1.15, CUT_Z], [0, DECK + 2.2, CUT_Z], 0.1, "lamp"),
        rod([0, DECK + 2.2, CUT_Z], [0, DECK + 2.4, CUT_Z], 0.05, "steel"),
      ],
    },
    {
      id: "head",
      label: "Cylinder head",
      removalOrder: 2,
      explodeOffset: [0, 2.6, 0],
      labelAt: [1.3, HEAD_TOP, -0.2],
      description:
        "Closes the top of the cylinder. Only the back half is drawn, so the valves and spark plug show.",
      shapes: [
        box([2.6, HEAD_TOP - DECK, 1.3], [0, (HEAD_TOP + DECK) / 2, -0.65], "aluminium", 0.03),
      ],
    },
    {
      id: "valves",
      label: "Valves and springs",
      removalOrder: 3,
      explodeOffset: [0, 3.9, 0],
      labelAt: [-0.9, HEAD_TOP + 0.8, CUT_Z],
      description:
        "One valve lets fuel and air in, the other lets burnt gas out. A spring holds each one shut until the camshaft pushes it open.",
      shapes: [...valve(-VALVE_X), ...valve(VALVE_X)],
    },
    {
      id: "rod-cap",
      label: "Connecting rod cap",
      removalOrder: 4,
      explodeOffset: [0, -0.9, 1.4],
      labelAt: [-0.7, CRANKPIN_Y - 0.5, 0.4],
      description:
        "The lower half of the ring around the crankshaft. Two bolts hold it to the rod; undoing them frees the rod.",
      shapes: [
        bigEnd(180, 360),
        rod([0, CRANKPIN_Y - 0.5, 0.41], [0, CRANKPIN_Y + 0.05, 0.41], 0.06, "dark"),
        rod([0, CRANKPIN_Y - 0.5, -0.41], [0, CRANKPIN_Y + 0.05, -0.41], 0.06, "dark"),
      ],
    },
    {
      id: "piston",
      label: "Piston",
      removalOrder: 5,
      explodeOffset: [0, 1.7, 0],
      labelAt: [-1.0, PIN_Y + 0.75, 0],
      description:
        "Slides up and down in the cylinder. The burning fuel pushes it down, and that push is what drives the car.",
      shapes: [
        { kind: "lathe", profile: pistonProfile, position: [0, PIN_Y, 0], tone: "aluminium" },
      ],
    },
    {
      id: "connecting-rod",
      label: "Connecting rod",
      removalOrder: 5,
      explodeOffset: [0, 0.7, 0],
      labelAt: [0.6, 2.0, 0.2],
      description:
        "Joins the piston to the crankshaft. It comes out through the top of the cylinder together with the piston.",
      shapes: [
        bigEnd(0, 180),
        box(
          [0.3, PIN_Y - CRANKPIN_Y - 0.7, 0.24],
          [0, (PIN_Y + CRANKPIN_Y) / 2 + 0.1, 0],
          "steel",
          0.05,
        ),
        {
          kind: "extrude",
          outline: circle(0, 0, 0.3, 32),
          holes: [circle(0, 0, 0.16, 24)],
          depth: 0.36,
          position: [0, PIN_Y, 0],
          rotation: EXTRUDE_ALONG_X,
          tone: "steel",
        },
      ],
    },
    {
      id: "rings",
      label: "Piston rings",
      removalOrder: 6,
      explodeOffset: [-2.4, 1.7, 0],
      labelAt: [1.1, PIN_Y + 0.5, 0],
      description:
        "Springy rings in grooves around the piston. They seal the gap to the cylinder wall and scrape oil off it.",
      shapes: ringGrooves.map(ring),
    },
    {
      id: "piston-pin",
      label: "Piston pin",
      removalOrder: 7,
      explodeOffset: [0, 1.7, 1.8],
      labelAt: [-0.9, PIN_Y + 0.1, 0.3],
      description:
        "A short steel pin through the piston and the top of the rod. It lets the rod swing as the crankshaft turns.",
      shapes: [rod([-0.8, PIN_Y, 0], [0.8, PIN_Y, 0], 0.16, "steel")],
    },
    {
      id: "crankshaft",
      label: "Crankshaft",
      removalOrder: 8,
      explodeOffset: [0, -1.5, 0],
      labelAt: [1.7, CRANK_Y + 0.4, 0],
      description:
        "The offset pin in the middle is where the rod pushes. Because it is off-centre, the push makes the shaft turn. Only the piece under this cylinder is drawn.",
      shapes: [
        rod([-1.7, CRANK_Y, 0], [-0.7, CRANK_Y, 0], 0.35, "steel"),
        rod([0.7, CRANK_Y, 0], [1.7, CRANK_Y, 0], 0.35, "steel"),
        rod([-0.45, CRANKPIN_Y, 0], [0.45, CRANKPIN_Y, 0], 0.3, "steel"),
        crankWeb(-0.55),
        crankWeb(0.55),
      ],
    },
    {
      id: "cylinder-wall",
      label: "Cylinder",
      removalOrder: 9,
      explodeOffset: [0, 0, 0],
      labelAt: [1.25, 2.2, -0.3],
      description:
        "A smooth round bore in the engine block. Only the back half is drawn, so the piston shows.",
      shapes: [
        {
          kind: "extrude",
          outline: sector(BORE, 1.22, 180, 360, 32),
          depth: DECK - 1.2,
          position: [0, (DECK + 1.2) / 2, 0],
          rotation: EXTRUDE_FLAT,
          tone: "cast-iron",
        },
      ],
    },
  ],
};
