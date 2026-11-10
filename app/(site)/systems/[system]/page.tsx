import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GlossaryText } from "@/components/lesson/GlossaryText";
import { DifficultyBadge } from "@/components/lesson/lesson";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import {
  Breadcrumbs,
  ButtonLink,
  LinkCard,
  SectionHeading,
  SystemChip,
} from "@/components/ui/primitives";
import { SystemDiagrams } from "@/components/diagram/SystemDiagrams";
import { getPartsForSystem, getSystem, getSystems, getTeardownsForSystem } from "@/lib/content";

type Props = { params: Promise<{ system: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getSystems().map((s) => ({ system: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { system } = await params;
  const s = getSystem(system);
  return s ? { title: s.name, description: s.summary } : {};
}

export default async function SystemPage({ params }: Props) {
  const { system } = await params;
  const s = getSystem(system);
  if (!s) notFound();
  const parts = getPartsForSystem(s.id);
  const guides = getTeardownsForSystem(s.id);
  const seen = new Set<string>();

  return (
    <>
      <PageHero
        slotId={s.heroSlot}
        title={s.name}
        eyebrow={
          <Breadcrumbs items={[{ href: "/systems/", label: "Systems" }, { label: s.name }]} />
        }
      >
        <GlossaryText text={s.summary} seen={seen} />
      </PageHero>

      <Container className="space-y-14 py-12">
        <section aria-labelledby="parts-heading">
          <SectionHeading id="parts-heading">Parts in this system</SectionHeading>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {parts.map((p) => (
              <li key={p.id} className="flex">
                <LinkCard
                  href={`/parts/${p.id}/`}
                  title={p.name}
                  className="w-full"
                  eyebrow={
                    <DifficultyBadge level={p.removalDifficulty} label="Removal difficulty" />
                  }
                >
                  {p.summary}
                </LinkCard>
              </li>
            ))}
          </ul>
        </section>

        <SystemDiagrams systemId={s.id} />

        {guides.length > 0 && (
          <section aria-labelledby="guides-heading">
            <SectionHeading id="guides-heading">Teardown guides</SectionHeading>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {guides.map((t) => (
                <li key={t.slug} className="flex">
                  <LinkCard
                    href={`/teardowns/${t.slug}/`}
                    title={t.title}
                    className="w-full"
                    eyebrow={<DifficultyBadge level={t.difficulty} />}
                  >
                    {t.summary}
                  </LinkCard>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section
          aria-labelledby="quiz-heading"
          className="rounded-card border border-border bg-surface p-6"
        >
          <SectionHeading id="quiz-heading">Check what you learned</SectionHeading>
          <p className="mt-2 text-muted">
            A short quiz on the {s.name.toLowerCase()} system.{" "}
            <SystemChip systemId={s.id} name={s.name} />
          </p>
          <ButtonLink href={`/quiz/${s.id}/`} className="mt-4">
            Take the {s.name.toLowerCase()} quiz
          </ButtonLink>
        </section>
      </Container>
    </>
  );
}
