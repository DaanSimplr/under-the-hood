/**
 * Learner progress. All changes go through pure reducers (unit tested); the
 * Zustand store applies them and persists through a StateStorage adapter.
 * Today that adapter is localStorage. A backend can replace it by passing a
 * different adapter to createProgressStore() — components do not change.
 */
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

export type QuizScore = {
  best: number;
  last: number;
  total: number;
  attempts: number;
  /** ISO date of the last attempt. */
  at: string;
};

export type ProgressData = {
  /** partId -> first visit (ISO date). */
  visitedParts: Record<string, string>;
  /** partId -> when it was marked as learned. */
  learnedParts: Record<string, string>;
  /** teardown slug -> completed step ids. */
  teardownSteps: Record<string, string[]>;
  /** systemId -> quiz scores. */
  quizScores: Record<string, QuizScore>;
};

export const emptyProgress = (): ProgressData => ({
  visitedParts: {},
  learnedParts: {},
  teardownSteps: {},
  quizScores: {},
});

/* ------------------------------------------------------------------
   Pure reducers
   ------------------------------------------------------------------ */

export function visitPart(s: ProgressData, partId: string, now: string): ProgressData {
  if (s.visitedParts[partId]) return s;
  return { ...s, visitedParts: { ...s.visitedParts, [partId]: now } };
}

export function setPartLearned(
  s: ProgressData,
  partId: string,
  learned: boolean,
  now: string,
): ProgressData {
  const learnedParts = { ...s.learnedParts };
  if (learned) learnedParts[partId] = now;
  else delete learnedParts[partId];
  return { ...s, learnedParts };
}

export function setStepDone(
  s: ProgressData,
  slug: string,
  stepId: string,
  done: boolean,
): ProgressData {
  const current = new Set(s.teardownSteps[slug] ?? []);
  if (done) current.add(stepId);
  else current.delete(stepId);
  return { ...s, teardownSteps: { ...s.teardownSteps, [slug]: [...current] } };
}

export function resetTeardown(s: ProgressData, slug: string): ProgressData {
  const teardownSteps = { ...s.teardownSteps };
  delete teardownSteps[slug];
  return { ...s, teardownSteps };
}

export function recordQuiz(
  s: ProgressData,
  systemId: string,
  score: number,
  total: number,
  now: string,
): ProgressData {
  if (total <= 0 || score < 0 || score > total)
    throw new Error(`Invalid quiz score ${score}/${total}`);
  const prev = s.quizScores[systemId];
  const next: QuizScore = {
    best: Math.max(prev?.best ?? 0, score),
    last: score,
    total,
    attempts: (prev?.attempts ?? 0) + 1,
    at: now,
  };
  return { ...s, quizScores: { ...s.quizScores, [systemId]: next } };
}

/* ------------------------------------------------------------------
   Derived values
   ------------------------------------------------------------------ */

export function teardownCompletion(s: ProgressData, slug: string, stepIds: string[]) {
  const done = new Set(s.teardownSteps[slug] ?? []);
  const count = stepIds.filter((id) => done.has(id)).length;
  const total = stepIds.length;
  return {
    done: count,
    total,
    complete: total > 0 && count === total,
    pct: total ? count / total : 0,
  };
}

export function summarize(
  s: ProgressData,
  totals: {
    partIds: string[];
    teardowns: Array<{ slug: string; stepIds: string[] }>;
    systemIds: string[];
  },
) {
  const learned = totals.partIds.filter((id) => s.learnedParts[id]).length;
  const visited = totals.partIds.filter((id) => s.visitedParts[id]).length;
  const guidesDone = totals.teardowns.filter(
    (t) => teardownCompletion(s, t.slug, t.stepIds).complete,
  ).length;
  const quizzesTaken = totals.systemIds.filter((id) => s.quizScores[id]).length;
  const perfectQuizzes = totals.systemIds.filter((id) => {
    const q = s.quizScores[id];
    return q && q.best === q.total;
  }).length;
  return { learned, visited, guidesDone, quizzesTaken, perfectQuizzes };
}

/* ------------------------------------------------------------------
   Store
   ------------------------------------------------------------------ */

export type ProgressState = ProgressData & {
  visitPart: (partId: string) => void;
  setPartLearned: (partId: string, learned: boolean) => void;
  setStepDone: (slug: string, stepId: string, done: boolean) => void;
  resetTeardown: (slug: string) => void;
  recordQuiz: (systemId: string, score: number, total: number) => void;
  resetAll: () => void;
};

export const PROGRESS_STORAGE_KEY = "under-the-hood:progress";

const nowIso = () => new Date().toISOString();

/** Builds a progress store on top of any StateStorage (localStorage, a remote API adapter, memory…). */
export function createProgressStore(getStorage: () => StateStorage) {
  return create<ProgressState>()(
    persist(
      (set) => {
        const apply = (fn: (s: ProgressData) => ProgressData) => set((s) => fn(s));
        return {
          ...emptyProgress(),
          visitPart: (id) => apply((s) => visitPart(s, id, nowIso())),
          setPartLearned: (id, learned) => apply((s) => setPartLearned(s, id, learned, nowIso())),
          setStepDone: (slug, stepId, done) => apply((s) => setStepDone(s, slug, stepId, done)),
          resetTeardown: (slug) => apply((s) => resetTeardown(s, slug)),
          recordQuiz: (id, score, total) => apply((s) => recordQuiz(s, id, score, total, nowIso())),
          resetAll: () => set(emptyProgress()),
        };
      },
      {
        name: PROGRESS_STORAGE_KEY,
        version: 1,
        storage: createJSONStorage(getStorage),
        // Hydrate after mount (see ProgressHydrator) so static HTML never mismatches.
        skipHydration: true,
        partialize: (s): ProgressData => ({
          visitedParts: s.visitedParts,
          learnedParts: s.learnedParts,
          teardownSteps: s.teardownSteps,
          quizScores: s.quizScores,
        }),
      },
    ),
  );
}

/** The app's progress store. Swap the adapter here to move progress to a backend. */
export const useProgress = createProgressStore(() => localStorage);
