import { describe, expect, it } from "vitest";
import type { StateStorage } from "zustand/middleware";
import {
  createProgressStore,
  emptyProgress,
  PROGRESS_STORAGE_KEY,
  recordQuiz,
  resetTeardown,
  setPartLearned,
  setStepDone,
  summarize,
  teardownCompletion,
  visitPart,
} from "@/lib/progress";

const T = "2026-01-01T00:00:00.000Z";

describe("progress reducers", () => {
  it("records the first visit only", () => {
    const a = visitPart(emptyProgress(), "battery", T);
    const b = visitPart(a, "battery", "2027-01-01T00:00:00.000Z");
    expect(b.visitedParts.battery).toBe(T);
    expect(b).toBe(a); // unchanged state is returned as-is
  });

  it("marks and unmarks parts as learned", () => {
    const a = setPartLearned(emptyProgress(), "battery", true, T);
    expect(a.learnedParts.battery).toBe(T);
    expect(setPartLearned(a, "battery", false, T).learnedParts.battery).toBeUndefined();
  });

  it("toggles teardown steps without duplicates and computes completion", () => {
    let s = setStepDone(emptyProgress(), "guide", "a", true);
    s = setStepDone(s, "guide", "a", true);
    s = setStepDone(s, "guide", "b", true);
    expect(s.teardownSteps.guide).toEqual(["a", "b"]);
    expect(teardownCompletion(s, "guide", ["a", "b", "c"])).toMatchObject({
      done: 2,
      total: 3,
      complete: false,
    });
    s = setStepDone(s, "guide", "c", true);
    expect(teardownCompletion(s, "guide", ["a", "b", "c"]).complete).toBe(true);
    // Steps that no longer exist in the guide are ignored.
    expect(teardownCompletion(s, "guide", ["a"]).done).toBe(1);
    expect(resetTeardown(s, "guide").teardownSteps.guide).toBeUndefined();
  });

  it("keeps the best quiz score and counts attempts", () => {
    let s = recordQuiz(emptyProgress(), "brakes", 3, 4, T);
    s = recordQuiz(s, "brakes", 1, 4, T);
    expect(s.quizScores.brakes).toMatchObject({ best: 3, last: 1, total: 4, attempts: 2 });
    expect(() => recordQuiz(s, "brakes", 5, 4, T)).toThrow();
  });

  it("summarizes against the current content", () => {
    let s = setPartLearned(emptyProgress(), "battery", true, T);
    s = recordQuiz(s, "brakes", 4, 4, T);
    s = setStepDone(s, "g", "only", true);
    expect(
      summarize(s, {
        partIds: ["battery", "alternator"],
        teardowns: [{ slug: "g", stepIds: ["only"] }],
        systemIds: ["brakes", "electrical"],
      }),
    ).toEqual({ learned: 1, visited: 0, guidesDone: 1, quizzesTaken: 1, perfectQuizzes: 1 });
  });
});

describe("progress store", () => {
  function memoryStorage(): StateStorage & { data: Map<string, string> } {
    const data = new Map<string, string>();
    return {
      data,
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => void data.set(k, v),
      removeItem: (k) => void data.delete(k),
    };
  }

  it("persists through any storage adapter (so a backend can replace localStorage)", async () => {
    const storage = memoryStorage();
    const store = createProgressStore(() => storage);
    await store.persist.rehydrate();
    store.getState().setPartLearned("battery", true);
    store.getState().recordQuiz("electrical", 2, 4);

    const saved = JSON.parse(storage.data.get(PROGRESS_STORAGE_KEY)!);
    expect(saved.state.learnedParts.battery).toBeTruthy();
    expect(saved.state.quizScores.electrical.best).toBe(2);
    expect(saved.state).not.toHaveProperty("recordQuiz"); // only data is saved

    // A fresh store on the same storage reads it back.
    const again = createProgressStore(() => storage);
    await again.persist.rehydrate();
    expect(again.getState().learnedParts.battery).toBeTruthy();

    again.getState().resetAll();
    expect(again.getState().quizScores).toEqual({});
  });
});
