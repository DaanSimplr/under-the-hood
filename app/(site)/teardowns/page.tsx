import type { Metadata } from "next";
import { DifficultyBadge } from "@/components/lesson/lesson";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { LinkCard, SystemChip } from "@/components/ui/primitives";
import { getSystem, getTeardowns } from "@/lib/content";

export const metadata: Metadata = {
  title: "Teardown guides",
  description:
    "Step-by-step guides to taking car parts off and putting them back, with safety checks.",
};

export default function TeardownsPage() {
  const guides = getTeardowns();
  return (
    <>
      <PageHero slotId="workshop-ambient-loop" title="Teardown guides">
        Step-by-step jobs with the tools you need, the safety checks to make, and a diagram for each
        step. Every car is different: read along with your service manual.
      </PageHero>
      <Container className="py-12">
        <ul className="grid gap-5 sm:grid-cols-2">
          {guides.map((t) => {
            const system = getSystem(t.systemId)!;
            return (
              <li key={t.slug} className="flex">
                <LinkCard
                  href={`/teardowns/${t.slug}/`}
                  title={t.title}
                  headingLevel="h2"
                  className="w-full"
                  eyebrow={
                    <span className="flex flex-wrap gap-2 normal-case">
                      <SystemChip systemId={system.id} name={system.name} />
                      <DifficultyBadge level={t.difficulty} />
                    </span>
                  }
                >
                  <p>{t.summary}</p>
                  <p className="mt-2">
                    {t.stepIds.length} steps · {t.timeEstimate}
                  </p>
                </LinkCard>
              </li>
            );
          })}
        </ul>
      </Container>
    </>
  );
}
