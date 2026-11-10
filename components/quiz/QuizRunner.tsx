"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useProgress } from "@/lib/progress";
import { isCorrect, scoreAnswers, scoreMessage } from "@/lib/quiz";
import type { QuizQuestion } from "@/lib/schemas";
import { QuestionCard } from "./QuestionCard";

/** Runs a quiz one question at a time and saves the score to the progress store. */
export function QuizRunner({
  systemId,
  systemName,
  questions,
  partNames,
}: {
  systemId: string;
  systemName: string;
  questions: QuizQuestion[];
  partNames: Record<string, string>;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(() => questions.map(() => null));
  const [checked, setChecked] = useState(false);
  const [finished, setFinished] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const recordQuiz = useProgress((s) => s.recordQuiz);
  const best = useProgress((s) => s.quizScores[systemId]);
  const moved = useRef(false);

  useEffect(() => {
    if (!moved.current) return;
    (finished ? resultRef : headingRef).current?.focus();
  }, [index, finished]);

  const q = questions[index]!;
  const choice = answers[index] ?? null;
  const last = index === questions.length - 1;
  const score = scoreAnswers(questions, answers);

  function check() {
    if (choice === null) return;
    setChecked(true);
  }

  function next() {
    moved.current = true;
    if (last) {
      recordQuiz(systemId, score.correct, score.total);
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setChecked(false);
    }
  }

  function restart() {
    moved.current = true;
    setAnswers(questions.map(() => null));
    setIndex(0);
    setChecked(false);
    setFinished(false);
  }

  if (finished) {
    return (
      <div className="space-y-6" data-testid="quiz-result">
        <div className="rounded-card border border-border bg-surface p-6">
          <h2 ref={resultRef} tabIndex={-1} className="text-2xl font-bold outline-none">
            You scored {score.correct} out of {score.total}
          </h2>
          <p className="mt-2 text-muted">{scoreMessage(score.correct, score.total)}</p>
          {best && (
            <p className="mt-2 text-sm">
              Best score: {best.best}/{best.total} · Attempts: {best.attempts}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={restart}
              className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg hover:opacity-90"
            >
              Try again
            </button>
            <Link
              href={`/systems/${systemId}/`}
              className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold hover:bg-surface-2"
            >
              Back to {systemName.toLowerCase()}
            </Link>
          </div>
        </div>

        <section aria-labelledby="review-heading">
          <h3 id="review-heading" className="text-lg font-semibold">
            Review
          </h3>
          <ol className="mt-3 space-y-3">
            {questions.map((qq, i) => {
              const ok = isCorrect(qq, answers[i] ?? null);
              return (
                <li key={i} className="rounded-lg border border-border bg-surface p-4">
                  <p className="font-medium">
                    <span className={ok ? "text-green-700 dark:text-green-400" : "text-danger-fg"}>
                      {ok ? "✓ Correct" : "✗ Missed"}
                    </span>
                    {" · "}
                    {qq.prompt}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Answer: {qq.options[qq.answerIndex]}. {qq.explanation}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="quiz-runner">
      <div
        className="h-2 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-valuenow={index + (checked ? 1 : 0)}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${((index + (checked ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <QuestionCard
        key={index}
        ref={headingRef}
        index={index}
        total={questions.length}
        question={q}
        choice={choice}
        checked={checked}
        part={q.partId ? { id: q.partId, name: partNames[q.partId] ?? q.partId } : undefined}
        onChoose={(i) => setAnswers((a) => a.map((v, j) => (j === index ? i : v)))}
      />

      <button
        type="button"
        onClick={checked ? next : check}
        disabled={!checked && choice === null}
        className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {!checked ? "Check answer" : last ? "See results" : "Next question"}
      </button>
    </div>
  );
}
