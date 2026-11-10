import { z } from "zod";

/**
 * Zod schemas for every kind of content. Types used across the app are
 * inferred from these, so the schema is the single source of truth.
 */

const kebabId = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "ids must be kebab-case, e.g. brake-pads");

const nonEmpty = z.string().trim().min(1);

/** Notes for facts that still need checking. Each entry starts with "// TODO verify". */
const todoNotes = z
  .array(z.string().startsWith("// TODO verify", 'todo notes must start with "// TODO verify"'))
  .optional();

export const SYSTEM_IDS = [
  "engine",
  "drivetrain",
  "brakes",
  "suspension-steering",
  "electrical",
  "cooling",
  "fuel-exhaust",
  "body-chassis",
] as const;
export const systemIdSchema = z.enum(SYSTEM_IDS);
export type SystemId = z.infer<typeof systemIdSchema>;

export const systemSchema = z.strictObject({
  id: systemIdSchema,
  name: nonEmpty,
  summary: nonEmpty,
  order: z.number().int().positive(),
  heroSlot: kebabId,
  partIds: z.array(kebabId).min(1),
  todo: todoNotes,
});
export type System = z.infer<typeof systemSchema>;

export const difficultySchema = z.number().int().min(1).max(5);

export const partSchema = z.strictObject({
  id: kebabId,
  name: nonEmpty,
  systemId: systemIdSchema,
  aka: z.array(nonEmpty),
  summary: nonEmpty,
  whatItDoes: nonEmpty,
  howItWorks: nonEmpty,
  location: kebabId,
  connectsTo: z.array(kebabId),
  failureSymptoms: z.array(nonEmpty).min(1),
  removalDifficulty: difficultySchema,
  toolsNeeded: z.array(nonEmpty).min(1),
  safetyNotes: z.array(nonEmpty).min(1),
  relatedTeardowns: z.array(kebabId),
  todo: todoNotes,
});
export type Part = z.infer<typeof partSchema>;

/** Safety topics with standard texts in lib/safety.ts. */
export const CORE_SAFETY_TOPICS = [
  "jack-stands",
  "battery-disconnect",
  "hot-fluids",
  "airbags",
  "ev-high-voltage",
] as const;
export const SAFETY_TOPICS = [
  ...CORE_SAFETY_TOPICS,
  "brake-dust",
  "eye-protection",
  "spring-tension",
] as const;
export const safetyTopicSchema = z.enum(SAFETY_TOPICS);
export type SafetyTopic = z.infer<typeof safetyTopicSchema>;

export const teardownFrontmatterSchema = z
  .strictObject({
    slug: kebabId,
    title: nonEmpty,
    summary: nonEmpty,
    systemId: systemIdSchema,
    partIds: z.array(kebabId).min(1),
    difficulty: difficultySchema,
    timeEstimate: nonEmpty,
    tools: z.array(nonEmpty).min(1),
    safety: z.array(z.strictObject({ topic: safetyTopicSchema, note: nonEmpty.optional() })).min(1),
    heroSlot: kebabId.optional(),
  })
  .superRefine((fm, ctx) => {
    const topics = new Set(fm.safety.map((s) => s.topic));
    for (const core of CORE_SAFETY_TOPICS) {
      if (!topics.has(core)) {
        ctx.addIssue({
          code: "custom",
          path: ["safety"],
          message: `every teardown must include the core safety topic "${core}"`,
        });
      }
    }
    if (topics.size !== fm.safety.length) {
      ctx.addIssue({ code: "custom", path: ["safety"], message: "duplicate safety topic" });
    }
  });
export type TeardownFrontmatter = z.infer<typeof teardownFrontmatterSchema>;

export const quizQuestionSchema = z
  .strictObject({
    prompt: nonEmpty,
    options: z.array(nonEmpty).min(2).max(6),
    answerIndex: z.number().int().min(0),
    explanation: nonEmpty,
    partId: kebabId.optional(),
  })
  .refine((q) => q.answerIndex < q.options.length, {
    message: "answerIndex must point at one of the options",
    path: ["answerIndex"],
  });

export const quizSchema = z.strictObject({
  systemId: systemIdSchema,
  questions: z.array(quizQuestionSchema).min(3),
});
export type Quiz = z.infer<typeof quizSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

export const glossaryEntrySchema = z.strictObject({
  id: kebabId,
  term: nonEmpty,
  aka: z.array(nonEmpty).default([]),
  definition: nonEmpty,
  partId: kebabId.optional(),
  todo: todoNotes,
});
export const glossarySchema = z.array(glossaryEntrySchema).min(1);
export type GlossaryEntry = z.infer<typeof glossaryEntrySchema>;

/** A clickable point on the car diagram, in SVG viewBox units (0 0 1000 440). */
export const hotspotSchema = z.strictObject({
  id: kebabId,
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(440),
});
export const hotspotsSchema = z.array(hotspotSchema).min(1);
export type Hotspot = z.infer<typeof hotspotSchema>;

/* ------------------------------------------------------------------
   Media manifest (public/media/assets.json) — the contract with the
   media agent. Loose objects: extra fields the media agent adds are kept.
   ------------------------------------------------------------------ */

export const MEDIA_STATUSES = ["placeholder", "generated", "approved"] as const;

export const mediaSlotSchema = z.looseObject({
  id: kebabId,
  type: z.enum(["video", "image"]),
  role: nonEmpty,
  path: nonEmpty,
  altPath: nonEmpty.optional(),
  poster: nonEmpty.optional(),
  aspect: z.string().regex(/^\d+(\.\d+)?:\d+(\.\d+)?$/, 'aspect must look like "16:9"'),
  resolution: z
    .string()
    .regex(/^\d+x\d+$/)
    .optional(),
  durationSec: z.number().positive().optional(),
  loop: z.boolean().optional(),
  maxSizeKB: z.number().positive().optional(),
  alt: z.string(),
  brief: nonEmpty,
  status: z.enum(MEDIA_STATUSES),
  /** Optional extra widths for responsive images: [{ path, width }]. */
  variants: z
    .array(z.strictObject({ path: nonEmpty, width: z.number().int().positive() }))
    .optional(),
});
export type MediaSlot = z.infer<typeof mediaSlotSchema>;

export const mediaManifestSchema = z
  .looseObject({
    version: z.number(),
    slots: z.array(mediaSlotSchema).min(1),
  })
  .superRefine((m, ctx) => {
    const seen = new Set<string>();
    for (const slot of m.slots) {
      if (seen.has(slot.id)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate slot id "${slot.id}"`,
          path: ["slots"],
        });
      }
      seen.add(slot.id);
    }
  });
export type MediaManifest = z.infer<typeof mediaManifestSchema>;
