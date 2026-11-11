import { describe, expect, it } from "vitest";
import { bodyPanel, CAR, CUTS, lowerEdge, ROWS, section } from "@/lib/assemblies/car-body";
import {
  ALONG_X,
  ALONG_Z,
  fitDistance,
  labelAnchor,
  modelBounds,
  pieceBounds,
  pieceOffset,
  rod,
  rotate,
  shapeBounds,
  smoothCurve,
} from "@/lib/assemblies/geometry";
import type { ModelPiece, Vec3 } from "@/lib/assemblies/types";
import { wholeCar } from "@/lib/assemblies/whole-car";
import { getParts, getSystems } from "@/lib/content";

const close = (a: Vec3, b: Vec3) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!));

describe("model geometry helpers", () => {
  it("turns the Y axis along X and along Z", () => {
    close(rotate([0, 1, 0], ALONG_X), [1, 0, 0]);
    close(rotate([0, 1, 0], ALONG_Z), [0, 0, 1]);
  });

  it("measures a rod between two points", () => {
    const b = shapeBounds(rod([1, 2, 3], [1, 2, 5], 0.1, "steel"));
    close(b.min, [0.9, 1.9, 3]);
    close(b.max, [1.1, 2.1, 5]);
  });

  const piece: ModelPiece = {
    id: "p",
    label: "P",
    description: "",
    mirror: true,
    explodeOffset: [1, 2, 3],
    shapes: [{ kind: "box", size: [2, 2, 2], position: [0, 1, 5], tone: "steel" }],
  };

  it("includes the mirror twin in a piece's bounds, and moves it the other way", () => {
    expect(pieceBounds(piece, "own").min[2]).toBe(4);
    expect(pieceBounds(piece, "twin").min[2]).toBe(-6);
    expect(pieceBounds(piece).max[2]).toBe(6);
    expect(pieceOffset(piece, 0.5)).toEqual([0.5, 1, 1.5]);
    expect(pieceOffset(piece, 0.5, true)).toEqual([0.5, 1, -1.5]);
    expect(modelBounds([piece], 1).max[2]).toBe(9);
    expect(modelBounds([piece], 1).min[2]).toBe(-9);
  });

  it("puts a label just above a piece unless told otherwise", () => {
    expect(labelAnchor(piece)).toEqual([0, 2, 5]);
    expect(labelAnchor({ ...piece, labelAt: [1, 1, 1] })).toEqual([1, 1, 1]);
  });

  it("finds the camera distance that fits a box in view", () => {
    const cube = { min: [-1, -1, -1] as Vec3, max: [1, 1, 1] as Vec3 };
    // 90 degree square view: the near face is 1 from the centre and half a face is 1 high.
    expect(fitDistance(cube, [0, 0, 1], 90, 1)).toBeCloseTo(2);
    // A view half as wide needs more distance.
    expect(fitDistance(cube, [0, 0, 1], 90, 0.5)).toBeCloseTo(3);
  });

  it("draws a smooth curve through its points without overshooting", () => {
    const f = smoothCurve([
      [0, 0],
      [1, 1],
      [2, 1],
      [3, 4],
    ]);
    expect(f(1)).toBeCloseTo(1);
    expect(f(3)).toBeCloseTo(4);
    expect(f(-5)).toBe(0);
    for (let x = 1; x <= 2; x += 0.1) expect(f(x)).toBeCloseTo(1);
    for (let x = 0; x < 2.9; x += 0.1) expect(f(x + 0.1)).toBeGreaterThanOrEqual(f(x) - 1e-9);
  });
});

describe("car body", () => {
  it("gives every cross-section one point per row, ending on the centre line", () => {
    for (const x of [CAR.front, CUTS.cowl, 0, CUTS.deck, CAR.rear]) {
      const points = section(x);
      expect(points).toHaveLength(ROWS.centre + 1);
      expect(points[ROWS.centre]![1]).toBeCloseTo(0);
      for (const [, z] of points) expect(z).toBeLessThanOrEqual(CAR.halfWidth + 0.03);
    }
  });

  it("opens the wheel arches around both axles", () => {
    expect(lowerEdge(CAR.frontAxle)).toBeCloseTo(CAR.wheelRadius + CAR.archRadius);
    expect(lowerEdge(CAR.rearAxle)).toBeCloseTo(CAR.wheelRadius + CAR.archRadius);
    expect(lowerEdge(0)).toBeLessThan(CAR.wheelRadius);
  });

  it("cuts panels on one side or on both", () => {
    const x: [number, number] = [CUTS.frontDoor, CUTS.midDoor];
    const rows: [number, number] = [ROWS.sill, ROWS.shoulder];
    const left = bodyPanel([{ x, rows, sides: "left" }]);
    const both = bodyPanel([{ x, rows, sides: "both" }]);
    expect(both.indices).toHaveLength(left.indices.length * 2);
    const zs = left.positions.filter((_, i) => i % 3 === 2);
    expect(Math.min(...zs)).toBeGreaterThan(0);
    expect(() => bodyPanel([{ x: [0.123, 0.2], rows, sides: "left" }])).toThrow(/station/);
  });
});

describe("whole car model", () => {
  const parts = getParts();
  const { pieces } = wholeCar;
  const byId = (id: string) => pieces.find((p) => p.id === id)!;

  it("gives every piece its own id and a real system", () => {
    const ids = pieces.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const systemIds = new Set<string>(getSystems().map((s) => s.id));
    for (const p of pieces) expect(systemIds.has(p.systemId), p.id).toBe(true);
  });

  it("shows every part in the content, in the system it belongs to", () => {
    for (const part of parts) {
      const shown = pieces.filter((p) => p.partId === part.id);
      expect(shown.length, part.id).toBeGreaterThan(0);
      for (const p of shown) expect(p.systemId, p.id).toBe(part.systemId);
    }
    const partIds = new Set(parts.map((p) => p.id));
    for (const p of pieces) if (p.partId) expect(partIds.has(p.partId), p.id).toBe(true);
  });

  it("keeps everything above the ground, assembled and apart", () => {
    expect(modelBounds(pieces, 0).min[1]).toBeGreaterThanOrEqual(0);
    expect(modelBounds(pieces, 1).min[1]).toBeGreaterThanOrEqual(0);
  });

  it("keeps the mechanical parts inside the body when assembled", () => {
    for (const p of pieces.filter((p) => !p.body)) {
      const b = pieceBounds(p);
      expect(b.min[0], p.id).toBeGreaterThanOrEqual(CAR.front);
      expect(b.max[0], p.id).toBeLessThanOrEqual(CAR.rear);
      expect(b.max[2], p.id).toBeLessThanOrEqual(CAR.halfWidth);
      expect(b.min[2], p.id).toBeGreaterThanOrEqual(-CAR.halfWidth);
    }
  });

  it("stands the wheels on the ground at both axles", () => {
    const wheels = pieceBounds(byId("wheels"));
    expect(wheels.min[1]).toBeCloseTo(0);
    expect(wheels.min[0]).toBeCloseTo(CAR.frontAxle - CAR.wheelRadius);
    expect(wheels.max[0]).toBeCloseTo(CAR.rearAxle + CAR.wheelRadius);
  });

  it("lifts the body shell clear of the seats when apart", () => {
    const shell = byId("body-shell");
    const seats = byId("seats");
    const lifted = pieceBounds(shell).min[1] + shell.explodeOffset[1];
    expect(lifted).toBeGreaterThan(pieceBounds(seats).max[1] + seats.explodeOffset[1]);
  });
});
