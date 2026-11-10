/**
 * Site search. The index is built once at build time (app/search-index.json)
 * and parsed in the browser, so no indexing work happens on the client.
 */
import Fuse, { type FuseIndex, type IFuseOptions } from "fuse.js";

export type SearchDocType = "part" | "system" | "teardown" | "glossary";

export type SearchDoc = {
  id: string;
  type: SearchDocType;
  title: string;
  aka: string[];
  text: string;
  url: string;
};

export type SearchPayload = {
  docs: SearchDoc[];
  index: ReturnType<FuseIndex<SearchDoc>["toJSON"]>;
};

export const SEARCH_OPTIONS: IFuseOptions<SearchDoc> = {
  keys: [
    { name: "title", weight: 3 },
    { name: "aka", weight: 2 },
    { name: "text", weight: 1 },
  ],
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

type ContentLike = {
  systems: Array<{ id: string; name: string; summary: string }>;
  parts: Array<{ id: string; name: string; aka: string[]; summary: string; whatItDoes: string }>;
  teardowns: Array<{ slug: string; title: string; summary: string }>;
  glossary: Array<{ id: string; term: string; aka: string[]; definition: string }>;
};

export function buildSearchDocs(c: ContentLike): SearchDoc[] {
  return [
    ...c.parts.map((p) => ({
      id: `part:${p.id}`,
      type: "part" as const,
      title: p.name,
      aka: p.aka,
      text: `${p.summary} ${p.whatItDoes}`,
      url: `/parts/${p.id}/`,
    })),
    ...c.systems.map((s) => ({
      id: `system:${s.id}`,
      type: "system" as const,
      title: s.name,
      aka: [],
      text: s.summary,
      url: `/systems/${s.id}/`,
    })),
    ...c.teardowns.map((t) => ({
      id: `teardown:${t.slug}`,
      type: "teardown" as const,
      title: t.title,
      aka: [],
      text: t.summary,
      url: `/teardowns/${t.slug}/`,
    })),
    ...c.glossary.map((g) => ({
      id: `glossary:${g.id}`,
      type: "glossary" as const,
      title: g.term,
      aka: g.aka,
      text: g.definition,
      url: `/glossary/#${g.id}`,
    })),
  ];
}

export function buildSearchPayload(c: ContentLike): SearchPayload {
  const docs = buildSearchDocs(c);
  const index = Fuse.createIndex(SEARCH_OPTIONS.keys!, docs).toJSON();
  return { docs, index };
}

/** Recreates the searcher from the prebuilt payload (browser side). */
export function searcherFromPayload(payload: SearchPayload) {
  const index = Fuse.parseIndex<SearchDoc>(payload.index);
  return new Fuse(payload.docs, SEARCH_OPTIONS, index);
}

export const TYPE_LABELS: Record<SearchDocType, string> = {
  part: "Part",
  system: "System",
  teardown: "Guide",
  glossary: "Glossary",
};
