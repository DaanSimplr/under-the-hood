"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { getAssembly } from "@/lib/assemblies";
import { cn } from "@/lib/cn";
import { ExplodeControls, ModelStage, PillButton } from "./ModelStage";

/**
 * Exploded view of one assembly. A slider moves the pieces apart along their
 * removal direction, and a piece can be picked in the 3D view or in the list.
 * The ordered list next to it carries the same information as text.
 */
export function ExplodedView({ assembly, highlight }: { assembly: string; highlight?: string }) {
  const uid = useId();
  const [explode, setExplode] = useState(0.35);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const data = getAssembly(assembly);
  if (!data) throw new Error(`Unknown assembly "${assembly}"`);
  const ordered = [...data.pieces].sort((a, b) => a.removalOrder - b.removalOrder);
  const highlightIds = data.pieces
    .filter((p) => p.id === selected || (!!highlight && p.partId === highlight))
    .map((p) => p.id);
  const pct = Math.round(explode * 100);

  return (
    <figure
      className="@container rounded-card border border-border bg-surface p-3 sm:p-4"
      data-testid="exploded-view"
    >
      <div className="grid gap-4 @3xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <ModelStage
            label={`3D exploded view of the ${data.title.toLowerCase()}, ${pct}% apart. Drag to rotate. The removal order list gives the same information.`}
            fallback="The removal order below has the same information."
            className="aspect-[4/3]"
            pieces={data.pieces}
            camera={data.camera}
            explode={explode}
            highlightIds={highlightIds}
            hoverId={hovered}
            labels={data.pieces.map((p) => ({ id: p.id, text: `${p.removalOrder}. ${p.label}` }))}
            resetKey={resetKey}
            onHover={setHovered}
            onSelect={setSelected}
          />
          <ExplodeControls explode={explode} onChange={setExplode}>
            <PillButton onClick={() => setResetKey((k) => k + 1)}>Reset view</PillButton>
          </ExplodeControls>
        </div>

        <div>
          <p id={`${uid}-order`} className="text-sm font-semibold">
            Removal order
          </p>
          <ol aria-labelledby={`${uid}-order`} className="mt-2 space-y-2 text-sm">
            {ordered.map((piece) => (
              <li
                key={piece.id}
                onMouseEnter={() => setHovered(piece.id)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  "rounded-md border border-border p-2",
                  highlightIds.includes(piece.id) && "border-accent bg-surface-2",
                )}
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-muted">{piece.removalOrder}.</span>
                  {piece.partId ? (
                    <Link
                      href={`/parts/${piece.partId}/`}
                      className="prose-link font-semibold"
                      onFocus={() => setHovered(piece.id)}
                      onBlur={() => setHovered(null)}
                    >
                      {piece.label}
                    </Link>
                  ) : (
                    <span className="font-semibold">{piece.label}</span>
                  )}
                </div>
                <p className="mt-0.5 text-muted">{piece.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-muted">
        {data.note} {data.orientation} Select a piece in the 3D view to highlight it in the list.
      </figcaption>
    </figure>
  );
}
