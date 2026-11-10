"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { SearchDoc } from "@/lib/search";

type Searcher = { search: (q: string, opts?: { limit?: number }) => Array<{ item: SearchDoc }> };

const TYPE_LABELS: Record<SearchDoc["type"], string> = {
  part: "Part",
  system: "System",
  teardown: "Guide",
  glossary: "Glossary",
};

let searcherPromise: Promise<Searcher> | null = null;

/** Fetches the prebuilt index and Fuse.js only on first use. */
function loadSearcher(): Promise<Searcher> {
  searcherPromise ??= Promise.all([
    fetch("/search-index.json").then((r) => {
      if (!r.ok) throw new Error(`Search index failed to load (${r.status})`);
      return r.json();
    }),
    import("@/lib/search"),
  ]).then(([payload, mod]) => mod.searcherFromPayload(payload));
  searcherPromise.catch(() => {
    searcherPromise = null;
  });
  return searcherPromise;
}

/** Header search: button + modal dialog (Ctrl/⌘ K or "/"). Results are a listbox you can arrow through. */
export function SearchDialog() {
  const router = useRouter();
  const uid = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchDoc[]>([]);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const searcher = useRef<Searcher | null>(null);

  const open = useCallback(() => {
    dialogRef.current?.showModal();
    inputRef.current?.focus();
    if (!searcher.current) {
      setStatus("loading");
      loadSearcher()
        .then((s) => {
          searcher.current = s;
          setStatus("ready");
        })
        .catch(() => setStatus("error"));
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable=true]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const q = query.trim();
     
    setResults(
      q.length >= 2 && searcher.current
        ? searcher.current.search(q, { limit: 8 }).map((r) => r.item)
        : [],
    );
    setActive(0);
  }, [query, status]);

  function close() {
    dialogRef.current?.close();
  }

  function go(doc: SearchDoc | undefined) {
    if (!doc) return;
    close();
    setQuery("");
    router.push(doc.url);
  }

  const listId = `${uid}-results`;
  const optionId = (i: number) => `${uid}-opt-${i}`;
  const q = query.trim();

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Search"
        aria-keyshortcuts="Control+K /"
        data-testid="search-open"
        className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm text-muted hover:bg-surface-2"
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-border px-1.5 font-mono text-xs md:inline">
          /
        </kbd>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Search the site"
        className="m-auto mt-[10vh] w-[min(40rem,calc(100vw-2rem))] rounded-card border border-border bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/50"
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
      >
        <div className="flex items-center gap-2 border-b border-border p-3">
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-activedescendant={results.length ? optionId(active) : undefined}
            aria-autocomplete="list"
            aria-label="Search parts, systems, guides and terms"
            placeholder="Search parts, systems, guides, terms…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(results[active]);
              }
            }}
            className="min-h-10 flex-1 bg-transparent text-base outline-none"
            data-testid="search-input"
          />
          <button
            type="button"
            onClick={close}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted"
          >
            Esc
          </button>
        </div>

        <ul
          id={listId}
          role="listbox"
          aria-label="Results"
          className="max-h-[60vh] overflow-y-auto p-2"
        >
          {results.map((doc, i) => (
            <li
              key={doc.id}
              id={optionId(i)}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(doc)}
              className={
                "flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 " +
                (i === active ? "bg-surface-2" : "")
              }
            >
              <span className="mt-0.5 w-16 shrink-0 text-xs font-semibold tracking-wide text-muted uppercase">
                {TYPE_LABELS[doc.type]}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{doc.title}</span>
                <span className="block truncate text-sm text-muted">{doc.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="border-t border-border px-4 py-2 text-xs text-muted" aria-live="polite">
          {status === "loading" && "Loading search…"}
          {status === "error" && "Search could not load. Check your connection and try again."}
          {status === "ready" && q.length < 2 && "Type at least two letters."}
          {status === "ready" &&
            q.length >= 2 &&
            `${results.length} result${results.length === 1 ? "" : "s"}`}
        </p>
      </dialog>
    </>
  );
}
