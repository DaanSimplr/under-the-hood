/**
 * Finds glossary terms inside plain text so pages can link jargon to the
 * glossary. Pure functions: easy to test, safe on server and client.
 */

export type GlossaryLike = {
  id: string;
  term: string;
  aka: string[];
  definition: string;
  partId?: string;
};

export type GlossarySegment =
  { kind: "text"; text: string } | { kind: "term"; text: string; id: string; definition: string };

export type GlossaryMatcher = {
  regex: RegExp;
  byPhrase: Map<string, GlossaryLike>;
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Builds one regex for all terms and their aliases, longest first so "brake fluid" beats "brake". */
export function buildGlossaryMatcher(entries: GlossaryLike[]): GlossaryMatcher {
  const byPhrase = new Map<string, GlossaryLike>();
  for (const e of entries) {
    for (const phrase of [e.term, ...e.aka]) {
      const key = phrase.toLowerCase();
      if (!byPhrase.has(key)) byPhrase.set(key, e);
    }
  }
  const phrases = [...byPhrase.keys()].sort((a, b) => b.length - a.length).map(escapeRe);
  // Phrase in group 1; an optional plural "s"/"es" after it. Not inside other words.
  const regex = new RegExp(`(?<![\\w-])(${phrases.join("|")})(?:es|s)?(?![\\w-])`, "gi");
  return { regex, byPhrase };
}

export type LinkifyOptions = {
  /** Glossary ids that should not be linked (e.g. the term for the page you are on). */
  exclude?: Set<string>;
  /** Ids already linked earlier in the same block. Mutated: matched ids are added. */
  seen?: Set<string>;
};

/** Splits text into plain and glossary segments. Only the first use of each term is linked. */
export function linkifyGlossary(
  text: string,
  matcher: GlossaryMatcher,
  { exclude = new Set(), seen = new Set() }: LinkifyOptions = {},
): GlossarySegment[] {
  const out: GlossarySegment[] = [];
  let last = 0;
  matcher.regex.lastIndex = 0;
  for (const m of text.matchAll(matcher.regex)) {
    const entry = matcher.byPhrase.get((m[1] ?? "").toLowerCase());
    if (!entry || exclude.has(entry.id) || seen.has(entry.id)) continue;
    seen.add(entry.id);
    const start = m.index ?? 0;
    if (start > last) out.push({ kind: "text", text: text.slice(last, start) });
    out.push({ kind: "term", text: m[0], id: entry.id, definition: entry.definition });
    last = start + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}
