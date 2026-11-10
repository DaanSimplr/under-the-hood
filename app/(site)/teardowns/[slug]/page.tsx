import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SafetyCallout, ToolList, DifficultyBadge } from "@/components/lesson/lesson";
import { teardownComponents } from "@/components/lesson/mdxComponents";
import { StartGuide } from "@/components/media/StartGuide";
import { toClientSlot } from "@/components/media/toClientSlot";
import { TeardownProgress } from "@/components/progress/TeardownProgress";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { Breadcrumbs, SectionHeading, SystemChip } from "@/components/ui/primitives";
import { resolveSlot } from "@/lib/assets";
import { getPart, getSystem, getTeardown, getTeardowns } from "@/lib/content";
import { renderMdx } from "@/lib/mdx";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getTeardowns().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = getTeardown(slug);
  return t ? { title: t.title, description: t.summary } : {};
}

export default async function TeardownPage({ params }: Props) {
  const { slug } = await params;
  const t = getTeardown(slug);
  if (!t) notFound();
  const system = getSystem(t.systemId)!;
  const parts = t.partIds.map((id) => getPart(id)!).filter(Boolean);
  const body = await renderMdx(t.body, teardownComponents(t.slug, t.stepIds));
  const transition = resolveSlot("teardown-intro-transition");

  return (
    <>
      <PageHero
        slotId={t.heroSlot ?? "workshop-ambient-loop"}
        title={t.title}
        eyebrow={
          <Breadcrumbs items={[{ href: "/teardowns/", label: "Teardowns" }, { label: t.title }]} />
        }
      >
        <p>{t.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <SystemChip systemId={system.id} name={system.name} />
          <DifficultyBadge level={t.difficulty} />
          <span className="rounded-full border border-border bg-surface px-3 py-1">
            <span className="sr-only">Time needed: </span>
            {t.timeEstimate}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <StartGuide
            transition={toClientSlot(transition)}
            available={transition.available}
            previewPlaceholder={process.env.NODE_ENV === "development"}
            targetId="steps-heading"
          />
          <TeardownProgress slug={t.slug} stepIds={t.stepIds} />
        </div>
      </PageHero>

      <Container className="py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-12">
            <section aria-labelledby="safety-heading">
              <SectionHeading id="safety-heading">Before you start: safety</SectionHeading>
              <p className="mt-2 text-muted">
                Read all of these first. Stop if anything on your car looks different from the
                guide.
              </p>
              <div data-testid="safety-callouts">
                {t.safety.map((s) => (
                  <SafetyCallout key={s.topic} topic={s.topic} note={s.note} />
                ))}
              </div>
            </section>

            <section aria-labelledby="steps-heading">
              <h2
                id="steps-heading"
                tabIndex={-1}
                className="scroll-mt-24 text-2xl font-bold tracking-tight outline-none"
              >
                Steps
              </h2>
              <div className="mt-5 space-y-5 leading-relaxed">{body}</div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start" aria-label="Guide details">
            <section
              className="rounded-card border border-border bg-surface p-5"
              aria-labelledby="tools-heading"
            >
              <SectionHeading id="tools-heading" level="h3">
                Tools
              </SectionHeading>
              <div className="mt-3">
                <ToolList tools={t.tools} />
              </div>
            </section>
            <section
              className="rounded-card border border-border bg-surface p-5"
              aria-labelledby="parts-heading"
            >
              <SectionHeading id="parts-heading" level="h3">
                Parts involved
              </SectionHeading>
              <ul className="mt-3 space-y-1.5">
                {parts.map((p) => (
                  <li key={p.id}>
                    <Link className="prose-link" href={`/parts/${p.id}/`}>
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </Container>
    </>
  );
}
