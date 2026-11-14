import { describe, expect, it } from "vitest";
import {
  BORE_R,
  BORES,
  buildEngineDrawing,
  DECK,
  ENGINE_PARTS,
  hull,
  PISTON_R,
  project,
} from "@/lib/engine-drawing";
import {
  EXPLODED_AT,
  guideOpacity,
  LOOP_PHASES,
  LOOP_SECONDS,
  loopProgress,
  partTravel,
} from "@/lib/engine-motion";

const drawing = buildEngineDrawing();
const part = (id: string) => drawing.parts.find((p) => p.id === id)!;
const start = (id: string) => part(id).window[0];
/** Height range of a part once fully exploded. */
const zRange = (id: string) => {
  const p = part(id);
  return [p.bounds3.min[2] + p.dir[2], p.bounds3.max[2] + p.dir[2]] as const;
};

describe("exploded engine drawing", () => {
  it("has unique part ids and sensible timing windows", () => {
    const ids = drawing.parts.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of drawing.parts) {
      expect(p.window[0]).toBeGreaterThanOrEqual(0);
      expect(p.window[1]).toBeLessThanOrEqual(1);
      expect(p.window[0]).toBeLessThan(p.window[1]);
    }
  });

  it("moves every part along one straight axis, and the block stays put", () => {
    for (const p of drawing.parts) {
      const moving = p.dir.filter((c) => c !== 0).length;
      expect(moving).toBe(p.id === "block" ? 0 : 1);
    }
  });

  it("projects with true isometric axes", () => {
    const len = (v: [number, number]) => Math.hypot(v[0], v[1]);
    const x = project([1, 0, 0]);
    const y = project([0, 1, 0]);
    const z = project([0, 0, 1]);
    expect(len(x)).toBeCloseTo(1);
    expect(len(y)).toBeCloseTo(1);
    expect(len(z)).toBeCloseTo(1);
    expect((Math.atan2(-x[1], x[0]) * 180) / Math.PI).toBeCloseTo(30); // up-right
    expect((Math.atan2(y[1], y[0]) * 180) / Math.PI).toBeCloseTo(30); // down-right
    expect(z).toEqual([0, -1]);
  });

  it("takes the top end apart in workshop order: cover, cams, head, gasket, pistons", () => {
    const order = ["valve-cover", "camshafts", "cylinder-head", "head-gasket", "pistons"];
    order.slice(1).forEach((id, i) => expect(start(order[i]!)).toBeLessThan(start(id)));
    expect(start("oil-pan")).toBeLessThan(start("crankshaft"));
    expect(start("gearbox")).toBeLessThan(start("pressure-plate"));
    expect(start("pressure-plate")).toBeLessThan(start("clutch-disc"));
    expect(start("clutch-disc")).toBeLessThan(start("flywheel"));
    expect(start("radiator")).toBeLessThan(start("cooling-fan"));
    expect(start("cooling-fan")).toBeLessThan(start("timing-belt"));
  });

  it("keeps the stacked parts apart when exploded", () => {
    const stack = ["pistons", "head-gasket", "cylinder-head", "camshafts", "valve-cover"];
    stack.slice(1).forEach((id, i) => {
      expect(zRange(stack[i]!)[1]).toBeLessThan(zRange(id)[0]);
    });
    expect(zRange("pistons")[0]).toBeGreaterThan(part("block").bounds3.max[2]);
    expect(zRange("crankshaft")[1]).toBeLessThan(part("block").bounds3.min[2] + 1);
    expect(zRange("oil-pan")[1]).toBeLessThan(zRange("crankshaft")[0]);
  });

  it("puts each piston inside its own bore, seen only through the bore opening", () => {
    expect(PISTON_R).toBeLessThan(BORE_R);
    const pistons = part("pistons");
    expect(pistons.pieces).toHaveLength(BORES.length);
    // One clipped piece per bore, painted rear (cylinder 4) to front (cylinder 1).
    expect(pistons.pieces.map((piece) => piece.clip?.id)).toEqual(
      BORES.map((_, i) => `engine-bore-${i}`).reverse(),
    );
    expect(pistons.bounds3.min[0]).toBeCloseTo(BORES[0] - PISTON_R, 1);
    expect(pistons.bounds3.max[0]).toBeCloseTo(BORES[3] + PISTON_R, 1);
    expect(Math.max(-pistons.bounds3.min[1], pistons.bounds3.max[1])).toBeLessThan(BORE_R);
    // At rest the crowns are below the deck, so only the bores show them.
    expect(pistons.bounds3.max[2]).toBeLessThanOrEqual(DECK);
  });

  it("takes every colour from the theme tokens (no raw hex values)", () => {
    const text = JSON.stringify(drawing);
    expect(text).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(text).toContain("var(--bp-ink)");
  });

  it("has a finite viewBox that contains the drawing", () => {
    const { x, y, width, height } = drawing.viewBox;
    for (const n of [x, y, width, height]) expect(Number.isFinite(n)).toBe(true);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
    // The exploded valve cover is the top of the drawing.
    const cover = part("valve-cover");
    const top = project([0, 0, cover.bounds3.max[2] + cover.dir[2]])[1];
    expect(y).toBeLessThan(top);
  });

  it("lists the parts in paint order with the block before the pistons", () => {
    const ids = ENGINE_PARTS.map((p) => p.id);
    expect(ids.indexOf("block")).toBeLessThan(ids.indexOf("pistons"));
    expect(ids.indexOf("pistons")).toBeLessThan(ids.indexOf("head-gasket"));
  });

  it("builds convex hulls", () => {
    const square = hull([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0.5, 0.5],
    ]);
    expect(square).toHaveLength(4);
  });
});

describe("exploded engine loop", () => {
  it("holds, explodes, holds, reassembles and settles", () => {
    const [hold, explode, exploded, assemble] = LOOP_PHASES;
    expect(loopProgress(0)).toBe(0);
    expect(loopProgress(hold + explode / 2)).toBeCloseTo(0.5);
    expect(loopProgress(EXPLODED_AT)).toBe(1);
    expect(loopProgress(EXPLODED_AT + exploded + assemble / 2)).toBeCloseTo(0.5);
    expect(loopProgress(LOOP_SECONDS - 0.01)).toBe(0);
    expect(loopProgress(LOOP_SECONDS + 1)).toBe(loopProgress(1));
  });

  it("moves each part only inside its window, and fully by its end", () => {
    const w: [number, number] = [0.2, 0.6];
    expect(partTravel(0.1, w)).toBe(0);
    expect(partTravel(0.4, w)).toBeCloseTo(0.5);
    expect(partTravel(0.6, w)).toBe(1);
    expect(partTravel(1, w)).toBe(1);
  });

  it("shows the guides when exploded and hides them when assembled", () => {
    expect(guideOpacity(0)).toBe(0);
    expect(guideOpacity(1)).toBe(1);
  });
});
