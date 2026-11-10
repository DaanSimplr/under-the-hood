import type { Metadata } from "next";
import { QuizBest } from "@/components/progress/QuizBest";
import { Container } from "@/components/ui/Container";
import { LinkCard, SystemChip } from "@/components/ui/primitives";
import { getQuizzes, getSystems } from "@/lib/content";

export const metadata: Metadata = {
  title: "Quizzes",
  description: "A short quiz for every car system.",
};

export default function QuizIndexPage() {
  const quizzes = getQuizzes();
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Quizzes</h1>
      <p className="mt-3 max-w-prose text-lg text-muted">
        Check what you have learned. Each quiz has a few questions with an explanation for every
        answer.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {getSystems().map((s) => {
          const quiz = quizzes.find((q) => q.systemId === s.id);
          if (!quiz) return null;
          return (
            <li key={s.id} className="flex">
              <LinkCard
                href={`/quiz/${s.id}/`}
                title={s.name}
                headingLevel="h2"
                className="w-full"
                eyebrow={<SystemChip systemId={s.id} name={`${quiz.questions.length} questions`} />}
              >
                <QuizBest systemId={s.id} />
              </LinkCard>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}
