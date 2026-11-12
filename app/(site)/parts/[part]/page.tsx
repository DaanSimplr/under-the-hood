import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DiagramFocus } from "@/components/diagram/DiagramFocus";
import { ExplodedView } from "@/components/diagram/ExplodedView";
import { GlossaryText } from "@/components/lesson/GlossaryText";
import { DifficultyBadge, ToolList } from "@/components/lesson/lesson";
import { MediaSlot } from "@/components/media/MediaSlot";
import { PartProgress } from "@/components/progress/PartProgress";
import { Container } from "@/components/ui/Container";
import {
  Breadcrumbs,
  BulletList,
  ButtonLink,
  SectionHeading,
  SystemChip,
} from "@/components/ui/primitives";
import { assemblyForPart } from "@/lib/assemblies";
import { getConnectedPartIds, getPart, getParts, getSystem, getTeardown } from "@/lib/content";

type Props = { params: Promise<{ part: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getParts().map((p) => ({ part: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { part } = await params;
  const p = getPart(part);
  return p ? { title: p.name, description: p.summary } : {};
}

export default async function PartPage({ params }: Props) {
  const { part } = await params;
  const p = getPart(part);
  if (!p) notFound();
  const system = getSystem(p.systemId)!;
  const connected = getConnectedPartIds(p.id)
    .map((id) => getPart(id))
    .filter((x) => x !== undefined);
  const guides = p.relatedTeardowns.map((slug) => getTeardown(slug)).filter((t) => t !== undefined);
  const assembly = assemblyForPart(p.id);
  const seen = new Set<string>();

  return (
    <Container className="py-10">
      <Breadcrumbs
        items={[
          { href: "/systems/", label: "Systems" },
          { href: `/systems/${system.id}/`, label: system.name },
          { label: p.name },
        ]}
      />

      <header className="mt-4 grid items-center gap-8 lg:grid-cols-2">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <SystemChip systemId={system.id} name={system.name} />
            <DifficultyBadge level={p.removalDifficulty} label="Removal difficulty" />
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{p.name}</h1>
          {p.aka.length > 0 && (
            <p className="mt-1 text-muted">
              Also called: <span className="text-fg">{p.aka.join(", ")}</span>
            </p>
          )}
          <p className="mt-4 text-lg">
            <GlossaryText text={p.summary} partId={p.id} seen={seen} />
          </p>
          <div className="mt-4">
            <PartProgress partId={p.id} />
          </div>
        </div>
        <MediaSlot
          id={p.heroSlot}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="rounded-card border border-border"
        />
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-10">
          <section aria-labelledby="what-heading">
            <SectionHeading id="what-heading">What it does</SectionHeading>
            <p className="mt-3 leading-relaxed">
              <GlossaryText text={p.whatItDoes} partId={p.id} seen={seen} />
            </p>
          </section>

          <section aria-labelledby="how-heading">
            <SectionHeading id="how-heading">How it works</SectionHeading>
            <p className="mt-3 leading-relaxed">
              <GlossaryText text={p.howItWorks} partId={p.id} seen={seen} />
            </p>
          </section>

          <section aria-labelledby="where-heading">
            <SectionHeading id="where-heading">Where it sits</SectionHeading>
            <div className="mt-3">
              <DiagramFocus part={p.id} />
            </div>
          </section>

          {assembly && (
            <section aria-labelledby="exploded-heading">
              <SectionHeading id="exploded-heading">How it comes apart</SectionHeading>
              <div className="mt-3">
                <ExplodedView assembly={assembly} highlight={p.id} />
              </div>
            </section>
          )}

          <section aria-labelledby="symptoms-heading">
            <SectionHeading id="symptoms-heading">Signs it is failing</SectionHeading>
            <BulletList
              className="mt-3"
              items={p.failureSymptoms.map((s) => (
                <GlossaryText key={s} text={s} partId={p.id} seen={seen} />
              ))}
            />
          </section>
        </div>

        <aside className="space-y-6" aria-label="Working on this part">
          <section
            className="rounded-card border border-border bg-surface p-5"
            aria-labelledby="connects-heading"
          >
            <SectionHeading id="connects-heading" level="h3">
              Connects to
            </SectionHeading>
            <ul className="mt-3 space-y-1.5">
              {connected.map((c) => (
                <li key={c.id}>
                  <Link className="prose-link" href={`/parts/${c.id}/`}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="rounded-card border border-border bg-surface p-5"
            aria-labelledby="tools-heading"
          >
            <SectionHeading id="tools-heading" level="h3">
              Tools you would need
            </SectionHeading>
            <div className="mt-3">
              <ToolList tools={p.toolsNeeded} />
            </div>
          </section>

          <section
            className="rounded-card border-l-4 border-warn-border bg-warn-bg p-5 text-warn-fg"
            aria-labelledby="safety-heading"
          >
            <SectionHeading id="safety-heading" level="h3">
              Safety
            </SectionHeading>
            <BulletList className="mt-3 text-sm" items={p.safetyNotes} />
          </section>

          {guides.length > 0 && (
            <section
              className="rounded-card border border-border bg-surface p-5"
              aria-labelledby="guides-heading"
            >
              <SectionHeading id="guides-heading" level="h3">
                Step-by-step guides
              </SectionHeading>
              <ul className="mt-3 space-y-1.5">
                {guides.map((t) => (
                  <li key={t.slug}>
                    <Link className="prose-link" href={`/teardowns/${t.slug}/`}>
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ButtonLink href={`/quiz/${system.id}/`} variant="secondary" className="w-full">
            Quiz: {system.name}
          </ButtonLink>
        </aside>
      </div>
    </Container>
  );
}
