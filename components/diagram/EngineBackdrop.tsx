"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/components/media/usePrefersReducedMotion";
import { cn } from "@/lib/cn";
import type { DrawShape, EngineDrawing } from "@/lib/engine-drawing";
import { guideOpacity, loopProgress, partTravel } from "@/lib/engine-motion";

type Loaded = { drawing: EngineDrawing; tones: React.CSSProperties };

function Shapes({ shapes }: { shapes: DrawShape[] }) {
  return shapes.map((s, i) => (
    <path
      key={i}
      d={s.d}
      fill={s.fill}
      stroke={s.stroke}
      strokeWidth={s.strokeWidth}
      strokeDasharray={s.dash}
      opacity={s.opacity}
      transform={s.shift ? `translate(${s.shift[0]} ${s.shift[1]})` : undefined}
    />
  ));
}

/**
 * Decorative isometric engine on blueprint paper that comes apart and goes
 * back together (the /teardowns header background). Fills its positioned
 * parent.
 *
 * It is drawn in the browser on purpose: as static HTML the path data made
 * the page about 140 KB gzipped heavier, while the geometry code is a small
 * chunk loaded after hydration. The static HTML shows only the grid paper.
 * The loop runs only while on screen; with reduced motion the drawing stays
 * still, exploded.
 */
export function EngineBackdrop({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    let cancelled = false;
    import("@/lib/engine-drawing").then((m) => {
      if (!cancelled)
        setLoaded({
          drawing: m.buildEngineDrawing(),
          tones: m.toneVariables() as React.CSSProperties,
        });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!root || !loaded || reducedMotion) return;
    const groups = loaded.drawing.parts.map((p) => ({
      ...p,
      els: Array.from(root.querySelectorAll<SVGGElement>(`[data-engine-part="${p.id}"]`)),
    }));
    const guides = root.querySelector<SVGGElement>("[data-engine-guides]");
    const render = (progress: number) => {
      for (const g of groups) {
        const k = partTravel(progress, g.window);
        const t = `translate(${(g.screenDir[0] * k).toFixed(1)} ${(g.screenDir[1] * k).toFixed(1)})`;
        for (const el of g.els) el.setAttribute("transform", t);
      }
      guides?.setAttribute("opacity", guideOpacity(progress).toFixed(2));
    };

    let seconds = 0;
    let last: number | null = null;
    let raf = 0;
    const tick = (now: number) => {
      if (last !== null) seconds += Math.min(now - last, 50) / 1000; // no jump after a hidden tab
      last = now;
      render(loopProgress(seconds));
      raf = requestAnimationFrame(tick);
    };
    const play = () => {
      if (raf) return;
      last = null;
      raf = requestAnimationFrame(tick);
    };
    const pause = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    render(0);
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === "undefined") play();
    else {
      io = new IntersectionObserver(([entry]) => (entry?.isIntersecting ? play() : pause()));
      io.observe(root);
    }
    return () => {
      io?.disconnect();
      pause();
      render(1);
    };
  }, [loaded, reducedMotion]);

  const drawing = loaded?.drawing;
  return (
    <div className={cn("blueprint-grid absolute inset-0", className)} data-engine-backdrop="">
      <div
        ref={ref}
        className={cn(
          "absolute inset-x-3 top-3 bottom-[42%] transition-opacity duration-700 sm:bottom-[36%] lg:inset-y-6 lg:right-6 lg:left-auto lg:w-[52%]",
          drawing ? "opacity-100" : "opacity-0",
        )}
      >
        {drawing && (
          <svg
            viewBox={`${drawing.viewBox.x} ${drawing.viewBox.y} ${drawing.viewBox.width} ${drawing.viewBox.height}`}
            preserveAspectRatio="xMaxYMid meet"
            aria-hidden="true"
            focusable="false"
            className="h-full w-full"
            style={loaded.tones}
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            <defs>
              <pattern
                id="engine-hatch"
                width="5"
                height="5"
                patternTransform="rotate(45)"
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="5"
                  stroke="var(--bp-ink)"
                  strokeWidth="0.6"
                  opacity="0.22"
                />
              </pattern>
              {drawing.parts.flatMap((p) =>
                p.pieces.flatMap((piece) =>
                  piece.clip
                    ? [
                        <clipPath
                          key={piece.clip.id}
                          id={piece.clip.id}
                          clipPathUnits="userSpaceOnUse"
                        >
                          <path d={piece.clip.d} />
                        </clipPath>,
                      ]
                    : [],
                ),
              )}
            </defs>
            <g data-engine-guides="" fill="none" strokeLinecap="butt">
              {drawing.guides.map((g, i) => (
                <path
                  key={i}
                  d={g.d}
                  stroke={g.centre ? "var(--accent)" : "var(--bp-guide)"}
                  strokeWidth="1"
                  strokeDasharray={g.centre ? "14 4 2 4" : "4 4"}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
            {drawing.parts.map((p) => (
              <g key={p.id}>
                {p.pieces.map((piece, i) => {
                  // Initial state; the loop takes over from here (reduced motion: exploded).
                  const group = (
                    <g
                      data-engine-part={p.id}
                      transform={
                        reducedMotion ? `translate(${p.screenDir[0]} ${p.screenDir[1]})` : undefined
                      }
                    >
                      <Shapes shapes={piece.shapes} />
                    </g>
                  );
                  return piece.clip ? (
                    <g key={i} clipPath={`url(#${piece.clip.id})`}>
                      {group}
                    </g>
                  ) : (
                    <g key={i}>{group}</g>
                  );
                })}
              </g>
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}
