/**
 * Loads every content file at build time, validates it with Zod and checks
 * the links between files. Any problem throws one error that lists every
 * issue with its file, so `npm run build` fails loudly on bad content.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { z } from "zod";
import { getSlotIds } from "./assets";
import { ASSEMBLY_IDS } from "./assemblies";
import type { DiagramPart } from "./diagram";
import {
  glossarySchema,
  hotspotsSchema,
  partSchema,
  quizSchema,
  systemSchema,
  teardownFrontmatterSchema,
  type GlossaryEntry,
  type Hotspot,
  type Part,
  type Quiz,
  type System,
  type SystemId,
  type TeardownFrontmatter,
} from "./schemas";

export const CONTENT_DIR = path.join(process.cwd(), "content");

export type Teardown = TeardownFrontmatter & {
  /** Raw MDX body (without frontmatter). */
  body: string;
  /** Step ids in body order, taken from <Step id="…">. */
  stepIds: string[];
  /** Step titles in body order. */
  stepTitles: string[];
  file: string;
};

export type Content = {
  systems: System[];
  parts: Part[];
  teardowns: Teardown[];
  quizzes: Quiz[];
  glossary: GlossaryEntry[];
  hotspots: Hotspot[];
};

export class ContentError extends Error {
  constructor(public issues: string[]) {
    super(
      `Content validation failed (${issues.length} issue(s)):\n${issues.map((i) => `  - ${i}`).join("\n")}`,
    );
    this.name = "ContentError";
  }
}

function listFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .sort()
    .map((f) => path.join(dir, f));
}

function rel(file: string) {
  return path.relative(process.cwd(), file).replaceAll("\\", "/");
}

function parseWith<T>(
  schema: z.ZodType<T>,
  raw: unknown,
  file: string,
  issues: string[],
): T | null {
  const result = schema.safeParse(raw);
  if (result.success) return result.data;
  for (const issue of result.error.issues) {
    issues.push(`${rel(file)} → ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  return null;
}

function readJson(file: string, issues: string[]): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    issues.push(`${rel(file)}: invalid JSON (${(err as Error).message})`);
    return undefined;
  }
}

const STEP_RE = /<Step\b([^>]*)>/g;
const ATTR_RE = (name: string) => new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`);

function attr(tag: string, name: string): string | undefined {
  const m = ATTR_RE(name).exec(tag);
  return m ? (m[1] ?? m[2]) : undefined;
}

/** Pulls component usages out of an MDX body so ids can be checked before rendering. */
export function scanMdx(body: string) {
  const steps: Array<{ id?: string; title?: string }> = [];
  for (const m of body.matchAll(STEP_RE)) {
    const tag = m[1] ?? "";
    steps.push({ id: attr(tag, "id"), title: attr(tag, "title") });
  }
  const pick = (component: string, name: string) =>
    [...body.matchAll(new RegExp(`<${component}\\b([^>]*)>`, "g"))].map((m) =>
      attr(m[1] ?? "", name),
    );
  return {
    steps,
    diagramFocus: pick("DiagramFocus", "part"),
    terms: pick("Term", "id"),
    safety: pick("SafetyCallout", "topic"),
    assemblies: pick("ExplodedView", "assembly"),
  };
}

export function loadContent(): Content {
  const issues: string[] = [];

  const systems = listFiles(path.join(CONTENT_DIR, "systems"), ".json")
    .map((f) => {
      const s = parseWith(systemSchema, readJson(f, issues), f, issues);
      if (s && path.basename(f, ".json") !== s.id)
        issues.push(`${rel(f)}: file name must match id "${s.id}"`);
      return s;
    })
    .filter((s): s is System => s !== null)
    .sort((a, b) => a.order - b.order);

  const parts = listFiles(path.join(CONTENT_DIR, "parts"), ".json")
    .map((f) => {
      const p = parseWith(partSchema, readJson(f, issues), f, issues);
      if (p && path.basename(f, ".json") !== p.id)
        issues.push(`${rel(f)}: file name must match id "${p.id}"`);
      return p;
    })
    .filter((p): p is Part => p !== null);

  const teardowns: Teardown[] = [];
  for (const file of listFiles(path.join(CONTENT_DIR, "teardowns"), ".mdx")) {
    const { data, content } = matter(fs.readFileSync(file, "utf8"));
    const fm = parseWith(teardownFrontmatterSchema, data, file, issues);
    if (!fm) continue;
    if (path.basename(file, ".mdx") !== fm.slug)
      issues.push(`${rel(file)}: file name must match slug "${fm.slug}"`);
    const scan = scanMdx(content);
    teardowns.push({
      ...fm,
      body: content,
      stepIds: scan.steps.map((s) => s.id ?? ""),
      stepTitles: scan.steps.map((s) => s.title ?? ""),
      file: rel(file),
    });
  }

  const quizzes = listFiles(path.join(CONTENT_DIR, "quizzes"), ".json")
    .map((f) => parseWith(quizSchema, readJson(f, issues), f, issues))
    .filter((q): q is Quiz => q !== null);

  const glossaryFile = path.join(CONTENT_DIR, "glossary.json");
  const glossary =
    parseWith(glossarySchema, readJson(glossaryFile, issues), glossaryFile, issues) ?? [];

  const hotspotsFile = path.join(CONTENT_DIR, "hotspots.json");
  const hotspots =
    parseWith(hotspotsSchema, readJson(hotspotsFile, issues), hotspotsFile, issues) ?? [];

  const content: Content = { systems, parts, teardowns, quizzes, glossary, hotspots };
  issues.push(...checkReferences(content));
  if (issues.length > 0) throw new ContentError(issues);
  return content;
}

/** Cross-file checks. Exported for tests. */
export function checkReferences(c: Content, slotIds: string[] = getSlotIds()): string[] {
  const issues: string[] = [];
  const partIds = new Set(c.parts.map((p) => p.id));
  const systemIds = new Set(c.systems.map((s) => s.id));
  const teardownSlugs = new Set(c.teardowns.map((t) => t.slug));
  const hotspotIds = new Set(c.hotspots.map((h) => h.id));
  const glossaryIds = new Set(c.glossary.map((g) => g.id));
  const slots = new Set(slotIds);

  const dupes = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) issues.push(`duplicate ${label} id "${id}"`);
      seen.add(id);
    }
  };
  dupes(
    "system",
    c.systems.map((s) => s.id),
  );
  dupes(
    "part",
    c.parts.map((p) => p.id),
  );
  dupes(
    "teardown",
    c.teardowns.map((t) => t.slug),
  );
  dupes(
    "glossary",
    c.glossary.map((g) => g.id),
  );
  dupes(
    "hotspot",
    c.hotspots.map((h) => h.id),
  );
  dupes(
    "quiz",
    c.quizzes.map((q) => q.systemId),
  );

  for (const s of c.systems) {
    if (!slots.has(s.heroSlot))
      issues.push(`system "${s.id}": heroSlot "${s.heroSlot}" is not in assets.json`);
    for (const pid of s.partIds) {
      const part = c.parts.find((p) => p.id === pid);
      if (!part) issues.push(`system "${s.id}": unknown part "${pid}"`);
      else if (part.systemId !== s.id)
        issues.push(
          `system "${s.id}" lists part "${pid}", but that part says systemId "${part.systemId}"`,
        );
    }
  }

  for (const p of c.parts) {
    if (!systemIds.has(p.systemId)) issues.push(`part "${p.id}": unknown systemId "${p.systemId}"`);
    const sys = c.systems.find((s) => s.id === p.systemId);
    if (sys && !sys.partIds.includes(p.id))
      issues.push(`part "${p.id}" is not listed in system "${p.systemId}".partIds`);
    if (!hotspotIds.has(p.location))
      issues.push(`part "${p.id}": location "${p.location}" is not in hotspots.json`);
    if (!slots.has(p.heroSlot))
      issues.push(`part "${p.id}": heroSlot "${p.heroSlot}" is not in assets.json`);
    for (const id of p.connectsTo) {
      if (id === p.id) issues.push(`part "${p.id}": connectsTo itself`);
      else if (!partIds.has(id)) issues.push(`part "${p.id}": connectsTo unknown part "${id}"`);
    }
    for (const slug of p.relatedTeardowns)
      if (!teardownSlugs.has(slug))
        issues.push(`part "${p.id}": unknown related teardown "${slug}"`);
  }

  for (const t of c.teardowns) {
    const where = `teardown "${t.slug}" (${t.file})`;
    if (!systemIds.has(t.systemId)) issues.push(`${where}: unknown systemId "${t.systemId}"`);
    if (t.heroSlot && !slots.has(t.heroSlot))
      issues.push(`${where}: heroSlot "${t.heroSlot}" is not in assets.json`);
    for (const id of t.partIds) if (!partIds.has(id)) issues.push(`${where}: unknown part "${id}"`);

    const scan = scanMdx(t.body);
    if (scan.steps.length === 0)
      issues.push(`${where}: needs at least one <Step id="…" title="…">`);
    const seen = new Set<string>();
    scan.steps.forEach((s, i) => {
      if (!s.id) issues.push(`${where}: step ${i + 1} is missing id="…"`);
      else if (seen.has(s.id)) issues.push(`${where}: duplicate step id "${s.id}"`);
      else seen.add(s.id);
      if (!s.title) issues.push(`${where}: step ${i + 1} is missing title="…"`);
    });
    for (const id of scan.diagramFocus)
      if (!id || !partIds.has(id))
        issues.push(`${where}: <DiagramFocus part="${id}"> names an unknown part`);
    for (const id of scan.terms)
      if (!id || !glossaryIds.has(id))
        issues.push(`${where}: <Term id="${id}"> is not in glossary.json`);
    for (const id of scan.assemblies)
      if (!id || !(ASSEMBLY_IDS as readonly string[]).includes(id))
        issues.push(`${where}: <ExplodedView assembly="${id}"> is not a known assembly`);
  }

  for (const sys of c.systems) {
    if (!c.quizzes.some((q) => q.systemId === sys.id))
      issues.push(`system "${sys.id}" has no quiz`);
  }
  for (const q of c.quizzes) {
    q.questions.forEach((qq, i) => {
      if (qq.partId && !partIds.has(qq.partId))
        issues.push(`quiz "${q.systemId}" question ${i + 1}: unknown partId "${qq.partId}"`);
    });
  }

  for (const g of c.glossary)
    if (g.partId && !partIds.has(g.partId))
      issues.push(`glossary "${g.id}": unknown partId "${g.partId}"`);

  return issues;
}

/* ------------------------------------------------------------------
   Cached accessors used by pages.
   ------------------------------------------------------------------ */

let cache: Content | null = null;

export function getContent(): Content {
  if (cache && process.env.NODE_ENV !== "development") return cache;
  cache = loadContent();
  return cache;
}

export const getSystems = () => getContent().systems;
export const getParts = () => getContent().parts;
export const getTeardowns = () => getContent().teardowns;
export const getGlossary = () =>
  [...getContent().glossary].sort((a, b) => a.term.localeCompare(b.term));
export const getHotspots = () => getContent().hotspots;
export const getQuizzes = () => getContent().quizzes;

export function getSystem(id: string): System | undefined {
  return getSystems().find((s) => s.id === id);
}
export function getPart(id: string): Part | undefined {
  return getParts().find((p) => p.id === id);
}
export function getPartsForSystem(id: SystemId | string): Part[] {
  const sys = getSystem(id);
  if (!sys) return [];
  return sys.partIds.map((pid) => getPart(pid)).filter((p): p is Part => Boolean(p));
}
export function getTeardown(slug: string): Teardown | undefined {
  return getTeardowns().find((t) => t.slug === slug);
}
export function getTeardownsForSystem(id: string): Teardown[] {
  return getTeardowns().filter((t) => t.systemId === id);
}
export function getQuiz(systemId: string): Quiz | undefined {
  return getQuizzes().find((q) => q.systemId === systemId);
}

/** Minimal part data for the car diagram, with hotspot coordinates. */
export function getDiagramParts(): DiagramPart[] {
  const hotspots = getHotspots();
  return getParts().map((p) => {
    const h = hotspots.find((x) => x.id === p.location)!;
    return {
      id: p.id,
      name: p.name,
      systemId: p.systemId,
      summary: p.summary,
      connectsTo: p.connectsTo,
      x: h.x,
      y: h.y,
    };
  });
}

/** Parts that this part connects to, plus parts that point back at it. */
export function getConnectedPartIds(partId: string, parts: Part[] = getParts()): string[] {
  const out = new Set<string>();
  const self = parts.find((p) => p.id === partId);
  self?.connectsTo.forEach((id) => out.add(id));
  for (const p of parts) if (p.connectsTo.includes(partId)) out.add(p.id);
  out.delete(partId);
  return [...out];
}
