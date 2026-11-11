/**
 * A whole car, schematic: a typical front-engined, front-wheel-drive car with
 * the engine mounted sideways. The car points towards -X, Y is up, +Z is the
 * car's left side, and the ground is at y = 0. Sizes are in metres.
 *
 * Every part in the content has a piece here. Pieces without a `partId`
 * (bodywork, seats, wheels and so on) are there to make the car complete.
 */
import { bodyPanel, CAR, CUTS, ROWS } from "./car-body";
import {
  ALONG_X,
  ALONG_Z,
  box,
  circle,
  EXTRUDE_ALONG_X,
  EXTRUDE_FLAT,
  rod,
  roundedRect,
  sector,
  shift,
} from "./geometry";
import type { CarModel, Shape, Tone, Vec2, Vec3 } from "./types";

const FRONT = CAR.frontAxle;
const REAR = CAR.rearAxle;
const AXLE_Y = CAR.wheelRadius;
const WHEEL_Z = CAR.wheelZ;
const WHEELBASE: Vec3 = [REAR - FRONT, 0, 0];

/** Where things sit across the car at a wheel, from the centre outwards. */
const STRUT_Z = 0.59;
const KNUCKLE_Z = 0.64;
const DISC_Z = 0.72;

/** The engine sits sideways: its crankshaft runs along Z at this point. */
const ENGINE_X = -1.55;
const ENGINE_Z = -0.2;
const CRANK_Y = 0.33;
const TIMING_Z = -0.515;
const EXHAUST_Y = 0.2;
const EXHAUST_Z = -0.15;

const surface = (s: { positions: number[]; indices: number[] }, tone: Tone): Shape => ({
  kind: "surface",
  ...s,
  tone,
});

/** A round part with its axis across the car, from z0 to z1. */
const acrossCar = (x: number, y: number, z0: number, z1: number, r: number, tone: Tone) =>
  rod([x, y, z0], [x, y, z1], r, tone);

/** The same shapes on the front and the rear axle. */
const bothAxles = (shapes: Shape[]) => [...shapes, ...shift(shapes, WHEELBASE)];

/** The same shapes on the left and the right, for pieces that are not mirrored as a whole. */
const bothSides = (make: (side: 1 | -1) => Shape[]) => [...make(1), ...make(-1)];

/* ---------------------------- wheel corner ---------------------------- */

const wheel: Shape[] = [
  {
    kind: "lathe",
    smooth: true,
    profile: [
      [0.2, -0.1],
      [0.27, -0.105],
      [0.305, -0.09],
      [0.32, -0.055],
      [0.32, 0.055],
      [0.305, 0.09],
      [0.27, 0.105],
      [0.2, 0.1],
    ],
    position: [FRONT, AXLE_Y, WHEEL_Z],
    rotation: ALONG_Z,
    tone: "rubber",
  },
  // Rim barrel.
  {
    kind: "lathe",
    profile: [
      [0.205, -0.1],
      [0.205, 0.1],
      [0.185, 0.1],
      [0.185, -0.1],
      [0.205, -0.1],
    ],
    position: [FRONT, AXLE_Y, WHEEL_Z],
    rotation: ALONG_Z,
    tone: "aluminium",
  },
  // Rim face with five spokes.
  {
    kind: "extrude",
    outline: circle(0, 0, 0.19, 48),
    holes: [0, 1, 2, 3, 4].map((i) => sector(0.07, 0.165, i * 72 + 12, i * 72 + 60, 8)),
    depth: 0.02,
    bevel: 0.004,
    position: [FRONT, AXLE_Y, WHEEL_Z + 0.015],
    tone: "aluminium",
  },
  acrossCar(FRONT, AXLE_Y, WHEEL_Z + 0.02, WHEEL_Z + 0.04, 0.045, "dark"),
];

const brakeDisc: Shape[] = [
  // Friction ring.
  {
    kind: "lathe",
    profile: [
      [0.075, -0.012],
      [0.15, -0.012],
      [0.15, 0.012],
      [0.075, 0.012],
      [0.075, -0.012],
    ],
    position: [FRONT, AXLE_Y, DISC_Z],
    rotation: ALONG_Z,
    tone: "cast-iron",
  },
  // The "hat" that fits over the hub flange.
  {
    kind: "lathe",
    profile: [
      [0.075, 0.012],
      [0.085, 0.012],
      [0.085, 0.045],
      [0.03, 0.045],
      [0.03, 0.035],
      [0.075, 0.035],
      [0.075, 0.012],
    ],
    position: [FRONT, AXLE_Y, DISC_Z],
    rotation: ALONG_Z,
    tone: "cast-iron",
  },
];

/** The caliper sits on the rear edge of the disc, a little above the axle line. */
const CALIPER_ANGLE = (20 * Math.PI) / 180;
const onDisc = (radius: number, z: number): Vec3 => [
  FRONT + radius * Math.cos(CALIPER_ANGLE),
  AXLE_Y + radius * Math.sin(CALIPER_ANGLE),
  z,
];

const brakeCaliper: Shape[] = [
  box([0.07, 0.11, 0.075], onDisc(0.15, DISC_Z), "accent", 0.012, [0, 0, CALIPER_ANGLE]),
];

const brakePads: Shape[] = [-1, 1].map((side) =>
  box([0.045, 0.08, 0.012], onDisc(0.125, DISC_Z + side * 0.019), "friction", 0, [
    0,
    0,
    CALIPER_ANGLE,
  ]),
);

const wheelHub: Shape[] = [
  // Bearing, flange and the nose that centres the wheel.
  {
    kind: "lathe",
    profile: [
      [0, -0.06],
      [0.045, -0.06],
      [0.045, 0.02],
      [0.065, 0.02],
      [0.065, 0.035],
      [0.028, 0.035],
      [0.028, 0.065],
      [0, 0.065],
    ],
    position: [FRONT, AXLE_Y, DISC_Z],
    rotation: ALONG_Z,
    tone: "steel",
  },
  // Steering knuckle: the upright that carries the bearing.
  box([0.06, 0.27, 0.05], [FRONT, 0.335, KNUCKLE_Z], "cast-iron", 0.015),
];

function strut(x: number, top: number): Shape[] {
  const bottom = 0.42;
  const seat = bottom + 0.13;
  return [
    rod([x, bottom, STRUT_Z], [x, bottom + 0.2, STRUT_Z], 0.028, "dark"),
    rod([x, bottom + 0.2, STRUT_Z], [x, top, STRUT_Z], 0.011, "steel"),
    rod([x, seat - 0.006, STRUT_Z], [x, seat + 0.006, STRUT_Z], 0.066, "dark"),
    {
      kind: "coil",
      radius: 0.052,
      wire: 0.011,
      turns: 5,
      height: top - seat - 0.05,
      position: [x, (top + seat) / 2 - 0.005, STRUT_Z],
      tone: "steel",
    },
    rod([x, top - 0.02, STRUT_Z], [x, top + 0.01, STRUT_Z], 0.066, "dark"),
  ];
}

const controlArm: Shape[] = [
  {
    kind: "extrude",
    outline: [
      [FRONT - 0.035, 0.66],
      [FRONT + 0.035, 0.66],
      [FRONT + 0.24, 0.36],
      [FRONT + 0.24, 0.3],
      [FRONT - 0.2, 0.3],
      [FRONT - 0.2, 0.36],
    ],
    holes: [
      [
        [FRONT, 0.56],
        [FRONT + 0.14, 0.36],
        [FRONT - 0.12, 0.36],
      ],
    ],
    depth: 0.03,
    bevel: 0.006,
    position: [0, 0.2, 0],
    rotation: EXTRUDE_FLAT,
    tone: "dark",
  },
  // Ball joint at the wheel end, rubber bushes at the body end.
  { kind: "sphere", radius: 0.028, position: [FRONT, 0.215, KNUCKLE_Z], tone: "steel" },
  rod([FRONT + 0.19, 0.2, 0.31], [FRONT + 0.25, 0.2, 0.31], 0.03, "rubber"),
  rod([FRONT - 0.21, 0.2, 0.31], [FRONT - 0.15, 0.2, 0.31], 0.03, "rubber"),
];

/* ------------------------------ drivetrain ------------------------------ */

const BOOT: Vec2[] = [
  [0.04, 0],
  [0.034, 0.012],
  [0.038, 0.02],
  [0.028, 0.032],
  [0.032, 0.04],
  [0.02, 0.052],
  [0.016, 0.06],
];

/** One driveshaft from the gearbox (inner end) to a wheel hub (outer end). */
function driveshaft(zInner: number, zOuter: number): Shape[] {
  const s = Math.sign(zOuter - zInner);
  const outward: Vec3 = [(s * Math.PI) / 2, 0, 0];
  const inward: Vec3 = [(-s * Math.PI) / 2, 0, 0];
  const boot = (z: number, rotation: Vec3): Shape => ({
    kind: "lathe",
    profile: BOOT,
    position: [FRONT, AXLE_Y, z],
    rotation,
    tone: "rubber",
  });
  return [
    acrossCar(FRONT, AXLE_Y, zInner, zOuter, 0.013, "steel"),
    acrossCar(FRONT, AXLE_Y, zInner, zInner + s * 0.07, 0.04, "steel"),
    boot(zInner + s * 0.07, outward),
    acrossCar(FRONT, AXLE_Y, zOuter - s * 0.05, zOuter, 0.042, "steel"),
    boot(zOuter - s * 0.05, inward),
  ];
}

/* -------------------------------- engine -------------------------------- */

const engine: Shape[] = [
  box([0.34, 0.07, 0.5], [ENGINE_X, 0.225, ENGINE_Z], "dark", 0.02),
  box([0.42, 0.3, 0.6], [ENGINE_X, 0.41, ENGINE_Z], "cast-iron", 0.015),
  box([0.38, 0.12, 0.6], [ENGINE_X, 0.62, ENGINE_Z], "aluminium", 0.015),
  box([0.28, 0.06, 0.56], [ENGINE_X, 0.71, ENGINE_Z], "plastic", 0.025),
  // Intake manifold on the front, oil filter low down.
  box([0.1, 0.12, 0.5], [ENGINE_X - 0.24, 0.6, ENGINE_Z], "plastic", 0.04),
  rod([ENGINE_X - 0.21, 0.36, -0.3], [ENGINE_X - 0.29, 0.36, -0.3], 0.035, "dark"),
  // Crankshaft and camshaft pulleys that the timing belt runs on.
  acrossCar(ENGINE_X, CRANK_Y, TIMING_Z - 0.013, TIMING_Z + 0.013, 0.055, "steel"),
  acrossCar(ENGINE_X, 0.62, TIMING_Z - 0.013, TIMING_Z + 0.013, 0.064, "steel"),
];

const sparkPlugs: Shape[] = [-0.21, -0.07, 0.07, 0.21].flatMap((dz) => [
  rod([ENGINE_X, 0.7, ENGINE_Z + dz], [ENGINE_X, 0.765, ENGINE_Z + dz], 0.012, "lamp"),
  rod([ENGINE_X, 0.755, ENGINE_Z + dz], [ENGINE_X, 0.785, ENGINE_Z + dz], 0.02, "dark"),
]);

const fanBlades: Shape[] = [0, 1, 2, 3, 4].map((i) => ({
  kind: "extrude",
  outline: sector(0.04, 0.125, i * 72, i * 72 + 40, 6),
  depth: 0.008,
  position: [-1.945, 0.5, 0],
  rotation: EXTRUDE_ALONG_X,
  tone: "dark",
}));

/* --------------------------------- body --------------------------------- */

const { shoulder, glassTop, railTop, centre, sill } = ROWS;
const bumperRows = 5;

const seat = (z: number): Shape[] => [
  box([0.42, 0.06, 0.4], [0.08, 0.345, z], "dark"),
  box([0.5, 0.1, 0.46], [0.08, 0.425, z], "fabric", 0.04),
  box([0.1, 0.56, 0.44], [0.36, 0.74, z], "fabric", 0.04, [0, 0, -0.22]),
  box([0.08, 0.15, 0.22], [0.44, 1.09, z], "fabric", 0.03, [0, 0, -0.22]),
];

/** The steering wheel leans back towards the driver, who sits on the left. */
const WHEEL_TILT: Vec3 = [0, 0, (-70 * Math.PI) / 180];
const STEERING_WHEEL: Vec3 = [-0.42, 0.9, 0.38];

export const wholeCar: CarModel = {
  note: "Schematic: simplified shapes of a typical front-engined, front-wheel-drive car. Real cars differ in layout and in detail.",
  camera: [-0.72, 0.42, 0.9],
  pieces: [
    /* ------------------------------ bodywork ------------------------------ */
    {
      id: "bonnet",
      label: "Bonnet (hood)",
      systemId: "body-chassis",
      body: true,
      explodeOffset: [-0.6, 2.9, 0],
      description:
        "The hinged panel over the engine bay. It opens for checks and for most engine work.",
      shapes: [
        surface(
          bodyPanel([{ x: [CUTS.nose, CUTS.cowl], rows: [shoulder, centre], sides: "both" }]),
          "paint",
        ),
      ],
    },
    {
      id: "front-bumper",
      label: "Front bumper cover",
      systemId: "body-chassis",
      body: true,
      explodeOffset: [-1.5, 0.5, 0],
      description:
        "The plastic cover on the nose of the car. It holds the grille and lamps and hides the bumper beam.",
      shapes: [
        surface(
          bodyPanel(
            [
              { x: [CAR.front, CUTS.nose], rows: [sill, centre], sides: "both" },
              { x: [CUTS.nose, CUTS.frontArch], rows: [sill, bumperRows], sides: "both" },
            ],
            "front",
          ),
          "paint",
        ),
        box([0.03, 0.1, 0.6], [CAR.front - 0.005, 0.44, 0], "dark", 0.012),
        ...bothSides((side) => [
          box([0.12, 0.09, 0.3], [-2.09, 0.59, side * 0.44], "lamp", 0.04, [0, side * 0.75, 0]),
        ]),
      ],
    },
    {
      id: "rear-bumper",
      label: "Rear bumper cover",
      systemId: "body-chassis",
      body: true,
      explodeOffset: [1.5, 0.5, 0],
      description: "The plastic cover on the tail of the car. It hides the rear bumper beam.",
      shapes: [
        surface(
          bodyPanel(
            [
              { x: [CUTS.tail, CAR.rear], rows: [sill, centre], sides: "both" },
              { x: [CUTS.rearArch, CUTS.tail], rows: [sill, bumperRows - 1], sides: "both" },
            ],
            "rear",
          ),
          "paint",
        ),
        ...bothSides((side) => [
          box([0.06, 0.1, 0.3], [2.1, 0.8, side * 0.48], "accent", 0.025, [0, side * -0.5, 0]),
        ]),
      ],
    },
    {
      id: "boot-lid",
      label: "Boot lid (trunk lid)",
      systemId: "body-chassis",
      body: true,
      explodeOffset: [0.6, 2.9, 0],
      description: "The hinged panel over the luggage space at the back.",
      shapes: [
        surface(
          bodyPanel([{ x: [CUTS.deck, CUTS.tail], rows: [shoulder, centre], sides: "both" }]),
          "paint",
        ),
      ],
    },
    {
      id: "front-wing",
      label: "Front wing (fender)",
      systemId: "body-chassis",
      body: true,
      mirror: true,
      explodeOffset: [-0.5, 2.5, 0.9],
      description:
        "The panel around each front wheel. It is bolted on, so it can be replaced after a knock.",
      shapes: [
        surface(
          bodyPanel([
            { x: [CUTS.frontArch, CUTS.frontDoor], rows: [sill, shoulder], sides: "left" },
            { x: [CUTS.nose, CUTS.frontArch], rows: [bumperRows, shoulder], sides: "left" },
          ]),
          "paint",
        ),
      ],
    },
    {
      id: "front-door",
      label: "Front door",
      systemId: "body-chassis",
      body: true,
      mirror: true,
      explodeOffset: [-0.15, 2.5, 1.0],
      description: "A door shell with its window glass, door mirror and handle.",
      shapes: [
        surface(
          bodyPanel([{ x: [CUTS.frontDoor, CUTS.midDoor], rows: [sill, shoulder], sides: "left" }]),
          "paint",
        ),
        surface(
          bodyPanel([
            { x: [CUTS.frontDoor, CUTS.pillarFront], rows: [shoulder, glassTop], sides: "left" },
          ]),
          "glass",
        ),
        box([0.06, 0.09, 0.14], [-0.74, 0.93, 0.94], "paint", 0.03),
        box([0.1, 0.02, 0.025], [-0.02, 0.82, 0.905], "dark", 0.008),
      ],
    },
    {
      id: "rear-door",
      label: "Rear door",
      systemId: "body-chassis",
      body: true,
      mirror: true,
      explodeOffset: [0.15, 2.5, 1.0],
      description: "A door shell with its window glass and handle.",
      shapes: [
        surface(
          bodyPanel([{ x: [CUTS.midDoor, CUTS.rearDoor], rows: [sill, shoulder], sides: "left" }]),
          "paint",
        ),
        surface(
          bodyPanel([
            { x: [CUTS.pillarRear, CUTS.rearDoor], rows: [shoulder, glassTop], sides: "left" },
          ]),
          "glass",
        ),
        box([0.1, 0.02, 0.025], [0.78, 0.84, 0.91], "dark", 0.008),
      ],
    },
    {
      id: "windscreen",
      label: "Windscreen",
      systemId: "body-chassis",
      body: true,
      explodeOffset: [-0.55, 3.3, 0],
      description: "Laminated glass that is glued into the body, so it also adds stiffness.",
      shapes: [
        surface(
          bodyPanel([{ x: [CUTS.cowl, CUTS.roofFront], rows: [railTop, centre], sides: "both" }]),
          "glass",
        ),
      ],
    },
    {
      id: "rear-window",
      label: "Rear window",
      systemId: "body-chassis",
      body: true,
      explodeOffset: [0.55, 3.3, 0],
      description: "The rear glass, usually with thin heating wires to clear mist and frost.",
      shapes: [
        surface(
          bodyPanel([{ x: [CUTS.roofRear, CUTS.deck], rows: [railTop, centre], sides: "both" }]),
          "glass",
        ),
      ],
    },
    {
      id: "body-shell",
      label: "Body shell",
      systemId: "body-chassis",
      body: true,
      explodeOffset: [0, 2.5, 0],
      description:
        "The welded steel structure: roof, pillars, rear wings, floor and the wall behind the engine. Everything else bolts to it.",
      shapes: [
        surface(
          bodyPanel([
            // Windscreen pillars, roof rails and rear pillars in one strip.
            { x: [CUTS.cowl, CUTS.deck], rows: [glassTop, railTop], sides: "both" },
            { x: [CUTS.roofFront, CUTS.roofRear], rows: [railTop, centre], sides: "both" },
            { x: [CUTS.cowl, CUTS.frontDoor], rows: [shoulder, glassTop], sides: "both" },
            { x: [CUTS.pillarFront, CUTS.pillarRear], rows: [shoulder, glassTop], sides: "both" },
            { x: [CUTS.rearDoor, CUTS.deck], rows: [shoulder, glassTop], sides: "both" },
            { x: [CUTS.rearDoor, CUTS.rearArch], rows: [sill, shoulder], sides: "both" },
            { x: [CUTS.rearArch, CUTS.tail], rows: [bumperRows - 1, shoulder], sides: "both" },
          ]),
          "paint",
        ),
        // Floor, and the wall between the engine bay and the cabin.
        box([1.8, 0.03, 1.56], [0.03, 0.3, 0], "dark"),
        box([1.14, 0.03, 1.2], [1.5, 0.3, 0], "dark"),
        box([0.03, 0.56, 1.5], [-0.87, 0.58, 0], "dark"),
        // Shelf behind the rear seat, between the cabin and the boot.
        box([0.55, 0.03, 1.3], [1.5, 0.98, 0], "dark"),
      ],
    },

    /* ------------------------------ interior ------------------------------ */
    {
      id: "seats",
      label: "Seats",
      systemId: "body-chassis",
      explodeOffset: [0, 1.3, 0],
      description: "Two front seats and a rear bench, bolted to the floor.",
      shapes: [
        ...seat(0.38),
        ...seat(-0.38),
        box([0.46, 0.1, 1.2], [0.93, 0.425, 0], "fabric", 0.04),
        box([0.1, 0.56, 1.2], [1.2, 0.74, 0], "fabric", 0.04, [0, 0, -0.22]),
      ],
    },
    {
      id: "dashboard",
      label: "Dashboard",
      systemId: "body-chassis",
      explodeOffset: [0, 1.7, 0],
      description: "Holds the instruments, vents and switches. Much of the wiring runs behind it.",
      shapes: [
        box([0.26, 0.2, 1.46], [-0.68, 0.8, 0], "plastic", 0.06),
        box([0.1, 0.08, 0.3], [-0.6, 0.92, 0.38], "plastic", 0.03),
      ],
    },
    {
      id: "steering-wheel",
      label: "Steering wheel and column",
      systemId: "suspension-steering",
      explodeOffset: [0.25, 1.7, 0],
      description: "The column carries your turning of the wheel down to the steering rack.",
      shapes: [
        {
          kind: "torus",
          radius: 0.17,
          tube: 0.016,
          position: STEERING_WHEEL,
          rotation: WHEEL_TILT,
          tone: "dark",
        },
        box([0.03, 0.012, 0.32], STEERING_WHEEL, "dark", 0, WHEEL_TILT),
        box([0.16, 0.012, 0.03], [-0.393, 0.825, 0.38], "dark", 0, WHEEL_TILT),
        rod(STEERING_WHEEL, [-0.86, 0.74, 0.36], 0.02, "plastic"),
        rod([-0.86, 0.74, 0.36], [-0.95, 0.42, 0.32], 0.01, "steel"),
      ],
    },
    {
      id: "airbag-module",
      label: "Airbag module",
      partId: "airbag-module",
      systemId: "body-chassis",
      explodeOffset: [0.6, 1.85, 0],
      description: "The driver's airbag sits in the centre of the steering wheel.",
      shapes: [
        {
          kind: "cylinder",
          args: [0.065, 0.065, 0.04],
          position: [-0.406, 0.905, 0.38],
          rotation: WHEEL_TILT,
          tone: "plastic",
        },
      ],
    },

    /* ------------------------------- chassis ------------------------------- */
    {
      id: "subframe",
      label: "Subframe",
      partId: "subframe",
      systemId: "body-chassis",
      explodeOffset: [0, 0.3, 0],
      description: "Bolted under the front of the car, below the engine.",
      shapes: [
        {
          kind: "extrude",
          outline: roundedRect(-1.38, 0, 0.9, 0.72, 0.08),
          holes: [roundedRect(-1.38, 0, 0.76, 0.58, 0.05)],
          depth: 0.05,
          bevel: 0.008,
          position: [0, 0.15, 0],
          rotation: EXTRUDE_FLAT,
          tone: "dark",
        },
      ],
    },
    {
      id: "front-bumper-beam",
      label: "Front bumper beam",
      partId: "bumper-beam",
      systemId: "body-chassis",
      explodeOffset: [-0.9, 0.5, 0],
      description: "Behind the front bumper cover, in front of the radiator.",
      shapes: [
        box([0.05, 0.09, 1.1], [-2.07, 0.46, 0], "steel", 0.01),
        ...bothSides((side) => [box([0.1, 0.07, 0.07], [-2.0, 0.46, side * 0.45], "steel", 0.01)]),
      ],
    },
    {
      id: "rear-bumper-beam",
      label: "Rear bumper beam",
      partId: "bumper-beam",
      systemId: "body-chassis",
      explodeOffset: [0.9, 0.5, 0],
      description: "Behind the rear bumper cover.",
      shapes: [
        box([0.05, 0.09, 1.1], [2.07, 0.5, 0], "steel", 0.01),
        ...bothSides((side) => [box([0.1, 0.07, 0.07], [2.0, 0.5, side * 0.45], "steel", 0.01)]),
      ],
    },

    /* -------------------------------- engine -------------------------------- */
    {
      id: "engine-block",
      label: "Engine block",
      partId: "engine-block",
      systemId: "engine",
      explodeOffset: [0, 1.0, 0],
      description:
        "Sits sideways in the engine bay. Shown with the cylinder head and cover on top and the oil pan underneath.",
      shapes: engine,
    },
    {
      id: "spark-plugs",
      label: "Spark plugs",
      partId: "spark-plug",
      systemId: "engine",
      explodeOffset: [0, 1.5, 0],
      description: "One per cylinder, screwed into the top of the engine.",
      shapes: sparkPlugs,
    },
    {
      id: "timing-belt",
      label: "Timing belt",
      partId: "timing-belt",
      systemId: "engine",
      explodeOffset: [0, 1.0, -0.3],
      description:
        "Runs over pulleys on one end of the engine. On a real car it is hidden behind a cover.",
      shapes: [
        {
          kind: "extrude",
          outline: roundedRect(ENGINE_X, 0.475, 0.16, 0.46, 0.08),
          holes: [roundedRect(ENGINE_X, 0.475, 0.135, 0.435, 0.0675)],
          depth: 0.022,
          position: [0, 0, TIMING_Z],
          tone: "rubber",
        },
      ],
    },

    /* -------------------------------- cooling -------------------------------- */
    {
      id: "radiator",
      label: "Radiator",
      partId: "radiator",
      systemId: "cooling",
      explodeOffset: [-0.55, 0.95, 0],
      description: "At the very front, behind the grille. Shown with its fan and two hoses.",
      shapes: [
        box([0.03, 0.36, 0.64], [-1.98, 0.5, 0], "aluminium"),
        ...bothSides((side) => [
          box([0.045, 0.36, 0.05], [-1.98, 0.5, side * 0.345], "plastic", 0.01),
        ]),
        {
          kind: "lathe",
          profile: [
            [0.13, 0],
            [0.15, 0],
            [0.15, 0.03],
            [0.13, 0.03],
            [0.13, 0],
          ],
          position: [-1.96, 0.5, 0],
          rotation: ALONG_X,
          tone: "plastic",
        },
        rod([-1.955, 0.5, 0], [-1.935, 0.5, 0], 0.04, "dark"),
        ...fanBlades,
        // Top hose to the thermostat, bottom hose to the water pump.
        rod([-1.95, 0.63, 0.25], [-1.62, 0.66, 0.2], 0.018, "rubber"),
        rod([-1.95, 0.36, -0.28], [-1.76, 0.5, -0.46], 0.018, "rubber"),
      ],
    },
    {
      id: "water-pump",
      label: "Water pump",
      partId: "water-pump",
      systemId: "cooling",
      explodeOffset: [-0.2, 1.0, -0.55],
      description: "On the end of the engine, turned by the timing belt on many engines.",
      shapes: [
        acrossCar(-1.68, 0.47, TIMING_Z + 0.015, TIMING_Z + 0.055, 0.045, "aluminium"),
        acrossCar(-1.68, 0.47, TIMING_Z - 0.013, TIMING_Z + 0.015, 0.035, "steel"),
        rod([-1.7, 0.48, TIMING_Z + 0.04], [-1.76, 0.5, -0.46], 0.02, "aluminium"),
      ],
    },
    {
      id: "thermostat",
      label: "Thermostat",
      partId: "thermostat",
      systemId: "cooling",
      explodeOffset: [0, 1.5, 0.3],
      description: "In a small housing where the top hose leaves the engine.",
      shapes: [
        { kind: "sphere", radius: 0.04, position: [-1.5, 0.62, 0.13], tone: "aluminium" },
        acrossCar(-1.5, 0.62, 0.1, 0.115, 0.05, "aluminium"),
        rod([-1.5, 0.63, 0.14], [-1.62, 0.66, 0.2], 0.02, "aluminium"),
      ],
    },

    /* ------------------------------- electrical ------------------------------- */
    {
      id: "battery",
      label: "12-volt battery",
      partId: "battery",
      systemId: "electrical",
      explodeOffset: [0.15, 1.45, 0.45],
      description: "In a corner of the engine bay on most cars.",
      shapes: [
        box([0.24, 0.17, 0.17], [-1.05, 0.6, 0.48], "plastic", 0.015),
        box([0.24, 0.02, 0.17], [-1.05, 0.69, 0.48], "dark", 0.008),
        rod([-1.12, 0.69, 0.48], [-1.12, 0.725, 0.48], 0.013, "steel"),
        rod([-0.98, 0.69, 0.48], [-0.98, 0.725, 0.48], 0.013, "steel"),
      ],
    },
    {
      id: "alternator",
      label: "Alternator",
      partId: "alternator",
      systemId: "electrical",
      explodeOffset: [0.4, 1.35, -0.25],
      description: "Bolted to the side of the engine and turned by a belt.",
      shapes: [
        acrossCar(-1.27, 0.56, -0.475, -0.365, 0.06, "aluminium"),
        acrossCar(-1.27, 0.56, -0.51, -0.475, 0.028, "steel"),
      ],
    },
    {
      id: "starter-motor",
      label: "Starter motor",
      partId: "starter-motor",
      systemId: "electrical",
      explodeOffset: [-0.45, 0.95, 0.1],
      description: "Low down where the engine meets the gearbox, so it can turn the flywheel.",
      shapes: [
        acrossCar(-1.8, 0.36, 0.06, 0.24, 0.04, "steel"),
        acrossCar(-1.8, 0.43, 0.1, 0.22, 0.022, "dark"),
      ],
    },

    /* ------------------------------- drivetrain ------------------------------- */
    {
      id: "clutch",
      label: "Clutch",
      partId: "clutch",
      systemId: "drivetrain",
      explodeOffset: [0, 1.0, 0.25],
      description: "Between the engine and the gearbox, bolted to the flywheel.",
      shapes: [
        acrossCar(ENGINE_X, CRANK_Y, 0.1, 0.12, 0.15, "steel"),
        acrossCar(ENGINE_X, CRANK_Y, 0.12, 0.132, 0.125, "friction"),
        {
          kind: "lathe",
          profile: [
            [0.06, 0.032],
            [0.14, 0.032],
            [0.14, 0.05],
            [0.1, 0.06],
            [0.06, 0.06],
            [0.06, 0.032],
          ],
          position: [ENGINE_X, CRANK_Y, 0.1],
          rotation: ALONG_Z,
          tone: "dark",
        },
      ],
    },
    {
      id: "transmission",
      label: "Transmission (gearbox)",
      partId: "transmission",
      systemId: "drivetrain",
      explodeOffset: [0, 1.0, 0.5],
      description:
        "Bolted to the end of the engine. On a front-wheel-drive car it also holds the differential.",
      shapes: [
        // Bell housing that covers the clutch.
        {
          kind: "lathe",
          profile: [
            [0, 0],
            [0.17, 0],
            [0.17, 0.04],
            [0.13, 0.1],
            [0, 0.1],
          ],
          position: [ENGINE_X, CRANK_Y, 0.16],
          rotation: ALONG_Z,
          tone: "aluminium",
        },
        box([0.3, 0.25, 0.25], [-1.5, 0.36, 0.385], "aluminium", 0.04),
        // Differential housing, in line with the front wheels.
        acrossCar(FRONT, AXLE_Y, 0.2, 0.4, 0.09, "aluminium"),
      ],
    },
    {
      id: "cv-axles",
      label: "CV axles (driveshafts)",
      partId: "cv-axle",
      systemId: "drivetrain",
      explodeOffset: [0, 0.5, 0],
      description: "One from the gearbox to each front wheel hub.",
      shapes: [...driveshaft(0.4, 0.66), ...driveshaft(0.2, -0.66)],
    },

    /* --------------------------------- brakes --------------------------------- */
    {
      id: "brake-calipers",
      label: "Brake calipers",
      partId: "brake-caliper",
      systemId: "brakes",
      mirror: true,
      explodeOffset: [0.12, 0.72, 0.78],
      description: "One at each wheel, clamped over the edge of the disc.",
      shapes: bothAxles(brakeCaliper),
    },
    {
      id: "brake-pads",
      label: "Brake pads",
      partId: "brake-pads",
      systemId: "brakes",
      mirror: true,
      explodeOffset: [0, 0.5, 0.78],
      description: "Two in each caliper, one on each face of the disc.",
      shapes: bothAxles(brakePads),
    },
    {
      id: "brake-discs",
      label: "Brake discs",
      partId: "brake-disc",
      systemId: "brakes",
      mirror: true,
      explodeOffset: [0, 0.5, 0.55],
      description: "One behind each wheel, bolted between the wheel and the hub.",
      shapes: bothAxles(brakeDisc),
    },

    /* ------------------------- suspension and steering ------------------------- */
    {
      id: "wheels",
      label: "Wheels and tyres",
      systemId: "suspension-steering",
      mirror: true,
      explodeOffset: [0, 0.5, 1.25],
      description: "Each wheel bolts to a hub. The tyre is the only part that touches the road.",
      shapes: bothAxles(wheel),
    },
    {
      id: "wheel-hubs",
      label: "Wheel hubs and bearings",
      partId: "wheel-hub",
      systemId: "suspension-steering",
      mirror: true,
      explodeOffset: [0, 0.5, 0.3],
      description: "At the centre of each wheel, shown with the upright that carries the bearing.",
      shapes: bothAxles(wheelHub),
    },
    {
      id: "struts",
      label: "Struts",
      partId: "strut",
      systemId: "suspension-steering",
      mirror: true,
      explodeOffset: [0, 0.9, 0.6],
      description: "One above each wheel, from the hub upright up to the body.",
      shapes: [...strut(FRONT, 0.8), ...strut(REAR, 0.84)],
    },
    {
      id: "control-arms",
      label: "Control arms",
      partId: "control-arm",
      systemId: "suspension-steering",
      mirror: true,
      explodeOffset: [0, 0.35, 0.25],
      description: "Low down at each wheel, between the hub upright and the car's frame.",
      shapes: bothAxles(controlArm),
    },
    {
      id: "steering-rack",
      label: "Steering rack",
      partId: "steering-rack",
      systemId: "suspension-steering",
      explodeOffset: [0.3, 0.6, 0],
      description:
        "Across the car behind the engine. A tie rod at each end pushes and pulls a front wheel.",
      shapes: [
        acrossCar(-0.98, 0.33, -0.32, 0.32, 0.028, "aluminium"),
        rod([-0.98, 0.33, 0.3], [-0.95, 0.42, 0.32], 0.025, "aluminium"),
        ...bothSides((side) => [
          {
            kind: "lathe",
            profile: BOOT,
            position: [-0.98, 0.33, side * 0.32],
            rotation: [(side * Math.PI) / 2, 0, 0],
            tone: "rubber",
          },
          rod([-0.98, 0.33, side * 0.38], [-1.2, 0.3, side * 0.61], 0.009, "steel"),
          { kind: "sphere", radius: 0.02, position: [-1.2, 0.3, side * 0.61], tone: "steel" },
        ]),
      ],
    },

    /* ----------------------------- fuel and exhaust ----------------------------- */
    {
      id: "fuel-tank",
      label: "Fuel tank",
      systemId: "fuel-exhaust",
      explodeOffset: [0, 0.45, 0],
      description: "A plastic tank under the rear seat, ahead of the rear wheels.",
      shapes: [box([0.6, 0.16, 0.6], [0.75, 0.2, 0.23], "plastic", 0.04)],
    },
    {
      id: "fuel-pump",
      label: "Fuel pump",
      partId: "fuel-pump",
      systemId: "fuel-exhaust",
      explodeOffset: [0, 1.0, 0],
      description: "Drops into the top of the fuel tank.",
      shapes: [
        rod([0.75, 0.14, 0.23], [0.75, 0.29, 0.23], 0.045, "steel"),
        rod([0.75, 0.283, 0.23], [0.75, 0.297, 0.23], 0.065, "dark"),
      ],
    },
    {
      id: "exhaust-pipe",
      label: "Exhaust pipe",
      systemId: "fuel-exhaust",
      explodeOffset: [0, 0, 0],
      description:
        "Carries the exhaust gas from the engine, under the floor, to the back of the car.",
      shapes: [
        rod([-1.36, 0.6, ENGINE_Z], [-1.16, 0.44, ENGINE_Z], 0.022, "steel"),
        rod([-1.16, 0.44, ENGINE_Z], [-1.1, 0.215, ENGINE_Z], 0.022, "steel"),
        rod([-1.1, 0.215, ENGINE_Z], [-0.9, EXHAUST_Y, EXHAUST_Z], 0.022, "steel"),
        rod([-0.58, EXHAUST_Y, EXHAUST_Z], [1.45, EXHAUST_Y, EXHAUST_Z], 0.022, "steel"),
        rod([1.45, EXHAUST_Y, EXHAUST_Z], [1.58, 0.21, -0.3], 0.022, "steel"),
        rod([2.0, 0.21, -0.3], [2.13, 0.21, -0.3], 0.026, "steel"),
        ...(
          [
            [-1.16, 0.44, ENGINE_Z],
            [-1.1, 0.215, ENGINE_Z],
            [1.45, EXHAUST_Y, EXHAUST_Z],
          ] as Vec3[]
        ).map((position): Shape => ({ kind: "sphere", radius: 0.022, position, tone: "steel" })),
      ],
    },
    {
      id: "catalytic-converter",
      label: "Catalytic converter",
      partId: "catalytic-converter",
      systemId: "fuel-exhaust",
      explodeOffset: [0, 0, -0.4],
      description: "In the exhaust pipe, close to the engine so it heats up quickly.",
      shapes: [
        {
          kind: "lathe",
          profile: [
            [0.02, 0],
            [0.065, 0.06],
            [0.065, 0.26],
            [0.02, 0.32],
          ],
          position: [-0.9, EXHAUST_Y, EXHAUST_Z],
          rotation: ALONG_X,
          tone: "aluminium",
        },
      ],
    },
    {
      id: "muffler",
      label: "Muffler",
      partId: "muffler",
      systemId: "fuel-exhaust",
      explodeOffset: [0.35, 0, -0.4],
      description: "The last box in the exhaust, under the boot floor.",
      shapes: [
        {
          kind: "lathe",
          profile: [
            [0.02, 0],
            [0.09, 0.04],
            [0.09, 0.38],
            [0.02, 0.42],
          ],
          position: [1.58, 0.21, -0.3],
          rotation: ALONG_X,
          tone: "aluminium",
        },
      ],
    },
  ],
};
