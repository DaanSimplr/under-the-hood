import { describe, expect, it } from "vitest";
import { assemblies, assemblyForPart, ASSEMBLY_IDS } from "@/lib/assemblies";
import { brakeCorner, DISC_RING, FLANGE_FACE } from "@/lib/assemblies/brake-corner";
import { pieceBounds } from "@/lib/assemblies/geometry";
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
