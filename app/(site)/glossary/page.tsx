import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getGlossary, getPart } from "@/lib/content";

export const metadata: Metadata = {
  title: "Glossary",
  description: "Plain-language explanations of the car terms used on this site.",
};

export default function GlossaryPage() {
  const entries = getGlossary();
  const letters = [...new Set(entries.map((e) => e.term[0]!.toUpperCase()))];

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Glossary</h1>
      <p className="mt-3 max-w-prose text-lg text-muted">
        Car words in plain language. Terms with a dotted underline anywhere on the site link here.
      </p>

      <nav aria-label="Jump to letter" className="mt-6">
        <ul className="flex flex-wrap gap-1.5">
          {letters.map((l) => (
            <li key={l}>
              <a
                href={`#letter-${l}`}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface font-semibold hover:bg-surface-2"
              >
                {l}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 space-y-10">
        {letters.map((letter) => (
          <section key={letter} aria-labelledby={`letter-${letter}`}>
            <h2
              id={`letter-${letter}`}
              className="scroll-mt-24 border-b border-border pb-1 text-2xl font-bold"
            >
              {letter}
            </h2>
            <dl className="mt-4 space-y-5">
              {entries
                .filter((e) => e.term[0]!.toUpperCase() === letter)
                .map((e) => {
                  const part = e.partId ? getPart(e.partId) : undefined;
                  return (
                    <div
                      key={e.id}
                      id={e.id}
                      className="scroll-mt-24 rounded-card target:ring-[3px] target:ring-focus"
                    >
                      <dt className="text-lg font-semibold">
                        {e.term}
                        {e.aka.length > 0 && (
                          <span className="ml-2 text-sm font-normal text-muted">
                            also: {e.aka.join(", ")}
                          </span>
                        )}
                      </dt>
                      <dd className="mt-1 max-w-prose leading-relaxed">
                        {e.definition}
                        {part && (
                          <>
                            {" "}
                            <Link className="prose-link font-medium" href={`/parts/${part.id}/`}>
                              Learn about the {part.name.toLowerCase()}
                            </Link>
                          </>
                        )}
                      </dd>
                    </div>
                  );
                })}
            </dl>
          </section>
        ))}
      </div>
    </Container>
  );
}
