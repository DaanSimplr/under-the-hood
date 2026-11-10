"use client";

import { useProgress } from "@/lib/progress";
import { useProgressHydrated } from "./useProgressHydrated";

export function QuizBest({ systemId }: { systemId: string }) {
  const hydrated = useProgressHydrated();
  const score = useProgress((s) => s.quizScores[systemId]);
  if (!hydrated) return <span>&nbsp;</span>;
  return <span>{score ? `Best: ${score.best}/${score.total}` : "Not taken yet"}</span>;
}
