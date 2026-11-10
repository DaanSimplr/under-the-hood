"use client";

import { useId } from "react";
import { useProgress } from "@/lib/progress";

/** "Done" checkbox on a teardown step. */
export function StepDoneToggle({
  slug,
  stepId,
  title,
}: {
  slug: string;
  stepId: string;
  title: string;
}) {
  const id = useId();
  const done = useProgress((s) => s.teardownSteps[slug]?.includes(stepId) ?? false);
  const setStepDone = useProgress((s) => s.setStepDone);

  return (
    <label
      htmlFor={id}
      className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-border px-3 text-sm font-medium has-[:checked]:border-accent has-[:checked]:bg-surface-2"
    >
      <input
        id={id}
        type="checkbox"
        checked={done}
        onChange={(e) => setStepDone(slug, stepId, e.target.checked)}
        className="h-4 w-4 accent-[var(--accent)]"
        data-step-toggle={stepId}
      />
      Done
      <span className="sr-only">: {title}</span>
    </label>
  );
}
