import { describe, expect, it } from "vitest";
import { assemblies, assemblyForPart, ASSEMBLY_IDS } from "@/lib/assemblies";
import { brakeCorner, DISC_RING, FLANGE_FACE } from "@/lib/assemblies/brake-corner";
import {
  clutchGearbox,
  DIFF_Z,
  GEAR_PAIRS,
  INPUT_Z,
  OUTPUT_Z,
  PINION,
  RING_GEAR,
} from "@/lib/assemblies/clutch-gearbox";
import * as oneCylinder from "@/lib/assemblies/cylinder";
import { drivetrain, HUB_X } from "@/lib/assemblies/drivetrain";
import { BORE, CYLINDERS, DECK, engine } from "@/lib/assemblies/engine";
import { gearOutline, pieceBounds, wrapOutline } from "@/lib/assemblies/geometry";
import type { Assembly } from "@/lib/assemblies/types";
import { getParts } from "@/lib/content";
import { buildConnections, describeLocation } from "@/lib/diagram";

const piece = (id: string) => brakeCorner.pieces.find((p) => p.id === id)!;
/** Range along the axle (X) covered by a piece at rest. */
const axleRange = (id: string) => {
  const b = pieceBounds(piece(id));
  return [b.min[0], b.max[0]] as const;
};

describe("brake corner assembly", () => {
  it("lists every piece once with a removal order starting at 1", () => {
    const ids = brakeCorner.pieces.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const orders = [...new Set(brakeCorner.pieces.map((p) => p.removalOrder))].sort();
    expect(orders[0]).toBe(1);
    orders.forEach((o, i) => expect(o).toBe(i + 1));
  });

  it("removes caliper, then pads, then bracket, then disc; the hub stays", () => {
    expect(piece("caliper").removalOrder).toBeLessThan(piece("inner-pad").removalOrder);
    expect(piece("inner-pad").removalOrder).toBe(piece("outer-pad").removalOrder);
    expect(piece("outer-pad").removalOrder).toBeLessThan(piece("bracket").removalOrder);
    expect(piece("bracket").removalOrder).toBeLessThan(piece("disc").removalOrder);
    expect(piece("hub").explodeOffset).toEqual([0, 0, 0]);
  });

  it("puts a pad on each face of the disc ring, inboard pad on the hub side", () => {
    const [, innerPadOut] = axleRange("inner-pad");
    const [outerPadIn] = axleRange("outer-pad");
    expect(innerPadOut).toBeCloseTo(DISC_RING.inboard);
    expect(outerPadIn).toBeCloseTo(DISC_RING.outboard);
    expect(DISC_RING.inboard).toBeLessThan(DISC_RING.outboard);
  });

  it("sits the disc hat on the outboard face of the hub flange, over the studs", () => {
    const [discIn, discOut] = axleRange("disc");
    const [, studTips] = axleRange("hub");
    // The friction ring is inboard of the flange face; the hat is outboard of it.
    expect(discIn).toBeCloseTo(DISC_RING.inboard);
    expect(DISC_RING.outboard).toBeLessThan(FLANGE_FACE);
    expect(discOut).toBeGreaterThan(FLANGE_FACE);
    expect(studTips).toBeGreaterThan(discOut);
  });

  it("wraps the caliper over both pads", () => {
    const [caliperIn, caliperOut] = axleRange("caliper");
    expect(caliperIn).toBeLessThan(axleRange("inner-pad")[0]);
    expect(caliperOut).toBeGreaterThan(axleRange("outer-pad")[1]);
  });

  it("explodes the disc outboard along the axle and the caliper upward", () => {
    expect(piece("disc").explodeOffset[0]).toBeGreaterThan(0);
    expect(piece("caliper").explodeOffset[1]).toBeGreaterThan(piece("outer-pad").explodeOffset[1]);
  });

  it("links pieces to real parts", () => {
    const partIds = new Set(getParts().map((p) => p.id));
    for (const id of ASSEMBLY_IDS)
      for (const p of assemblies[id].pieces) if (p.partId) expect(partIds.has(p.partId)).toBe(true);
    expect(assemblyForPart("brake-pads")).toBe("brake-corner");
    expect(assemblyForPart("battery")).toBeUndefined();
  });
});

/** Box around one piece of an assembly at rest. */
const boundsOf = (assembly: Assembly, id: string) =>
  pieceBounds(assembly.pieces.find((p) => p.id === id)!);
const orderOf = (assembly: Assembly, id: string) =>
  assembly.pieces.find((p) => p.id === id)!.removalOrder;
const inOrder = (assembly: Assembly, ids: string[]) =>
  ids
    .slice(1)
    .forEach((id, i) =>
      expect(orderOf(assembly, ids[i]!), `${ids[i]} before ${id}`).toBeLessThan(
        orderOf(assembly, id),
      ),
    );

describe("every exploded view", () => {
  it.each(ASSEMBLY_IDS)("%s: unique pieces, orders from 1, and a last piece that stays", (id) => {
    const { pieces } = assemblies[id];
    const ids = pieces.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const orders = [...new Set(pieces.map((p) => p.removalOrder))].sort((a, b) => a - b);
    orders.forEach((o, i) => expect(o).toBe(i + 1));
    const last = pieces.filter((p) => p.removalOrder === orders.at(-1));
    for (const p of last) expect(p.explodeOffset, p.id).toEqual([0, 0, 0]);
    for (const p of pieces) expect(p.description.length, p.id).toBeGreaterThan(20);
  });

  it("shows the closest look at a part on its own page", () => {
    expect(assemblyForPart("engine-block")).toBe("engine");
    expect(assemblyForPart("timing-belt")).toBe("engine");
    expect(assemblyForPart("spark-plug")).toBe("cylinder");
    expect(assemblyForPart("cv-axle")).toBe("drivetrain");
    expect(assemblyForPart("clutch")).toBe("clutch-gearbox");
    expect(assemblyForPart("transmission")).toBe("clutch-gearbox");
    expect(assemblyForPart("wheel-hub")).toBe("brake-corner");
  });
});

describe("engine assembly", () => {
  it("comes apart from the top down, then from below, and the block stays", () => {
    inOrder(engine, ["spark-plugs", "valve-cover", "intake-manifold", "timing-belt"]);
    inOrder(engine, ["timing-belt", "cylinder-head", "head-gasket", "oil-pan", "pistons"]);
    inOrder(engine, ["pistons", "flywheel", "crankshaft", "block"]);
    expect(orderOf(engine, "camshaft")).toBe(orderOf(engine, "cylinder-head"));
  });

  it("stacks pan, block, gasket, head and valve cover", () => {
    const block = boundsOf(engine, "block");
    expect(block.max[1]).toBeCloseTo(DECK);
    expect(boundsOf(engine, "oil-pan").max[1]).toBeCloseTo(block.min[1]);
    expect(boundsOf(engine, "head-gasket").min[1]).toBeCloseTo(DECK);
    expect(boundsOf(engine, "cylinder-head").min[1]).toBeGreaterThan(DECK);
    expect(boundsOf(engine, "valve-cover").min[1]).toBeCloseTo(
      boundsOf(engine, "cylinder-head").max[1],
      1,
    );
  });

  it("keeps the pistons inside the bores, below the top of the block", () => {
    const pistons = boundsOf(engine, "pistons");
    expect(pistons.max[1]).toBeLessThanOrEqual(DECK);
    expect(pistons.min[0]).toBeGreaterThan(CYLINDERS[0]! - BORE);
    expect(pistons.max[0]).toBeLessThan(CYLINDERS.at(-1)! + BORE);
    expect(pistons.max[2]).toBeLessThan(BORE);
  });

  it("puts the timing belt on one end and the flywheel on the other", () => {
    const block = boundsOf(engine, "block");
    expect(boundsOf(engine, "timing-belt").max[0]).toBeLessThan(block.min[0]);
    expect(boundsOf(engine, "flywheel").min[0]).toBeGreaterThan(block.max[0]);
  });
});

describe("single cylinder assembly", () => {
  const { cylinder } = oneCylinder;

  it("frees the rod from below before the piston comes out of the top", () => {
    inOrder(cylinder, ["spark-plug", "head", "valves", "rod-cap", "piston", "rings"]);
    inOrder(cylinder, ["rings", "piston-pin", "crankshaft", "cylinder-wall"]);
    expect(orderOf(cylinder, "connecting-rod")).toBe(orderOf(cylinder, "piston"));
  });

  it("fits the piston in the cylinder with the head on top", () => {
    expect(oneCylinder.PISTON_RADIUS).toBeLessThan(oneCylinder.BORE);
    expect(boundsOf(cylinder, "piston").max[1]).toBeLessThanOrEqual(oneCylinder.DECK);
    expect(boundsOf(cylinder, "head").min[1]).toBeCloseTo(oneCylinder.DECK);
    expect(boundsOf(cylinder, "rings").max[0]).toBeCloseTo(oneCylinder.BORE);
  });

  it("clamps the rod cap under the crankpin and the rod above it", () => {
    const cap = boundsOf(cylinder, "rod-cap");
    const rod = boundsOf(cylinder, "connecting-rod");
    expect(cap.max[1]).toBeLessThan(rod.max[1]);
    expect(rod.max[1]).toBeGreaterThan(boundsOf(cylinder, "piston").min[1]);
    expect(boundsOf(cylinder, "crankshaft").min[1]).toBeLessThan(cap.min[1]);
  });
});

describe("drivetrain assembly", () => {
  it("removes axles, then gearbox, then clutch, then flywheel", () => {
    inOrder(drivetrain, ["cv-axles", "gearbox", "clutch", "flywheel", "engine"]);
  });

  it("lines up engine, flywheel, clutch and gearbox across the car", () => {
    const engineEnd = boundsOf(drivetrain, "engine").max[0];
    const flywheel = boundsOf(drivetrain, "flywheel");
    const clutch = boundsOf(drivetrain, "clutch");
    const gearbox = boundsOf(drivetrain, "gearbox");
    expect(flywheel.min[0]).toBeCloseTo(engineEnd);
    expect(clutch.min[0]).toBeGreaterThanOrEqual(flywheel.max[0] - 0.02);
    // The bell housing of the gearbox covers the clutch.
    expect(gearbox.min[0]).toBeLessThanOrEqual(clutch.min[0]);
    expect(gearbox.max[0]).toBeGreaterThan(clutch.max[0]);
    expect(gearbox.max[0]).toBeLessThan(HUB_X);
  });

  it("runs a CV axle from the gearbox into each wheel hub", () => {
    const axles = boundsOf(drivetrain, "cv-axles");
    const hubs = boundsOf(drivetrain, "hubs");
    expect(axles.max[0]).toBeGreaterThan(HUB_X);
    expect(axles.min[0]).toBeLessThan(-HUB_X);
    expect(hubs.max[0]).toBeGreaterThan(axles.max[0]);
    expect(hubs.min[0]).toBeLessThan(axles.min[0]);
  });
});

describe("clutch and gearbox assembly", () => {
  it("opens the clutch from the engine side and the gearbox from the top", () => {
    inOrder(clutchGearbox, ["release-bearing", "pressure-plate", "flywheel", "case-upper"]);
    inOrder(clutchGearbox, ["case-upper", "selector-forks", "input-shaft", "differential"]);
    expect(orderOf(clutchGearbox, "clutch-disc")).toBe(orderOf(clutchGearbox, "pressure-plate"));
    expect(orderOf(clutchGearbox, "output-shaft")).toBe(orderOf(clutchGearbox, "input-shaft"));
  });

  it("stacks flywheel, disc, pressure plate and release bearing along the input shaft", () => {
    const along = ["flywheel", "clutch-disc", "pressure-plate", "release-bearing"].map(
      (id) => boundsOf(clutchGearbox, id).min[0],
    );
    along.slice(1).forEach((x, i) => expect(x).toBeGreaterThan(along[i]!));
    // The splined end of the input shaft reaches through the clutch disc.
    expect(boundsOf(clutchGearbox, "input-shaft").min[0]).toBeLessThan(
      boundsOf(clutchGearbox, "clutch-disc").min[0],
    );
  });

  it("meshes every gear pair, and the output shaft with the differential", () => {
    const between = OUTPUT_Z - INPUT_Z;
    for (const { input } of GEAR_PAIRS) {
      expect(input).toBeGreaterThan(0);
      expect(input).toBeLessThan(between);
    }
    // Lower gears first: the input gear grows along the shaft, so its partner shrinks.
    GEAR_PAIRS.slice(1).forEach((pair, i) =>
      expect(pair.input).toBeGreaterThan(GEAR_PAIRS[i]!.input),
    );
    expect(PINION.radius + RING_GEAR.radius).toBeCloseTo(DIFF_Z - OUTPUT_Z);
  });
});

describe("belt and gear outlines", () => {
  it("wraps a belt around two wheels", () => {
    const outline = wrapOutline([0, 0], 1, [0, 5], 2);
    const xs = outline.map((p) => p[0]);
    const ys = outline.map((p) => p[1]);
    expect(Math.min(...ys)).toBeCloseTo(-1, 1);
    expect(Math.max(...ys)).toBeCloseTo(7, 1);
    expect(Math.max(...xs)).toBeCloseTo(2, 1);
    expect(Math.min(...xs)).toBeCloseTo(-2, 1);
  });

  it("gives a gear four points per tooth, around its radius", () => {
    const outline = gearOutline(1, 20);
    expect(outline).toHaveLength(80);
    for (const [x, y] of outline) expect(Math.abs(Math.hypot(x, y) - 1)).toBeLessThanOrEqual(0.1);
  });
});

describe("diagram helpers", () => {
  it("builds connections in both directions", () => {
    const map = buildConnections([
      { id: "a", connectsTo: ["b"] },
      { id: "b", connectsTo: [] },
      { id: "c", connectsTo: ["a", "ghost"] },
    ]);
    expect([...map.get("a")!].sort()).toEqual(["b", "c"]);
    expect([...map.get("b")!]).toEqual(["a"]);
    expect(map.get("c")!.has("ghost")).toBe(false);
  });

  it("describes locations in plain words", () => {
    expect(describeLocation(140, 196)).toMatch(/engine bay/);
    expect(describeLocation(230, 352)).toBe("at the front wheel");
    expect(describeLocation(896, 382)).toMatch(/rear/);
  });
});
