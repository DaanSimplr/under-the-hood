import type { Metadata } from "next";
import { ProgressDashboard } from "@/components/progress/ProgressDashboard";
import { Container } from "@/components/ui/Container";
import { getParts, getQuizzes, getSystems, getTeardowns } from "@/lib/content";

export const metadata: Metadata = {
  title: "Your progress",
  description: "Parts learned, guides completed and quiz scores, saved on this device.",
};

export default function ProgressPage() {
  const quizzes = getQuizzes();
  const totals = {
    systems: getSystems().map((s) => ({
      id: s.id,
      name: s.name,
      partIds: s.partIds,
      quizQuestions: quizzes.find((q) => q.systemId === s.id)?.questions.length ?? 0,
    })),
    parts: getParts().map((p) => ({ id: p.id, name: p.name, systemId: p.systemId })),
    teardowns: getTeardowns().map((t) => ({ slug: t.slug, title: t.title, stepIds: t.stepIds })),
  };

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your progress</h1>
      <p className="mt-3 max-w-prose text-lg text-muted">
        Saved in this browser only. Mark parts as learned, tick off guide steps and take the quizzes
        to fill it in.
      </p>
      <div className="mt-8">
        <ProgressDashboard totals={totals} />
      </div>
    </Container>
  );
}
