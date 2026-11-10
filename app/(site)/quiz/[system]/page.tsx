import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/primitives";
import { getParts, getQuiz, getQuizzes, getSystem } from "@/lib/content";

type Props = { params: Promise<{ system: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getQuizzes().map((q) => ({ system: q.systemId }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { system } = await params;
  const s = getSystem(system);
  return s
    ? {
        title: `${s.name} quiz`,
        description: `Test what you know about the ${s.name.toLowerCase()} system.`,
      }
    : {};
}

export default async function QuizPage({ params }: Props) {
  const { system } = await params;
  const s = getSystem(system);
  const quiz = getQuiz(system);
  if (!s || !quiz) notFound();
  const partNames = Object.fromEntries(getParts().map((p) => [p.id, p.name]));

  return (
    <Container className="max-w-3xl py-10">
      <Breadcrumbs items={[{ href: "/quiz/", label: "Quizzes" }, { label: s.name }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight">{s.name} quiz</h1>
      <p className="mt-2 text-muted">
        {quiz.questions.length} questions. Your best score is saved on this device.
      </p>
      <div className="mt-8">
        <QuizRunner
          systemId={s.id}
          systemName={s.name}
          questions={quiz.questions}
          partNames={partNames}
        />
      </div>
    </Container>
  );
}
