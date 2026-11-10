"use client";

import { useEffect } from "react";
import { useProgress } from "@/lib/progress";
import { useProgressHydrated } from "./useProgressHydrated";

/** Records a visit to a part page and offers a "Mark as learned" toggle. */
export function PartProgress({ partId }: { partId: string }) {
  const hydrated = useProgressHydrated();
  const learned = useProgress((s) => Boolean(s.learnedParts[partId]));
  const visitPart = useProgress((s) => s.visitPart);
  const setPartLearned = useProgress((s) => s.setPartLearned);

  useEffect(() => {
    if (hydrated) visitPart(partId);
  }, [hydrated, partId, visitPart]);

  return (
    <button
      type="button"
      aria-pressed={learned}
      disabled={!hydrated}
      onClick={() => setPartLearned(partId, !learned)}
      data-testid="mark-learned"
      className={
        "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold disabled:opacity-60 " +
        (learned
          ? "border-accent bg-accent text-accent-fg"
          : "border-border bg-surface hover:bg-surface-2")
      }
    >
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        {learned ? <path d="M5 12l5 5L20 7" /> : <path d="M12 5v14M5 12h14" />}
      </svg>
      {learned ? "Learned" : "Mark as learned"}
    </button>
  );
}
