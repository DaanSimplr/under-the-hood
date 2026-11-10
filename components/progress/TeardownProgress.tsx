"use client";

import { teardownCompletion, useProgress } from "@/lib/progress";
import { useProgressHydrated } from "./useProgressHydrated";

/** "3 of 12 steps done" with a bar, and a reset for this guide. */
export function TeardownProgress({ slug, stepIds }: { slug: string; stepIds: string[] }) {
  const hydrated = useProgressHydrated();
  const steps = useProgress((s) => s.teardownSteps[slug]);
  const resetTeardown = useProgress((s) => s.resetTeardown);
  const { done, total, complete, pct } = teardownCompletion(
    { visitedParts: {}, learnedParts: {}, quizScores: {}, teardownSteps: { [slug]: steps ?? [] } },
    slug,
    stepIds,
  );

  return (
    <div
      className="flex min-w-48 flex-1 items-center gap-3 text-sm"
      data-testid="teardown-progress"
    >
      <div className="flex-1">
        <p aria-live="polite">
          {!hydrated
            ? "Loading your progress…"
            : complete
              ? "All steps done. Nice work!"
              : `${done} of ${total} steps done`}
        </p>
        <div
          className="mt-1 h-2 overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-label="Guide progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
        >
          <div
            className="h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      </div>
      {hydrated && done > 0 && (
        <button
          type="button"
          onClick={() => resetTeardown(slug)}
          className="min-h-10 rounded-full border border-border px-3 hover:bg-surface-2"
        >
          Reset
        </button>
      )}
    </div>
  );
}
