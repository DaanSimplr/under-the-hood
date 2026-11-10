import type { Metadata } from "next";
import { MediaSlot } from "@/components/media/MediaSlot";
import { Container } from "@/components/ui/Container";
import { LinkCard, SystemChip } from "@/components/ui/primitives";
import { getSystems } from "@/lib/content";

export const metadata: Metadata = {
  title: "Car systems",
  description: "The eight systems every car is built from, and the parts in each.",
};

export default function SystemsPage() {
  const systems = getSystems();
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Car systems</h1>
      <p className="mt-3 max-w-prose text-lg text-muted">
        A car is a set of systems that work together. Each one has a job, a handful of key parts,
        and a few things that commonly go wrong.
      </p>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="systems-grid">
        {systems.map((s) => (
          <li key={s.id} className="flex">
            <LinkCard
              href={`/systems/${s.id}/`}
              title={s.name}
              headingLevel="h2"
              className="w-full"
              media={
                <MediaSlot
                  id={s.heroSlot}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              }
              eyebrow={<SystemChip systemId={s.id} name={`${s.partIds.length} parts`} />}
            >
              {s.summary}
            </LinkCard>
          </li>
        ))}
      </ul>
    </Container>
  );
}
