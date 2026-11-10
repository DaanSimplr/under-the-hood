import { describe, expect, it } from "vitest";
import { assemblies, assemblyForPart, ASSEMBLY_IDS } from "@/lib/assemblies";
import { brakeCorner } from "@/lib/assemblies/brake-corner";
import type { AssemblyPiece, Shape } from "@/lib/assemblies/types";
import { getParts } from "@/lib/content";
import { buildConnections, describeLocation } from "@/lib/diagram";

const piece = (id: string) => brakeCorner.pieces.find((p) => p.id === id)!;

/** X range (along the axle) covered by a piece's shapes at rest. */
function xRange(p: AssemblyPiece): [number, number] {
  const extent = (s: Shape) => {
    const half =
      s.kind === "box"
        ? s.size[0] / 2
        : s.rotation?.[2]
          ? s.args[2] / 2 // cylinder turned to lie along X: its height is the X extent
          : Math.max(s.args[0], s.args[1]);
    return [s.position[0] - half, s.position[0] + half] as const;
  };
  const all = p.shapes.map(extent);
  return [Math.min(...all.map((e) => e[0])), Math.max(...all.map((e) => e[1]))];
}

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

  it("puts a pad on each face of the disc, inboard pad on the hub side", () => {
    const [discIn, discOut] = xRange(piece("disc"));
    const [, innerPadOut] = xRange(piece("inner-pad"));
    const [outerPadIn] = xRange(piece("outer-pad"));
    // The disc's friction ring is the thin shape; the pads sit just outside it.
    expect(innerPadOut).toBeLessThanOrEqual(0.2 - 0.06 + 1e-9);
    expect(outerPadIn).toBeGreaterThanOrEqual(0.2 + 0.06 - 1e-9);
    expect(discIn).toBeLessThan(discOut);
  });

  it("has the hub flange inboard of the disc ring", () => {
    const hub = piece("hub");
    const flangeOnly = { ...hub, shapes: [hub.shapes[0]!] }; // first shape is the flange
    const [, flangeOut] = xRange(flangeOnly);
    expect(flangeOut).toBeLessThan(0.2 - 0.06);
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
