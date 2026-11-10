"use client";

import Link from "next/link";
import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";
import type { QuizQuestion } from "@/lib/schemas";

/** One multiple-choice question: a radio group, then feedback once checked. */
export const QuestionCard = forwardRef<
  HTMLHeadingElement,
  {
    index: number;
    total: number;
    question: QuizQuestion;
    choice: number | null;
    checked: boolean;
    part?: { id: string; name: string };
    onChoose: (i: number) => void;
  }
>(function QuestionCard({ index, total, question, choice, checked, part, onChoose }, headingRef) {
  const uid = useId();
  const correct = checked && choice === question.answerIndex;

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-muted">
        Question {index + 1} of {total}
      </p>
      <fieldset aria-describedby={checked ? `${uid}-feedback` : undefined}>
        <legend className="w-full">
          <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold outline-none sm:text-2xl">
            {question.prompt}
          </h2>
        </legend>
        <div className="mt-4 space-y-2">
          {question.options.map((opt, i) => {
            const isAnswer = i === question.answerIndex;
            const isChoice = i === choice;
            return (
              <label
                key={i}
                className={cn(
                  "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-2",
                  !checked && "border-border hover:bg-surface-2 has-[:checked]:border-accent",
                  checked &&
                    isAnswer &&
                    "border-green-700 bg-green-50 dark:border-green-400 dark:bg-green-950",
                  checked && isChoice && !isAnswer && "border-danger-border bg-danger-bg",
                  checked && !isAnswer && !isChoice && "border-border opacity-70",
                )}
              >
                <input
                  type="radio"
                  name={`${uid}-q`}
                  value={i}
                  checked={isChoice}
                  disabled={checked}
                  onChange={() => onChoose(i)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                <span className="flex-1">{opt}</span>
                {checked && isAnswer && (
                  <span className="text-sm font-semibold">Correct answer</span>
                )}
                {checked && isChoice && !isAnswer && (
                  <span className="text-sm font-semibold">Your answer</span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div id={`${uid}-feedback`} aria-live="polite">
        {checked && (
          <div
            className={cn(
              "rounded-card border-l-4 p-4",
              correct
                ? "border-green-700 bg-green-50 dark:border-green-400 dark:bg-green-950"
                : "border-danger-border bg-danger-bg text-danger-fg",
            )}
          >
            <p className="font-semibold">{correct ? "Correct!" : "Not quite."}</p>
            <p className="mt-1">{question.explanation}</p>
            {part && (
              <p className="mt-2 text-sm">
                <Link className="prose-link font-medium" href={`/parts/${part.id}/`}>
                  Read about the {part.name.toLowerCase()}
                </Link>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
