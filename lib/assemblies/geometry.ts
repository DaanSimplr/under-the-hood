/** Pure helpers for writing 3D models and measuring them (no three.js, safe in tests). */
import type { ModelPiece, Shape, Tone, Vec2, Vec3 } from "./types";

/** Rotations that turn the default +Y axis of a round shape along another axis. */
export const ALONG_X: Vec3 = [0, 0, -Math.PI / 2];
export const ALONG_Z: Vec3 = [Math.PI / 2, 0, 0];
/** Turns an extrusion so its depth runs along X (its outline then lies in the ZY plane). */
export const EXTRUDE_ALONG_X: Vec3 = [0, Math.PI / 2, 0];
/** Lays an extrusion flat: outline x stays x, outline y becomes z, depth runs down. */
export const EXTRUDE_FLAT: Vec3 = [Math.PI / 2, 0, 0];

export type Bounds = { min: Vec3; max: Vec3 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Rotates a point by Euler angles in three.js order: Z first, then Y, then X. */
export function rotate([x, y, z]: Vec3, [rx, ry, rz]: Vec3): Vec3 {
  const x1 = x * Math.cos(rz) - y * Math.sin(rz);
  const y1 = x * Math.sin(rz) + y * Math.cos(rz);
  const x2 = x1 * Math.cos(ry) + z * Math.sin(ry);
  const z2 = -x1 * Math.sin(ry) + z * Math.cos(ry);
  return [x2, y1 * Math.cos(rx) - z2 * Math.sin(rx), y1 * Math.sin(rx) + z2 * Math.cos(rx)];
}

function localBounds(shape: Shape): Bounds {
  switch (shape.kind) {
    case "box": {
      const [x, y, z] = shape.size;
      return { min: [-x / 2, -y / 2, -z / 2], max: [x / 2, y / 2, z / 2] };
    }
    case "cylinder": {
      const r = Math.max(shape.args[0], shape.args[1]);
      const h = shape.args[2] / 2;
      return { min: [-r, -h, -r], max: [r, h, r] };
    }
    case "lathe": {
      const r = Math.max(...shape.profile.map((p) => p[0]));
      const ys = shape.profile.map((p) => p[1]);
      return { min: [-r, Math.min(...ys), -r], max: [r, Math.max(...ys), r] };
    }
    case "extrude": {
      const xs = shape.outline.map((p) => p[0]);
      const ys = shape.outline.map((p) => p[1]);
      const d = shape.depth / 2;
      return {
        min: [Math.min(...xs), Math.min(...ys), -d],
        max: [Math.max(...xs), Math.max(...ys), d],
      };
    }
    case "torus": {
      const r = shape.radius + shape.tube;
      return { min: [-r, -shape.tube, -r], max: [r, shape.tube, r] };
    }
    case "sphere": {
      const r = shape.radius;
      return { min: [-r, -r, -r], max: [r, r, r] };
    }
    case "coil": {
      const r = shape.radius + shape.wire;
      const h = shape.height / 2 + shape.wire;
      return { min: [-r, -h, -r], max: [r, h, r] };
    }
    case "surface": {
      const b = emptyBounds();
      for (let i = 0; i < shape.positions.length; i += 3)
        grow(b, [shape.positions[i]!, shape.positions[i + 1]!, shape.positions[i + 2]!]);
      return b;
    }
  }
}

function emptyBounds(): Bounds {
  return { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
}

function grow(b: Bounds, p: Vec3) {
  for (let i = 0; i < 3; i++) {
    b.min[i] = Math.min(b.min[i]!, p[i]!);
    b.max[i] = Math.max(b.max[i]!, p[i]!);
  }
}

/** Axis-aligned box around one shape, after its rotation and position. */
export function shapeBounds(shape: Shape): Bounds {
  const { min, max } = localBounds(shape);
  const rotation = shape.rotation ?? [0, 0, 0];
  const [px, py, pz] = shape.position ?? [0, 0, 0];
  const out = emptyBounds();
  for (const x of [min[0], max[0]])
    for (const y of [min[1], max[1]])
      for (const z of [min[2], max[2]]) {
        const [rx, ry, rz] = rotate([x, y, z], rotation);
        grow(out, [rx + px, ry + py, rz + pz]);
      }
  return out;
}

/** Box around a piece at rest. `side` picks the piece itself, its mirror twin, or both. */
export function pieceBounds(piece: ModelPiece, side: "own" | "twin" | "both" = "both"): Bounds {
  const own = emptyBounds();
  for (const shape of piece.shapes) {
    const b = shapeBounds(shape);
    grow(own, b.min);
    grow(own, b.max);
  }
  if (!piece.mirror || side === "own") return own;
  const twin: Bounds = {
    min: [own.min[0], own.min[1], -own.max[2]],
    max: [own.max[0], own.max[1], -own.min[2]],
  };
  if (side === "twin") return twin;
  grow(twin, own.min);
  grow(twin, own.max);
  return twin;
}

/** How far a piece (or its mirror twin) has moved at this explode amount (0 to 1). */
export function pieceOffset(piece: ModelPiece, explode: number, twin = false): Vec3 {
  const [x, y, z] = piece.explodeOffset;
  return [x * explode, y * explode, (twin ? -z : z) * explode];
}

/** Box around the whole model at this explode amount. */
export function modelBounds(pieces: ModelPiece[], explode: number): Bounds {
  const out = emptyBounds();
  for (const piece of pieces)
    for (const twin of piece.mirror ? [false, true] : [false]) {
      const b = pieceBounds(piece, twin ? "twin" : "own");
      const o = pieceOffset(piece, explode, twin);
      grow(out, [b.min[0] + o[0], b.min[1] + o[1], b.min[2] + o[2]]);
      grow(out, [b.max[0] + o[0], b.max[1] + o[1], b.max[2] + o[2]]);
    }
  return out;
}

export function mixBounds(a: Bounds, b: Bounds, t: number): Bounds {
  const mix = (p: Vec3, q: Vec3): Vec3 => [
    lerp(p[0], q[0], t),
    lerp(p[1], q[1], t),
    lerp(p[2], q[2], t),
  ];
  return { min: mix(a.min, b.min), max: mix(a.max, b.max) };
}

export function boundsCenter(b: Bounds): Vec3 {
  return [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
}

/** Radius of the sphere around a box. */
export function boundsRadius(b: Bounds): number {
  return Math.hypot(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]) / 2;
}

/**
 * Distance from the centre of a box, along `direction`, at which a camera
 * that looks back at the centre has the whole box in view.
 */
export function fitDistance(
  bounds: Bounds,
  direction: Vec3,
  fovDegrees: number,
  aspect: number,
): number {
  const length = Math.hypot(...direction);
  const d: Vec3 = [direction[0] / length, direction[1] / length, direction[2] / length];
  // Screen axes of that camera: right is level, up is at a right angle to both.
  const level = Math.hypot(d[0], d[2]) || 1;
  const right: Vec3 = [d[2] / level, 0, -d[0] / level];
  const up: Vec3 = [
    d[1] * right[2] - d[2] * right[1],
    d[2] * right[0] - d[0] * right[2],
    d[0] * right[1] - d[1] * right[0],
  ];
  const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const tanV = Math.tan((fovDegrees * Math.PI) / 360);
  const tanH = tanV * aspect;
  const c = boundsCenter(bounds);
  let distance = 0;
  for (const x of [bounds.min[0], bounds.max[0]])
    for (const y of [bounds.min[1], bounds.max[1]])
      for (const z of [bounds.min[2], bounds.max[2]]) {
        const p: Vec3 = [x - c[0], y - c[1], z - c[2]];
        const towardsCamera = dot(p, d);
        distance = Math.max(
          distance,
          towardsCamera + Math.abs(dot(p, right)) / tanH,
          towardsCamera + Math.abs(dot(p, up)) / tanV,
        );
      }
  return distance;
}

/** Where a piece's label goes at rest: the given spot, or just above the piece. */
export function labelAnchor(piece: ModelPiece): Vec3 {
  if (piece.labelAt) return piece.labelAt;
  const b = pieceBounds(piece, "own");
  return [(b.min[0] + b.max[0]) / 2, b.max[1], (b.min[2] + b.max[2]) / 2];
}

/**
 * Smooth curve through points that never overshoots them (monotone cubic,
 * Fritsch-Carlson). Points must be sorted by x. Outside the points it stays flat.
 */
export function smoothCurve(points: Vec2[]): (x: number) => number {
  const n = points.length;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const h: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(xs[i + 1]! - xs[i]!);
    slope.push((ys[i + 1]! - ys[i]!) / h[i]!);
  }
  const m = xs.map((_, i) => {
    if (i === 0) return slope[0]!;
    if (i === n - 1) return slope[n - 2]!;
    const a = slope[i - 1]!;
    const b = slope[i]!;
    if (a * b <= 0) return 0;
    const w1 = 2 * h[i]! + h[i - 1]!;
    const w2 = h[i]! + 2 * h[i - 1]!;
    return (w1 + w2) / (w1 / a + w2 / b);
  });
  return (x) => {
    if (x <= xs[0]!) return ys[0]!;
    if (x >= xs[n - 1]!) return ys[n - 1]!;
    let i = 0;
    while (x > xs[i + 1]!) i++;
    const t = (x - xs[i]!) / h[i]!;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i]! +
      (t3 - 2 * t2 + t) * h[i]! * m[i]! +
      (-2 * t3 + 3 * t2) * ys[i + 1]! +
      (t3 - t2) * h[i]! * m[i + 1]!
    );
  };
}

/* ------------------------------------------------------------------
   Authoring helpers
   ------------------------------------------------------------------ */

export function box(size: Vec3, position: Vec3, tone: Tone, radius = 0, rotation?: Vec3): Shape {
  return { kind: "box", size, position, tone, radius, rotation };
}

/** A straight round bar between two points. */
export function rod(from: Vec3, to: Vec3, radius: number, tone: Tone): Shape {
  const d: Vec3 = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const length = Math.hypot(...d);
  return {
    kind: "cylinder",
    args: [radius, radius, length],
    position: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2],
    // Z first tips +Y towards X, then X swings it towards Z.
    rotation: [Math.atan2(d[2], d[1]), 0, -Math.asin(d[0] / length)],
    tone,
  };
}

/** Points on a circle, for outlines and holes. */
export function circle(cx: number, cy: number, r: number, segments = 32): Vec2[] {
  return Array.from({ length: segments }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as Vec2;
  });
}

/** A slice of a ring around the origin, between two angles in degrees. */
export function sector(rIn: number, rOut: number, from: number, to: number, segments = 12): Vec2[] {
  const at = (r: number, i: number): Vec2 => {
    const a = (lerp(from, to, i / segments) * Math.PI) / 180;
    return [r * Math.cos(a), r * Math.sin(a)];
  };
  const outer = Array.from({ length: segments + 1 }, (_, i) => at(rOut, i));
  const inner = Array.from({ length: segments + 1 }, (_, i) => at(rIn, segments - i));
  return [...outer, ...inner];
}

/** A rectangle with rounded corners, centred on (cx, cy). */
export function roundedRect(cx: number, cy: number, w: number, h: number, r: number): Vec2[] {
  const corners: Array<[number, number, number]> = [
    [cx + w / 2 - r, cy + h / 2 - r, 0],
    [cx - w / 2 + r, cy + h / 2 - r, 90],
    [cx - w / 2 + r, cy - h / 2 + r, 180],
    [cx + w / 2 - r, cy - h / 2 + r, 270],
  ];
  return corners.flatMap(([x, y, start]) =>
    Array.from({ length: 7 }, (_, i) => {
      const a = ((start + i * 15) * Math.PI) / 180;
      return [x + r * Math.cos(a), y + r * Math.sin(a)] as Vec2;
    }),
  );
}

/** Copies of shapes moved by an offset. */
export function shift(shapes: Shape[], [dx, dy, dz]: Vec3): Shape[] {
  return shapes.map((s) => {
    const [x, y, z] = s.position ?? [0, 0, 0];
    return { ...s, position: [x + dx, y + dy, z + dz] };
  });
}
