"use client";

import Link from "next/link";
import { useState } from "react";
import { summarize, teardownCompletion, useProgress } from "@/lib/progress";
import { systemColor } from "@/lib/systems";
import { useProgressHydrated } from "./useProgressHydrated";

type Totals = {
  systems: Array<{ id: string; name: string; partIds: string[]; quizQuestions: number }>;
  parts: Array<{ id: string; name: string; systemId: string }>;
  teardowns: Array<{ slug: string; title: string; stepIds: string[] }>;
};

function Stat({ label, value, of }: { label: string; value: number; of: number }) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold">
        {value}
        <span className="text-lg font-medium text-muted"> / {of}</span>
      </p>
    </div>
  );
}

/** Everything saved on this device: parts learned, guides done, quiz scores. */
export function ProgressDashboard({ totals }: { totals: Totals }) {
  const hydrated = useProgressHydrated();
  const state = useProgress();
  const [confirming, setConfirming] = useState(false);

  if (!hydrated) return <p className="text-muted">Loading your progress…</p>;

  const summary = summarize(state, {
    partIds: totals.parts.map((p) => p.id),
    teardowns: totals.teardowns,
    systemIds: totals.systems.map((s) => s.id),
  });

  return (
    <div className="space-y-12" data-testid="progress-dashboard">
      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Parts learned" value={summary.learned} of={totals.parts.length} />
        <Stat label="Parts visited" value={summary.visited} of={totals.parts.length} />
        <Stat label="Guides completed" value={summary.guidesDone} of={totals.teardowns.length} />
        <Stat label="Quizzes taken" value={summary.quizzesTaken} of={totals.systems.length} />
      </section>

      <section aria-labelledby="by-system">
        <h2 id="by-system" className="text-2xl font-bold tracking-tight">
          By system
        </h2>
        <div className="mt-4 overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  System
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Parts learned
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Quiz best
                </th>
              </tr>
            </thead>
            <tbody>
              {totals.systems.map((s) => {
                const learned = s.partIds.filter((id) => state.learnedParts[id]).length;
                const quiz = state.quizScores[s.id];
                return (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <th scope="row" className="px-4 py-3 font-medium">
                      <Link
                        href={`/systems/${s.id}/`}
                        className="prose-link inline-flex items-center gap-2"
                      >
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: systemColor(s.id) }}
                        />
                        {s.name}
                      </Link>
                    </th>
                    <td className="px-4 py-3">
                      {learned} / {s.partIds.length}
                    </td>
                    <td className="px-4 py-3">
                      {quiz ? (
                        `${quiz.best} / ${quiz.total}`
                      ) : (
                        <Link href={`/quiz/${s.id}/`} className="prose-link">
                          Take quiz
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="guides">
        <h2 id="guides" className="text-2xl font-bold tracking-tight">
          Teardown guides
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {totals.teardowns.map((t) => {
            const c = teardownCompletion(state, t.slug, t.stepIds);
            return (
              <li key={t.slug} className="rounded-card border border-border bg-surface p-4">
                <Link href={`/teardowns/${t.slug}/`} className="prose-link font-semibold">
                  {t.title}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  {c.complete ? "Completed" : `${c.done} of ${c.total} steps done`}
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-border" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${c.pct * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="reset" className="rounded-card border border-border bg-surface p-5">
        <h2 id="reset" className="text-lg font-semibold">
          Start over
        </h2>
        <p className="mt-1 text-sm text-muted">
          Progress is stored only in this browser. Clearing it cannot be undone.
        </p>
        {confirming ? (
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Confirm reset">
            <button
              type="button"
              onClick={() => {
                state.resetAll();
                setConfirming(false);
              }}
              className="min-h-10 rounded-full bg-danger-border px-4 text-sm font-semibold text-white"
            >
              Yes, clear my progress
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => setConfirming(false)}
              className="min-h-10 rounded-full border border-border px-4 text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-3 min-h-10 rounded-full border border-border px-4 text-sm hover:bg-surface-2"
          >
            Clear all progress
          </button>
        )}
      </section>
    </div>
  );
}
