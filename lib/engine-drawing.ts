/**
 * Isometric exploded drawing of an inline-4 engine with its gearbox, built
 * from simple 3D shapes and projected to SVG paths. It is the animated
 * backdrop of the /teardowns header (see components/diagram/EngineBackdrop).
 *
 * Pure: no DOM, safe on the server, the client and in tests. Colours are
 * CSS variables (the --bp-* tokens in app/globals.css), so it follows the theme.
 *
 * World axes (drawing units, not to scale):
 *   +x  along the crankshaft, towards the gearbox   -> screen up-right
 *   +y  across the engine, towards the exhaust side  -> screen down-right
 *   +z  up                                           -> screen up
 * The eye looks along (1, -1, -1), so the visible faces are front (-x),
 * exhaust side (+y) and top (+z). Circles are sampled in 3D and projected,
 * so every ellipse has the right isometric proportions.
 */
import type { Vec2, Vec3 } from "./assemblies/types";

export type Material = "alu" | "iron" | "steel" | "dark" | "rust" | "paper";

export type DrawShape = {
  d: string;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  dash?: string;
  /** Small screen offset (used for the highlight line on pipes). */
  shift?: Vec2;
};

/** Shapes that move together. A piece with a clip keeps the clip still while the shapes move. */
export type DrawPiece = { shapes: DrawShape[]; clip?: { id: string; d: string } };

export type DrawnPart = {
  id: string;
  /** Straight line the part travels along when the engine comes apart (world units). */
  dir: Vec3;
  /** Screen offset at full explosion. */
  screenDir: Vec2;
  /** When the part moves, as a fraction (0..1) of the explode phase. */
  window: [number, number];
  pieces: DrawPiece[];
  /** World-space bounds of the part as assembled. */
  bounds3: { min: Vec3; max: Vec3 };
};

export type EngineDrawing = {
  parts: DrawnPart[];
  guides: { d: string; centre: boolean }[];
  /** Screen bounds of the fully exploded drawing. */
  viewBox: { x: number; y: number; width: number; height: number };
};

/* ---------------------------------------------------------------------------
   Projection and small vector helpers
   ------------------------------------------------------------------------- */

const SQ = Math.sqrt(3) / 2;
export const project = (p: Vec3): Vec2 => [SQ * (p[0] + p[1]), 0.5 * (p[1] - p[0]) - p[2]];
const depth = (p: Vec3) => -p[0] + p[1] + p[2];
const EYE: Vec3 = [-1, 1, 1];
const LIGHT: Vec3 = (() => {
  const v: Vec3 = [-0.45, -0.2, 1];
  const m = Math.hypot(...v);
  return [v[0] / m, v[1] / m, v[2] / m];
})();

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (a: Vec3): Vec3 => scale(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const average = (pts: Vec3[]) => scale(pts.reduce(add, [0, 0, 0]), 1 / pts.length);
const r1 = (n: number) => Math.round(n * 10) / 10;
const path = (pts: Vec2[], closed = true) =>
  "M" + pts.map((q) => `${r1(q[0])} ${r1(q[1])}`).join("L") + (closed ? "Z" : "");

/* ---------------------------------------------------------------------------
   Colours (all from tokens)
   ------------------------------------------------------------------------- */

const INK = "var(--bp-ink)";
const MATERIALS: Material[] = ["alu", "iron", "steel", "dark", "rust", "paper"];
/** Shading steps per material. Few steps keep the markup small (shared fills merge). */
export const TONE_STEPS = 12;
/**
 * A material colour between its shadow (0) and highlight (1) token. It is a
 * short variable; `toneVariables()` defines them all once on the drawing.
 */
export const tone = (m: Material, t: number) =>
  `var(--bpt-${m}-${Math.round(clamp(t, 0, 1) * TONE_STEPS)})`;
/** The `--bpt-*` variables `tone()` refers to, each mixed from the --bp-* theme tokens. */
export function toneVariables(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const m of MATERIALS) {
    for (let s = 0; s <= TONE_STEPS; s++) {
      const pct = Math.round((s / TONE_STEPS) * 100);
      vars[`--bpt-${m}-${s}`] = `color-mix(in srgb, var(--bp-${m}-lo), var(--bp-${m}-hi) ${pct}%)`;
    }
  }
  return vars;
}
const shade = (m: Material, n: Vec3) => tone(m, (dot(n, LIGHT) + 0.3) / 1.2);
const HOLE = tone("dark", 0.35);
const ACCENT = tone("rust", 0.55);
const HATCH = "url(#engine-hatch)";

/* ---------------------------------------------------------------------------
   Profiles
   ------------------------------------------------------------------------- */

const circle = (r: number, n = 36, cu = 0, cv = 0): Vec2[] =>
  Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2;
    return [cu + r * Math.cos(a), cv + r * Math.sin(a)];
  });

/** Convex hull (monotone chain). */
export function hull(pts: Vec2[]): Vec2[] {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const turn = (o: Vec2, a: Vec2, b: Vec2) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const build = (list: Vec2[]) => {
    const out: Vec2[] = [];
    for (const q of list) {
      while (out.length > 1 && turn(out[out.length - 2]!, out[out.length - 1]!, q) <= 0) out.pop();
      out.push(q);
    }
    out.pop();
    return out;
  };
  return build(p).concat(build(p.slice().reverse()));
}

const bezier = (a: Vec3, b: Vec3, c: Vec3, d: Vec3, n = 28): Vec3[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return add(
      add(scale(a, u * u * u), scale(b, 3 * u * u * t)),
      add(scale(c, 3 * u * t * t), scale(d, t * t * t)),
    );
  });

type Axis = "x" | "y" | "z";
/** Maps profile coordinates (u, v) and an offset w along the axis to world space. */
const AXIS: Record<Axis, (c: Vec3, u: number, v: number, w: number) => Vec3> = {
  x: (c, u, v, w) => [c[0] + w, c[1] + u, c[2] + v],
  y: (c, u, v, w) => [c[0] + u, c[1] + w, c[2] + v],
  z: (c, u, v, w) => [c[0] + u, c[1] + v, c[2] + w],
};
const AXIS_DIR: Record<Axis, Vec3> = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

/* ---------------------------------------------------------------------------
   Part builder. Items paint in order of (cluster, layer, depth). Solids are
   convex extrusions, so only their front-facing faces are drawn.
   ------------------------------------------------------------------------- */

type Item = {
  cluster: number;
  layer: number;
  depth: number;
  index: number;
  shapes: DrawShape[];
  clip?: { id: string; d: string };
};

type SolidOptions = {
  axis: Axis;
  c: Vec3;
  len: number;
  p0: Vec2[];
  p1?: Vec2[];
  mat: Material;
  smooth?: boolean;
  hatch?: boolean;
  w?: number;
};

class Part {
  items: Item[] = [];
  layer = 0;
  min: Vec3 = [Infinity, Infinity, Infinity];
  max: Vec3 = [-Infinity, -Infinity, -Infinity];

  private track(pts: Vec3[]) {
    for (const p of pts) {
      for (let k = 0; k < 3; k++) {
        this.min[k] = Math.min(this.min[k]!, p[k]!);
        this.max[k] = Math.max(this.max[k]!, p[k]!);
      }
    }
  }

  put(d: number, shapes: DrawShape[], clip?: Item["clip"], cluster = 0) {
    this.items.push({
      cluster,
      layer: this.layer,
      depth: d,
      index: this.items.length,
      shapes,
      clip,
    });
  }

  /** Painted pieces: runs of unclipped items merge, each clipped item stays on its own. */
  pieces(): DrawPiece[] {
    const sorted = this.items.sort(
      (a, b) =>
        a.cluster - b.cluster || a.layer - b.layer || a.depth - b.depth || a.index - b.index,
    );
    const out: DrawPiece[] = [];
    for (const it of sorted) {
      const last = out[out.length - 1];
      if (!it.clip && last && !last.clip) last.shapes.push(...it.shapes);
      else out.push({ shapes: [...it.shapes], clip: it.clip });
    }
    return out;
  }

  solid(o: SolidOptions) {
    const M = AXIS[o.axis];
    const h = o.len / 2;
    const w = o.w ?? 1.5;
    const r0 = o.p0.map(([u, v]) => M(o.c, u, v, -h));
    const r1s = (o.p1 ?? o.p0).map(([u, v]) => M(o.c, u, v, h));
    this.track(r0.concat(r1s));
    const centre = average(r0.concat(r1s));
    const a = AXIS_DIR[o.axis];
    const faces: { pts: Vec3[]; n: Vec3; cap: boolean }[] = [
      { pts: r0, n: scale(a, -1), cap: true },
      { pts: r1s, n: a, cap: true },
    ];
    for (let i = 0; i < r0.length; i++) {
      const j = (i + 1) % r0.length;
      const q = [r0[i]!, r0[j]!, r1s[j]!, r1s[i]!];
      let n = unit(cross(sub(q[1]!, q[0]!), sub(q[3]!, q[0]!)));
      if (dot(n, sub(average(q), centre)) < 0) n = scale(n, -1);
      faces.push({ pts: q, n, cap: false });
    }
    const visible = faces.filter((f) => dot(f.n, EYE) > 1e-6);
    const shapes: DrawShape[] = [];
    if (o.smooth) {
      const outline = path(hull(r0.concat(r1s).map(project)));
      shapes.push({ d: outline, fill: tone(o.mat, 0.5) });
      // Side facets with the same shade share one path.
      const bands = new Map<string, string>();
      for (const f of visible.filter((f) => !f.cap)) {
        const c = shade(o.mat, f.n);
        bands.set(c, (bands.get(c) ?? "") + path(f.pts.map(project)));
      }
      for (const [c, d] of bands) shapes.push({ d, fill: c, stroke: c, strokeWidth: 0.6 });
      for (const f of visible.filter((f) => f.cap)) {
        shapes.push({
          d: path(f.pts.map(project)),
          fill: shade(o.mat, f.n),
          stroke: INK,
          strokeWidth: w * 0.7,
        });
      }
      shapes.push({ d: outline, fill: "none", stroke: INK, strokeWidth: w });
    } else {
      for (const f of visible) {
        const d = path(f.pts.map(project));
        shapes.push({ d, fill: shade(o.mat, f.n), stroke: INK, strokeWidth: w });
        if (o.hatch && f.n[1] > 0.6) shapes.push({ d, fill: HATCH });
      }
    }
    this.put(depth(o.c), shapes);
  }

  box(a: Vec3, b: Vec3, mat: Material, o: Partial<SolidOptions> = {}) {
    const hx = (b[0] - a[0]) / 2;
    const hy = (b[1] - a[1]) / 2;
    this.solid({
      ...o,
      axis: "z",
      c: [a[0] + hx, a[1] + hy, (a[2] + b[2]) / 2],
      len: b[2] - a[2],
      p0: [
        [-hx, -hy],
        [hx, -hy],
        [hx, hy],
        [-hx, hy],
      ],
      mat,
    });
  }

  cyl(
    axis: Axis,
    c: Vec3,
    r: number,
    len: number,
    mat: Material,
    o: { w?: number; n?: number } = {},
  ) {
    const n = o.n ?? Math.max(20, Math.min(48, Math.round(r * 1.4)));
    this.solid({ axis, c, len, p0: circle(r, n), mat, smooth: true, w: o.w });
  }

  /** Flat circle lying on a face (bore, port, hub, bolt hole...). */
  disc(
    axis: Axis,
    c: Vec3,
    r: number,
    fill: string,
    o: { w?: number; stroke?: string; dash?: string; n?: number } = {},
  ) {
    const n = o.n ?? Math.max(16, Math.min(56, Math.round(r * 1.5)));
    const pts = circle(r, n).map(([u, v]) => AXIS[axis](c, u, v, 0));
    this.track(pts);
    const w = o.w ?? 1;
    this.put(depth(c), [
      {
        d: path(pts.map(project)),
        fill,
        stroke: w ? (o.stroke ?? INK) : undefined,
        strokeWidth: w || undefined,
        dash: o.dash,
      },
    ]);
  }

  /** Front half of a circle wrapped round a cylinder (piston rings, case ribs). */
  arc(axis: Axis, c: Vec3, r: number, o: { w?: number; opacity?: number } = {}) {
    const n = 72;
    const pts: Vec2[] = [];
    const seen: boolean[] = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const p = AXIS[axis](c, r * Math.cos(a), r * Math.sin(a), 0);
      pts.push(project(p));
      seen.push(dot(sub(p, c), EYE) > 0);
    }
    const start = seen.findIndex((v, k) => v && !seen[(k - 1 + n) % n]);
    if (start < 0) return;
    const run: Vec2[] = [];
    for (let k = 0; k < n && seen[(start + k) % n]; k++) run.push(pts[(start + k) % n]!);
    this.put(depth(c), [
      {
        d: path(run, false),
        fill: "none",
        stroke: INK,
        strokeWidth: o.w ?? 0.9,
        opacity: o.opacity,
      },
    ]);
  }

  line(a: Vec3, b: Vec3, o: { w?: number; opacity?: number } = {}) {
    this.put(depth(scale(add(a, b), 0.5)), [
      {
        d: path([project(a), project(b)], false),
        fill: "none",
        stroke: INK,
        strokeWidth: o.w ?? 1,
        opacity: o.opacity,
      },
    ]);
  }

  poly(pts: Vec3[], fill: string, o: { w?: number } = {}) {
    this.track(pts);
    this.put(depth(average(pts)), [
      { d: path(pts.map(project)), fill, stroke: INK, strokeWidth: o.w ?? 1 },
    ]);
  }

  /** Bent pipe along a 3D curve. */
  tube(pts: Vec3[], w: number, mat: Material) {
    this.track(pts);
    const d = path(pts.map(project), false);
    this.put(depth(average(pts)), [
      { d, fill: "none", stroke: INK, strokeWidth: w + 2.6 },
      { d, fill: "none", stroke: tone(mat, 0.62), strokeWidth: w },
      {
        d,
        fill: "none",
        stroke: tone(mat, 1),
        strokeWidth: r1(w * 0.28),
        opacity: 0.9,
        shift: [r1(-w * 0.14), r1(-w * 0.2)],
      },
    ]);
  }

  /** Belt or other open outline that is already projected. */
  raw(d: number, shapes: DrawShape[]) {
    this.put(d, shapes);
  }
}

/* ---------------------------------------------------------------------------
   Engine geometry: a DOHC 16-valve inline-4 with its gearbox
   ------------------------------------------------------------------------- */

/** Bore centres along the crankshaft. */
export const BORES = [-67.5, -22.5, 22.5, 67.5] as const;
export const BORE_R = 18;
export const PISTON_R = 17;
export const DECK = 110;
const CRANK_Z = 15;
const THROW = 14;
const ROD = 52;
const HEAD_Z = 112.5;
const HEAD_TOP = 160.5;
const CAM_Y = 22;
const CAM_Z = 182.5;
/** Inline-4 crank: cylinders 1 and 4 at top dead centre, 2 and 3 at the bottom. */
const AT_TOP = [true, false, false, true];
const pinZ = (i: number) => CRANK_Z + (AT_TOP[i] ? THROW : -THROW);
/** Cam lobe angles for firing order 1-3-4-2 (the cam turns at half crank speed). */
const LOBE_DEG = [0, 270, 90, 180];
const BOLTS_X = [-85, -45, 0, 45, 85];
const CAM_TOWERS_X = [-86, -45, 0, 45, 86];

function block(P: Part) {
  P.box([-94, -50, 0], [94, 50, 6], "iron", { w: 1.2 }); // pan rail
  P.box([-92, -48, 0], [92, 48, DECK], "iron", { hatch: true });
  P.layer = 1;
  BORES.forEach((x) => {
    P.disc("z", [x, 0, DECK], BORE_R, HOLE, { w: 1.2 }); // cylinder bores
    P.disc("y", [x, 48, 80], 6, tone("iron", 0.85), { w: 0.9 }); // core plugs
  });
  BOLTS_X.forEach((x) => [-38, 38].forEach((y) => P.disc("z", [x, y, DECK], 2.6, INK, { w: 0 })));
  [-45, 0, 45].forEach((x) => P.line([x, 48, 12], [x, 48, 100])); // casting ribs
  P.disc("x", [-92.05, 0, CRANK_Z], 10, tone("iron", 0.55)); // crank seal
  P.layer = 2;
  P.cyl("y", [55, 50, 22], 15, 4, "iron", { w: 1 }); // oil filter boss
  P.cyl("y", [55, 67, 22], 14, 30, "rust"); // spin-on oil filter
  P.disc("y", [55, 82.05, 22], 8, "none", { w: 0.8 });
}

function gasket(P: Part) {
  P.box([-92, -46, DECK], [92, 46, DECK + 2.5], "steel", { w: 1.1 });
  P.layer = 1;
  BORES.forEach((x) => {
    P.disc("z", [x, 0, DECK + 2.5], BORE_R + 0.5, HOLE);
    P.disc("z", [x, 0, DECK + 2.5], BORE_R + 3.5, "none", { w: 0.6 }); // fire rings
  });
  BOLTS_X.forEach((x) =>
    [-38, 38].forEach((y) => P.disc("z", [x, y, DECK + 2.5], 3, HOLE, { w: 0.6 })),
  );
}

function head(P: Part) {
  P.box([-92, -46, HEAD_Z], [92, 46, HEAD_TOP], "alu", { hatch: true });
  P.layer = 1;
  BORES.forEach((x) => {
    P.disc("y", [x, 46.05, HEAD_Z + 22], 8.5, HOLE); // exhaust ports
    P.disc("z", [x, 0, HEAD_TOP], 6.5, HOLE); // spark plug wells
    P.disc("z", [x, 0, HEAD_TOP], 2.6, ACCENT, { w: 0.6 });
  });
  CAM_TOWERS_X.forEach((x) =>
    [-1, 1].forEach((s) =>
      P.box([x - 3, s * CAM_Y - 8, HEAD_TOP], [x + 3, s * CAM_Y + 8, HEAD_TOP + 18], "alu", {
        w: 1,
      }),
    ),
  );
  BORES.forEach((x) =>
    [-8.5, 8.5].forEach((dx) =>
      [-1, 1].forEach((s) =>
        P.cyl("z", [x + dx, s * CAM_Y, HEAD_TOP + 5], 4.6, 10, "rust", { w: 1, n: 20 }),
      ),
    ),
  ); // 16 valve springs
}

function cams(P: Part) {
  [-1, 1].forEach((s) => {
    const y = s * CAM_Y;
    const phase = s < 0 ? 0 : 100; // the exhaust cam lags the intake cam
    const feats: { x0: number; x1: number; angle?: number }[] = [];
    BORES.forEach((x, i) =>
      [-8.5, 8.5].forEach((dx) =>
        feats.push({
          x0: x + dx - 3,
          x1: x + dx + 3,
          angle: ((LOBE_DEG[i]! + phase) * Math.PI) / 180,
        }),
      ),
    );
    CAM_TOWERS_X.forEach((x) => feats.push({ x0: x - 3, x1: x + 3 }));
    feats.sort((p, q) => p.x0 - q.x0);
    const shaft = (a: number, b: number) => {
      if (b - a > 0.1) P.cyl("x", [(a + b) / 2, y, CAM_Z], 5, b - a, "steel", { w: 1, n: 20 });
    };
    let cur = -100;
    for (const f of feats) {
      shaft(cur, f.x0);
      const c: Vec3 = [(f.x0 + f.x1) / 2, y, CAM_Z];
      if (f.angle === undefined)
        P.cyl("x", c, 7, 6, "alu", { w: 1, n: 24 }); // journal
      else
        P.solid({
          axis: "x",
          c,
          len: 6,
          mat: "steel",
          smooth: true,
          w: 1,
          p0: hull(
            circle(8.5, 28).concat(circle(4, 14, 7.5 * Math.cos(f.angle), 7.5 * Math.sin(f.angle))),
          ),
        }); // lobe
      cur = f.x1;
    }
    shaft(cur, 92);
  });
}

function cover(P: Part) {
  P.solid({
    axis: "x",
    c: [0, 0, HEAD_TOP],
    len: 188,
    mat: "alu",
    hatch: true,
    p0: [
      [-44, 0],
      [44, 0],
      [44, 7],
      [31, 34],
      [-31, 34],
      [-44, 7],
    ],
  });
  P.layer = 1;
  const top = HEAD_TOP + 34;
  [-1, 1].forEach((s) => P.line([-58, s * 25, top], [88, s * 25, top], { w: 0.7, opacity: 0.55 }));
  BORES.forEach((x) => {
    P.box([x - 8, -9, top], [x + 8, 9, top + 12], "dark", { w: 1 }); // coil-on-plug packs
    P.box([x - 4, 9, top + 3], [x + 4, 14, top + 10], "rust", { w: 0.8 }); // connectors
  });
  P.cyl("z", [-80, -19, top + 3], 8, 6, "rust", { w: 1 }); // oil filler cap
}

/**
 * What you can see of anything inside bore x: below the deck only what shows
 * through the bore opening, above the deck everything. On screen that is the
 * bore ellipse plus the column straight above it.
 */
function boreColumn(x: number): string {
  const e = circle(BORE_R, 72).map(([u, v]) => project([x + u, v, DECK]));
  let left = 0;
  let right = 0;
  e.forEach((q, k) => {
    if (q[0] < e[left]![0]) left = k;
    if (q[0] > e[right]![0]) right = k;
  });
  const walk = (step: number) => {
    const out: Vec2[] = [];
    for (let k = right; ; k = (k + step + e.length) % e.length) {
      out.push(e[k]!);
      if (k === left) return out;
    }
  };
  const a = walk(1);
  const b = walk(-1);
  // Keep the half nearer the viewer (lower on screen).
  const front = (a[1]?.[1] ?? 0) > (b[1]?.[1] ?? 0) ? a : b;
  return path([[e[right]![0], -5000], ...front, [e[left]![0], -5000]]);
}

function pistons(P: Part) {
  BORES.forEach((x, i) => {
    const pz = pinZ(i);
    const wristZ = pz + ROD;
    const crown = wristZ + 19;
    const S = new Part();
    S.solid({
      axis: "x",
      c: [x, 0, 0],
      len: 8,
      mat: "steel",
      smooth: true,
      w: 1.2,
      p0: hull(circle(6.5, 20, 0, wristZ).concat(circle(11, 28, 0, pz))),
    }); // connecting rod
    S.cyl("z", [x, 0, crown - 18], PISTON_R, 36, "alu");
    S.layer = 1;
    S.disc("x", [x - 4.05, 0, pz], 8, tone("iron", 0.85), { w: 0.8 }); // big-end bearing
    S.disc("x", [x - 4.1, 0, pz], 5.5, HOLE, { w: 0.8 });
    [4, 7.5, 11].forEach((dz) => S.arc("z", [x, 0, crown - dz], PISTON_R)); // ring grooves
    S.disc("x", [x - 17.05, 0, wristZ], 5, ACCENT, { w: 0.8 }); // wrist pin
    for (let k = 0; k < 3; k++) {
      P.min[k] = Math.min(P.min[k]!, S.min[k]!);
      P.max[k] = Math.max(P.max[k]!, S.max[k]!);
    }
    P.put(
      depth([x, 0, wristZ]),
      S.pieces().flatMap((p) => p.shapes),
      { id: `engine-bore-${i}`, d: boreColumn(x) },
      depth([x, 0, wristZ]),
    );
  });
}

function crank(P: Part) {
  const seg = (x0: number, x1: number, mat: Material, prof: Vec2[]) =>
    P.solid({
      axis: "x",
      c: [(x0 + x1) / 2, 0, CRANK_Z],
      len: x1 - x0,
      p0: prof,
      mat,
      smooth: true,
      w: 1.1,
    });
  seg(-112, -96, "steel", circle(6, 20)); // snout
  seg(-96, -81.5, "steel", circle(9, 24)); // front main journal
  BORES.forEach((x, i) => {
    const s = AT_TOP[i] ? 1 : -1;
    const web = hull(circle(10, 20, 0, s * THROW).concat(circle(19, 32, 0, -s * 5))); // web and counterweight
    seg(x - 14, x - 8, "iron", web);
    seg(x - 8, x + 8, "steel", circle(8.5, 24, 0, s * THROW)); // crank pin
    seg(x + 8, x + 14, "iron", web);
    const next = BORES[i + 1];
    if (next !== undefined) seg(x + 14, next - 14, "steel", circle(9, 24)); // main journal
  });
  seg(81.5, 96, "steel", circle(9, 24));
  seg(96, 102, "iron", circle(20, 36)); // flywheel flange
}

function pan(P: Part) {
  P.solid({
    axis: "x",
    c: [0, 0, -4],
    len: 176,
    mat: "iron",
    hatch: true,
    p0: [
      [-46, 0],
      [46, 0],
      [46, -12],
      [34, -44],
      [-34, -44],
      [-46, -12],
    ],
  });
  P.box([-94, -50, -4], [94, 50, 0], "iron", { w: 1.2 });
  P.layer = 1;
  P.cyl("y", [50, 41, -30], 4.5, 5, "rust", { w: 0.9 }); // drain plug
}

function timing(P: Part) {
  const X = -100;
  const pulleys: { y: number; z: number; r: number; m: Material }[] = [
    { y: 0, z: CRANK_Z, r: 12, m: "steel" }, // crank sprocket
    { y: -26, z: 62, r: 11, m: "steel" }, // water pump
    { y: 30, z: 104, r: 8, m: "iron" }, // tensioner
    { y: -CAM_Y, z: CAM_Z, r: 20, m: "rust" }, // intake cam sprocket
    { y: CAM_Y, z: CAM_Z, r: 20, m: "rust" }, // exhaust cam sprocket
  ];
  pulleys.forEach((p) => P.cyl("x", [X, p.y, p.z], p.r, 8, p.m, { w: 1.1 }));
  P.layer = 1;
  pulleys.forEach((p) =>
    P.disc("x", [X - 4.05, p.y, p.z], p.r > 15 ? 6 : 3.2, tone("paper", 1), { w: 0.8 }),
  );
  [-1, 1].forEach((s) =>
    P.line([X - 4.05, s * CAM_Y, CAM_Z + 12], [X - 4.05, s * CAM_Y, CAM_Z + 18], { w: 1.4 }),
  ); // timing marks
  P.layer = 2;
  const belt = path(
    hull(pulleys.flatMap((p) => circle(p.r + 2.5, 36, p.y, p.z))).map(([u, v]) =>
      project([X, u, v]),
    ),
  );
  P.raw(0, [
    { d: belt, fill: "none", stroke: INK, strokeWidth: 7.5 },
    { d: belt, fill: "none", stroke: tone("dark", 0.6), strokeWidth: 4.4, dash: "2.2 1.6" },
  ]);
  P.layer = 3;
  P.cyl("x", [X - 10, 0, CRANK_Z], 19, 10, "dark", { w: 1.2 }); // crank pulley and damper
  P.layer = 4;
  P.disc("x", [X - 15.05, 0, CRANK_Z], 13, tone("iron", 0.55), { w: 0.9 });
  P.disc("x", [X - 15.1, 0, CRANK_Z], 4, ACCENT, { w: 0.8 });
}

function fan(P: Part) {
  const X = -135;
  const Z = 62;
  P.cyl("x", [X, 0, Z], 60, 10, "alu"); // shroud
  P.layer = 1;
  P.disc("x", [X - 5.05, 0, Z], 53, tone("steel", 0.3));
  P.layer = 2;
  for (let i = 0; i < 7; i++) {
    const a0 = (i * 2 * Math.PI) / 7;
    const blade = (
      [
        [12, -16],
        [30, -8],
        [48, 4],
        [51, 20],
        [47, 34],
        [30, 24],
        [12, 14],
      ] as Vec2[]
    ).map(([r, deg]): Vec3 => {
      const a = a0 + (deg * Math.PI) / 180;
      return [X - 5.5, r * Math.cos(a), Z + r * Math.sin(a)];
    });
    P.poly(blade, tone("paper", 0.8));
  }
  P.layer = 3;
  P.cyl("x", [X - 9, 0, Z], 11, 8, "rust", { w: 1 }); // motor hub
  P.layer = 4;
  P.disc("x", [X - 13.05, 0, Z], 4, tone("paper", 1), { w: 0.8 });
}

function radiator(P: Part) {
  const X0 = -182;
  const X1 = -170;
  P.box([X0, -78, 0], [X1, 78, 130], "paper"); // core
  P.box([X0 - 2, -92, -6], [X1 + 2, -78, 136], "iron"); // crossflow side tanks
  P.box([X0 - 2, 78, -6], [X1 + 2, 92, 136], "iron");
  P.layer = 1;
  const f = X0 - 0.05;
  let mesh = "";
  for (let y = -72; y <= 72; y += 6)
    mesh += path([project([f, y, 2]), project([f, y, 128])], false);
  for (let z = 10; z <= 124; z += 10)
    mesh += path([project([f, -78, z]), project([f, 78, z])], false);
  P.raw(0, [{ d: mesh, fill: "none", stroke: INK, strokeWidth: 0.55, opacity: 0.4 }]);
  P.cyl("z", [-176, 85, 140], 6, 8, "rust", { w: 1 }); // pressure cap
}

function intake(P: Part) {
  const Y = -104;
  const Z = 150;
  P.cyl("x", [0, Y, Z], 22, 176, "alu"); // plenum
  P.layer = 1;
  P.cyl("x", [-95, Y, Z], 15, 14, "rust"); // throttle body
  P.disc("x", [-102.05, Y, Z], 10, HOLE, { w: 0.9 });
  BORES.forEach((x) =>
    P.tube(
      bezier([x, Y, Z + 18], [x, Y + 4, Z + 46], [x, -62, HEAD_Z + 30], [x, -52, HEAD_Z + 24]),
      13,
      "alu",
    ),
  ); // runners
  P.layer = 2;
  P.box([-92, -52, HEAD_Z + 10], [92, -46, HEAD_Z + 38], "alu", { w: 1.2 }); // head flange
  P.layer = 3;
  BORES.forEach((x) => P.disc("y", [x, -45.95, HEAD_Z + 24], 8.5, HOLE, { w: 0.9 }));
}

function exhaust(P: Part) {
  P.box([-92, 46, HEAD_Z + 11], [92, 52, HEAD_Z + 33], "steel", { w: 1.2 }); // head flange
  P.solid({
    axis: "z",
    c: [0, 92, 36],
    len: 20,
    p0: circle(10, 32),
    p1: circle(17, 32),
    mat: "steel",
    smooth: true,
  }); // collector
  P.tube(bezier([0, 92, 26], [0, 93, -6], [22, 96, -40], [66, 96, -44]), 15, "iron"); // downpipe
  P.cyl("x", [69, 96, -44], 11, 4, "rust", { w: 1 });
  P.layer = 1;
  BORES.forEach((x) =>
    P.tube(
      bezier([x, 52, HEAD_Z + 22], [x, 88, HEAD_Z + 18], [x * 0.55, 96, 80], [x * 0.14, 92, 46]),
      12,
      "alu",
    ),
  ); // 4-into-1 runners
  P.layer = 2;
  P.cyl("y", [9, 109, 34], 3.8, 10, "rust", { w: 0.9 }); // oxygen sensor
}

function flywheel(P: Part) {
  const X = 107;
  P.cyl("x", [X, 0, CRANK_Z], 50, 10, "iron");
  P.layer = 1;
  P.disc("x", [X - 5.05, 0, CRANK_Z], 47.5, "none", { w: 2.4, dash: "1.4 1.4", n: 72 }); // ring gear
  P.disc("x", [X - 5.05, 0, CRANK_Z], 36, tone("steel", 0.95), { w: 0.8 }); // friction face
  P.disc("x", [X - 5.1, 0, CRANK_Z], 9, HOLE, { w: 0.8 });
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3;
    P.disc("x", [X - 5.1, 14 * Math.cos(a), CRANK_Z + 14 * Math.sin(a)], 1.8, INK, { w: 0 });
  }
}

function clutchDisc(P: Part) {
  const X = 117;
  P.cyl("x", [X, 0, CRANK_Z], 38, 4, "dark"); // friction disc
  P.layer = 1;
  P.disc("x", [X - 2.05, 0, CRANK_Z], 29, "none", { w: 0.7, stroke: tone("iron", 0.55) });
  P.disc("x", [X - 2.05, 0, CRANK_Z], 14, tone("iron", 0.55), { w: 0.8 });
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + Math.PI / 4;
    P.disc("x", [X - 2.1, 20 * Math.cos(a), CRANK_Z + 20 * Math.sin(a)], 3, ACCENT, { w: 0.6 }); // damper springs
  }
  P.disc("x", [X - 2.1, 0, CRANK_Z], 4.5, tone("dark", 0), { w: 0.6 });
}

function pressurePlate(P: Part) {
  const X = 126;
  P.cyl("x", [X, 0, CRANK_Z], 44, 9, "steel");
  P.layer = 1;
  P.disc("x", [X - 4.55, 0, CRANK_Z], 37, tone("steel", 0.9), { w: 0.8 });
  P.disc("x", [X - 4.6, 0, CRANK_Z], 22, tone("steel", 0.1), { w: 0.8 });
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    P.line(
      [X - 4.65, 8 * Math.cos(a), CRANK_Z + 8 * Math.sin(a)],
      [X - 4.65, 21 * Math.cos(a), CRANK_Z + 21 * Math.sin(a)],
      { w: 0.8 },
    ); // diaphragm fingers
  }
  P.disc("x", [X - 4.7, 0, CRANK_Z], 8, HOLE, { w: 0.8 });
}

function gearbox(P: Part) {
  P.solid({
    axis: "x",
    c: [151, 0, CRANK_Z],
    len: 40,
    p0: circle(62, 48),
    p1: circle(50, 48),
    mat: "alu",
    smooth: true,
  }); // bellhousing
  P.solid({
    axis: "x",
    c: [206, 0, CRANK_Z],
    len: 70,
    p0: circle(46, 40),
    p1: circle(34, 40),
    mat: "alu",
    smooth: true,
  }); // gear case
  [181, 196, 216, 231].forEach((x) =>
    P.arc("x", [x, 0, CRANK_Z], 46 - ((x - 171) * 12) / 70, { w: 0.8, opacity: 0.7 }),
  );
  P.disc("x", [130.95, 0, CRANK_Z], 55, tone("alu", 0.1)); // open bell
  P.cyl("x", [253, 0, CRANK_Z], 14, 24, "alu"); // tail housing
  P.cyl("x", [268, 0, CRANK_Z], 17, 6, "rust"); // output flange
  P.box([196, -10, CRANK_Z + 38], [216, 10, CRANK_Z + 50], "alu", { w: 1.1 }); // shift tower
  P.cyl("x", [150, 54, -26], 13, 44, "steel"); // starter motor
  P.cyl("x", [150, 64, -6], 8, 32, "rust"); // starter solenoid
  P.layer = 1;
  P.cyl("x", [124, 0, CRANK_Z], 5, 14, "steel", { w: 1 }); // input shaft
}

type PartSpec = { id: string; build: (P: Part) => void; dir: Vec3; window: [number, number] };

/**
 * Paint order is back to front. `dir` is the straight line each part travels
 * along; `window` is when it moves. Reassembly plays this in reverse.
 */
export const ENGINE_PARTS: readonly PartSpec[] = [
  { id: "intake", build: intake, dir: [0, -150, 0], window: [0.06, 0.58] },
  { id: "gearbox", build: gearbox, dir: [200, 0, 0], window: [0.1, 0.62] },
  { id: "pressure-plate", build: pressurePlate, dir: [142, 0, 0], window: [0.18, 0.7] },
  { id: "clutch-disc", build: clutchDisc, dir: [110, 0, 0], window: [0.24, 0.76] },
  { id: "flywheel", build: flywheel, dir: [70, 0, 0], window: [0.3, 0.82] },
  { id: "oil-pan", build: pan, dir: [0, 0, -185], window: [0.18, 0.7] },
  { id: "crankshaft", build: crank, dir: [0, 0, -88], window: [0.4, 0.92] },
  { id: "block", build: block, dir: [0, 0, 0], window: [0, 1] },
  { id: "pistons", build: pistons, dir: [0, 0, 150], window: [0.42, 0.94] },
  { id: "head-gasket", build: gasket, dir: [0, 0, 185], window: [0.34, 0.86] },
  { id: "cylinder-head", build: head, dir: [0, 0, 220], window: [0.28, 0.8] },
  { id: "camshafts", build: cams, dir: [0, 0, 268], window: [0.22, 0.74] },
  { id: "valve-cover", build: cover, dir: [0, 0, 335], window: [0.14, 0.66] },
  { id: "exhaust-manifold", build: exhaust, dir: [0, 150, 0], window: [0.06, 0.58] },
  { id: "timing-belt", build: timing, dir: [-70, 0, 0], window: [0.1, 0.62] },
  { id: "cooling-fan", build: fan, dir: [-140, 0, 0], window: [0.04, 0.56] },
  { id: "radiator", build: radiator, dir: [-215, 0, 0], window: [0, 0.52] },
];

/** Centrelines (chain lines) and travel paths, in world space. */
const GUIDES: { a: Vec3; b: Vec3; centre?: boolean }[] = [
  { a: [-420, 0, CRANK_Z], b: [490, 0, CRANK_Z], centre: true }, // crankshaft axis
  { a: [-67.5, 0, -110], b: [-67.5, 0, 550], centre: true }, // cylinder 1 axis
  { a: [67.5, 0, -110], b: [67.5, 0, 550] }, // cylinder 4 axis
  { a: [0, -275, 150], b: [0, -46, 150] }, // intake travel
  { a: [0, 52, 36], b: [0, 266, 36] }, // exhaust travel
  { a: [-420, 0, 62], b: [-100, 0, 62] }, // fan and radiator travel
  { a: [-185, CAM_Y, CAM_Z], b: [-96, CAM_Y, CAM_Z] }, // cam sprocket travel
];

/** Builds the whole drawing. Deterministic, so it can run once at build time. */
export function buildEngineDrawing(): EngineDrawing {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const parts = ENGINE_PARTS.map((spec): DrawnPart => {
    const P = new Part();
    spec.build(P);
    const screenDir = project(spec.dir);
    // Screen bounds of the part when fully exploded: corners of its 3D box, moved.
    for (const x of [P.min[0], P.max[0]])
      for (const y of [P.min[1], P.max[1]])
        for (const z of [P.min[2], P.max[2]]) {
          const [sx, sy] = project(add([x, y, z], spec.dir));
          minX = Math.min(minX, sx);
          maxX = Math.max(maxX, sx);
          minY = Math.min(minY, sy);
          maxY = Math.max(maxY, sy);
        }
    return {
      id: spec.id,
      dir: spec.dir,
      screenDir: [r1(screenDir[0]), r1(screenDir[1])],
      window: spec.window,
      pieces: P.pieces(),
      bounds3: { min: [...P.min], max: [...P.max] },
    };
  });
  const pad = 12;
  return {
    parts,
    guides: GUIDES.map((g) => ({
      d: path([project(g.a), project(g.b)], false),
      centre: !!g.centre,
    })),
    viewBox: {
      x: Math.floor(minX - pad),
      y: Math.floor(minY - pad),
      width: Math.ceil(maxX - minX + 2 * pad),
      height: Math.ceil(maxY - minY + 2 * pad),
    },
  };
}
