import Link from "next/link";
import { MediaSlot } from "@/components/media/MediaSlot";
import { Container } from "@/components/ui/Container";
import { ButtonLink, LinkCard, SectionHeading } from "@/components/ui/primitives";
import { getParts, getSystems, getTeardowns } from "@/lib/content";
import { systemColor } from "@/lib/systems";

const entryPoints = [
  {
    href: "/explorer/",
    title: "Explore the car",
    body: "Click any part on an interactive diagram to see what it does and what it connects to.",
    icon: "M3 13l2-5h14l2 5v5h-3m-12 0H3v-5m3 5a2 2 0 1 0 4 0 2 2 0 0 0-4 0m8 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0",
  },
  {
    href: "/systems/",
    title: "Learn the systems",
    body: "Engine, brakes, cooling and more: how each system works and which parts belong to it.",
    icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  },
  {
    href: "/teardowns/",
    title: "Follow a teardown",
    body: "Step-by-step guides with tools, safety checks and a diagram for each step.",
    icon: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z",
  },
  {
    href: "/quiz/",
    title: "Test yourself",
    body: "A short quiz for every system. Your best scores are saved on this device.",
    icon: "M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V14m0 4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  },
];

export default function HomePage() {
  const systems = getSystems();
  const partCount = getParts().length;
  const guideCount = getTeardowns().length;

  return (
    <>
      <section className="relative isolate flex min-h-[32rem] items-center overflow-hidden border-b border-border sm:min-h-[36rem]">
        <div className="absolute inset-0 -z-10">
          <MediaSlot id="home-hero-loop" fill priority />
        </div>
        <Container className="py-12">
          <div className="max-w-xl rounded-card bg-bg/90 p-6 shadow-sm backdrop-blur-sm sm:p-8">
            <p className="text-sm font-semibold tracking-wide text-accent uppercase">
              Cars, from the inside out
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              See how a car fits together, and how it comes apart.
            </h1>
            <p className="mt-4 text-lg text-muted">
              Plain-language lessons on {partCount} parts across {systems.length} systems, with
              interactive diagrams and {guideCount} step-by-step teardown guides.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/explorer/">Explore the car</ButtonLink>
              <ButtonLink href="/systems/" variant="secondary">
                Browse systems
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <Container as="section" className="py-14">
        <h2 className="sr-only">Where to start</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {entryPoints.map((e) => (
            <li key={e.href} className="flex">
              <LinkCard
                href={e.href}
                title={e.title}
                className="w-full"
                eyebrow={<EntryIcon d={e.icon} />}
              >
                {e.body}
              </LinkCard>
            </li>
          ))}
        </ul>
      </Container>

      <Container as="section" className="pb-6">
        <SectionHeading>The eight systems</SectionHeading>
        <p className="mt-2 max-w-prose text-muted">
          Every car, petrol, diesel or electric, is built from the same families of parts. Pick one
          to start.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {systems.map((s) => (
            <li key={s.id}>
              <Link
                href={`/systems/${s.id}/`}
                className="flex min-h-14 items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 font-medium hover:bg-surface-2"
              >
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: systemColor(s.id) }}
                />
                {s.name}
                <span className="ml-auto text-sm text-muted">{s.partIds.length} parts</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}

function EntryIcon({ d }: { d: string }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-accent">
      <svg
        aria-hidden="true"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={d} />
      </svg>
    </span>
  );
}
