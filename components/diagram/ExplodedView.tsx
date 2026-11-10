"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { getAssembly } from "@/lib/assemblies";
import { cn } from "@/lib/cn";

/** The Three.js scene lives in its own chunk and is only fetched when needed. */
const ExplodedViewCanvas = dynamic(() => import("./ExplodedViewCanvas"), {
  ssr: false,
  loading: () => <CanvasMessage>Loading 3D view…</CanvasMessage>,
});

function CanvasMessage({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted">
      {children}
    </div>
  );
}

class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <CanvasMessage>
        The 3D view could not start on this device. The removal order below has the same
        information.
      </CanvasMessage>
    ) : (
      this.props.children
    );
  }
}

/**
 * Exploded view of one assembly, built from primitive shapes. A slider moves
 * the pieces apart along their removal direction. The ordered list next to it
 * carries the same information as text.
 */
export function ExplodedView({ assembly, highlight }: { assembly: string; highlight?: string }) {
  const uid = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [explode, setExplode] = useState(0.35);
  const [focusPiece, setFocusPiece] = useState<string | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no observer: load straight away
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const data = getAssembly(assembly);
  if (!data) throw new Error(`Unknown assembly "${assembly}"`);
  const ordered = [...data.pieces].sort((a, b) => a.removalOrder - b.removalOrder);
  const highlighted = focusPiece ?? undefined;
  const pct = Math.round(explode * 100);

  return (
    <figure
      className="@container rounded-card border border-border bg-surface p-3 sm:p-4"
      data-testid="exploded-view"
    >
      <div className="grid gap-4 @3xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div
            ref={wrapRef}
            role="img"
            aria-label={`3D exploded view of the ${data.title.toLowerCase()}, ${pct}% apart. Drag to rotate. The removal order list gives the same information.`}
            className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-2"
          >
            {inView ? (
              <WebGLBoundary>
                <ExplodedViewCanvas
                  assembly={data}
                  explode={explode}
                  highlightPartId={highlight}
                  highlightPieceId={highlighted}
                />
              </WebGLBoundary>
            ) : (
              <CanvasMessage>3D view loads when you scroll here.</CanvasMessage>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label htmlFor={`${uid}-explode`} className="text-sm font-semibold">
              Explode
            </label>
            <input
              id={`${uid}-explode`}
              type="range"
              min={0}
              max={100}
              step={1}
              value={pct}
              aria-valuetext={pct === 0 ? "Assembled" : `${pct}% apart`}
              onChange={(e) => setExplode(Number(e.target.value) / 100)}
              className="h-10 min-w-40 flex-1 accent-[var(--accent)]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExplode(0)}
                className="min-h-10 rounded-full border border-border px-3 text-sm hover:bg-surface-2"
              >
                Assemble
              </button>
              <button
                type="button"
                onClick={() => setExplode(1)}
                className="min-h-10 rounded-full border border-border px-3 text-sm hover:bg-surface-2"
              >
                Explode
              </button>
            </div>
          </div>
        </div>

        <div>
          <p id={`${uid}-order`} className="text-sm font-semibold">
            Removal order
          </p>
          <ol aria-labelledby={`${uid}-order`} className="mt-2 space-y-2 text-sm">
            {ordered.map((piece) => {
              const isHighlight = piece.partId === highlight;
              return (
                <li
                  key={piece.id}
                  onMouseEnter={() => setFocusPiece(piece.id)}
                  onMouseLeave={() => setFocusPiece(null)}
                  className={cn(
                    "rounded-md border border-border p-2",
                    isHighlight && "border-accent bg-surface-2",
                  )}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-muted">{piece.removalOrder}.</span>
                    {piece.partId ? (
                      <Link
                        href={`/parts/${piece.partId}/`}
                        className="prose-link font-semibold"
                        onFocus={() => setFocusPiece(piece.id)}
                        onBlur={() => setFocusPiece(null)}
                      >
                        {piece.label}
                      </Link>
                    ) : (
                      <span className="font-semibold">{piece.label}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-muted">{piece.description}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-muted">
        {data.note} {data.orientation}
      </figcaption>
    </figure>
  );
}
