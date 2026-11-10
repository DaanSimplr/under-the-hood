import Link from "next/link";
import { getGlossary } from "@/lib/content";
import { buildGlossaryMatcher, linkifyGlossary, type GlossaryMatcher } from "@/lib/glossary";

let matcher: GlossaryMatcher | null = null;
function getMatcher() {
  matcher ??= buildGlossaryMatcher(getGlossary());
  return matcher;
}

/** Glossary ids that describe this part, so a part page does not link to itself. */
function idsForPart(partId?: string): Set<string> {
  if (!partId) return new Set();
  return new Set(
    getGlossary()
      .filter((g) => g.partId === partId)
      .map((g) => g.id),
  );
}

/**
 * Renders plain text with the first use of each glossary term linked to the
 * glossary. Pass a shared `seen` set to link each term once across several blocks.
 */
export function GlossaryText({
  text,
  partId,
  seen,
}: {
  text: string;
  partId?: string;
  seen?: Set<string>;
}) {
  const segments = linkifyGlossary(text, getMatcher(), { exclude: idsForPart(partId), seen });
  return (
    <>
      {segments.map((s, i) =>
        s.kind === "text" ? (
          s.text
        ) : (
          <Link key={i} href={`/glossary/#${s.id}`} className="term-link" title={s.definition}>
            {s.text}
          </Link>
        ),
      )}
    </>
  );
}
