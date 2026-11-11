"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { wholeCar } from "@/lib/assemblies/whole-car";
import { cn } from "@/lib/cn";
import { systemColor } from "@/lib/systems";
import { ExplodeControls, ModelStage, PillButton } from "./ModelStage";

type SystemInfo = { id: string; name: string };
type PartInfo = { name: string; summary: string };

function SystemDot({ systemId }: { systemId: string }) {
  return (
    <span
      aria-hidden="true"
      className="h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ background: systemColor(systemId) }}
    />
  );
}

/**
 * A whole car in 3D that comes apart. Select a piece in the 3D view or in the
 * list to see its name and what it does. Filter by system with the chips, or
 * make the bodywork see-through to look inside. The list below mirrors the 3D
 * view as text.
 */
export function CarModelExplorer({
  parts,
  systems,
}: {
  /** Name and summary of every part in the content, by id. */
  parts: Record<string, PartInfo>;
  systems: SystemInfo[];
}) {
  const uid = useId();
  const detailsId = `${uid}-details`;
  const [explode, setExplode] = useState(0);
  const [filter, setFilter] = useState("all");
  const [seeThrough, setSeeThrough] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const moveFocusToDetails = useRef(false);

  useEffect(() => {
    if (selected && moveFocusToDetails.current) {
      moveFocusToDetails.current = false;
      headingRef.current?.focus();
    }
  }, [selected]);

  const { pieces } = wholeCar;
  const inFilter = (systemId: string) => filter === "all" || systemId === filter;
  const ghostIds = pieces
    .filter((p) => p.id !== selected && (!inFilter(p.systemId) || (seeThrough && p.body)))
    .map((p) => p.id);
  const labelled = pieces.filter(
    (p) =>
      p.id === selected ||
      p.id === hovered ||
      (filter !== "all" && p.systemId === filter && !ghostIds.includes(p.id)),
  );
  const sel = pieces.find((p) => p.id === selected);
  const selPart = sel?.partId ? parts[sel.partId] : undefined;
  const systemName = (id: string) => systems.find((s) => s.id === id)?.name ?? id;
  const pct = Math.round(explode * 100);

  function selectFromList(id: string) {
    moveFocusToDetails.current = true;
    setSelected(id);
    setHovered(null);
  }

  function close() {
    const id = selected;
    setSelected(null);
    // Return focus to the list button for this piece.
    if (id) listRef.current?.querySelector<HTMLButtonElement>(`[data-piece="${id}"]`)?.focus();
  }

  return (
    <div
      className="space-y-4"
      data-testid="car-model"
      onKeyDown={(e) => {
        if (e.key === "Escape" && selected) close();
      }}
    >
      <div role="group" aria-label="Show one system" className="flex flex-wrap gap-2">
        {[{ id: "all", name: "All systems" }, ...systems].map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={filter === s.id}
            onClick={() => setFilter(s.id)}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
              filter === s.id
                ? "border-fg bg-fg text-bg"
                : "border-border bg-surface hover:bg-surface-2",
            )}
          >
            {s.id !== "all" && <SystemDot systemId={s.id} />}
            {s.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-card border border-border bg-surface p-2 sm:p-3">
          <ModelStage
            label={`3D model of a whole car, ${pct}% apart. Drag to rotate, scroll or pinch to zoom. The parts list gives the same information.`}
            fallback="The parts list below has the same information."
            className="aspect-[4/3] sm:aspect-[16/10]"
            pieces={pieces}
            camera={wholeCar.camera}
            explode={explode}
            highlightIds={selected ? [selected] : []}
            hoverId={hovered}
            ghostIds={ghostIds}
            labels={labelled.map((p) => ({ id: p.id, text: p.label }))}
            resetKey={resetKey}
            onHover={setHovered}
            onSelect={setSelected}
          />
          <ExplodeControls explode={explode} onChange={setExplode}>
            <PillButton pressed={seeThrough} onClick={() => setSeeThrough((v) => !v)}>
              See-through body
            </PillButton>
            <PillButton onClick={() => setResetKey((k) => k + 1)}>Reset view</PillButton>
          </ExplodeControls>
          <p className="px-1 pt-2 text-xs text-muted">{wholeCar.note}</p>
        </div>

        <section
          id={detailsId}
          aria-live="polite"
          aria-label="Part details"
          className="rounded-card border border-border bg-surface p-5"
          data-testid="car-model-details"
        >
          {sel ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold outline-none">
                  {sel.label}
                </h2>
                <button
                  type="button"
                  onClick={close}
                  aria-label={`Close details for ${sel.label}`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border hover:bg-surface-2"
                >
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <p className="flex items-center gap-2 text-sm text-muted">
                <SystemDot systemId={sel.systemId} />
                {systemName(sel.systemId)}
              </p>
              {selPart && <p>{selPart.summary}</p>}
              <p className={cn(selPart && "text-sm text-muted")}>{sel.description}</p>
              {sel.partId && selPart && (
                <Link
                  href={`/parts/${sel.partId}/`}
                  className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:opacity-90"
                >
                  Read about the {selPart.name.toLowerCase()}
                </Link>
              )}
            </div>
          ) : (
            <p className="text-muted">
              Select a part on the car or in the list to see its name and what it does.
            </p>
          )}
        </section>
      </div>

      <details className="rounded-card border border-border bg-surface p-4" open>
        <summary className="cursor-pointer font-semibold">
          All parts as a list ({pieces.filter((p) => inFilter(p.systemId)).length})
        </summary>
        <div ref={listRef} className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {systems
            .filter((s) => inFilter(s.id))
            .map((s) => (
              <div key={s.id}>
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <SystemDot systemId={s.id} />
                  {s.name}
                </h2>
                <ul className="mt-1">
                  {pieces
                    .filter((p) => p.systemId === s.id)
                    .map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          data-piece={p.id}
                          onClick={() => selectFromList(p.id)}
                          onMouseEnter={() => setHovered(p.id)}
                          onMouseLeave={() => setHovered(null)}
                          aria-pressed={selected === p.id}
                          aria-controls={detailsId}
                          className={cn(
                            "min-h-10 w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-2",
                            selected === p.id && "bg-surface-2 font-semibold",
                          )}
                        >
                          {p.label}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
        </div>
      </details>
    </div>
  );
}
