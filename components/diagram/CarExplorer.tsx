"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { buildConnections, DIAGRAM_VIEWBOX, type DiagramPart } from "@/lib/diagram";
import { systemColor } from "@/lib/systems";
import { CarDrawing } from "./CarDrawing";
import { PartHotspot, type HotspotState } from "./PartHotspot";

type SystemInfo = { id: string; name: string };

/**
 * Interactive whole-car diagram. Select a hotspot (click, Enter or Space) to
 * open its details; hover or focus to highlight the parts it connects to.
 * Filter by system with the chips. A plain list below mirrors the hotspots.
 */
export function CarExplorer({
  parts,
  systems,
  initialSystem = "all",
  readQueryString = false,
  heading = "h2",
}: {
  parts: DiagramPart[];
  systems: SystemInfo[];
  initialSystem?: string;
  /** Read ?part= and ?system= from the URL on load (explorer page). */
  readQueryString?: boolean;
  heading?: "h2" | "h3";
}) {
  const uid = useId();
  const drawerId = `${uid}-drawer`;
  const [filter, setFilter] = useState(initialSystem);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const drawerHeadingRef = useRef<HTMLHeadingElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const moveFocusToDrawer = useRef(false);

  const connections = useMemo(() => buildConnections(parts), [parts]);
  const byId = useMemo(() => new Map(parts.map((p) => [p.id, p])), [parts]);
  const systemName = (id: string) => systems.find((s) => s.id === id)?.name ?? id;

  useEffect(() => {
    if (!readQueryString) return;
    const q = new URLSearchParams(window.location.search);
    const part = q.get("part");
    const sys = q.get("system");
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read of the URL after hydration */
    if (sys && systems.some((s) => s.id === sys)) setFilter(sys);
    if (part && byId.has(part)) setSelected(part);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [readQueryString, systems, byId]);

  useEffect(() => {
    if (selected && moveFocusToDrawer.current) {
      moveFocusToDrawer.current = false;
      drawerHeadingRef.current?.focus();
    }
  }, [selected]);

  const active = hovered ?? focused ?? selected;
  const activeLinks = active ? connections.get(active) : undefined;
  const visible = (p: DiagramPart) => filter === "all" || p.systemId === filter;

  function stateFor(p: DiagramPart): HotspotState {
    if (!visible(p)) return "hidden";
    if (!active) return "normal";
    if (p.id === active) return "active";
    if (activeLinks?.has(p.id)) return "connected";
    return "dimmed";
  }

  function select(id: string, fromList = false) {
    moveFocusToDrawer.current = true;
    setSelected(id);
    if (fromList) setHovered(null);
  }

  function close() {
    const id = selected;
    setSelected(null);
    // Return focus to the hotspot that opened the drawer.
    if (id) svgRef.current?.querySelector<SVGGElement>(`[data-hotspot="${id}"]`)?.focus();
  }

  const sel = selected ? byId.get(selected) : undefined;
  const selLinks = sel
    ? [...(connections.get(sel.id) ?? [])].map((id) => byId.get(id)!).filter(Boolean)
    : [];
  const H = heading;
  const visibleParts = parts.filter(visible);

  return (
    <div
      className="space-y-4"
      onKeyDown={(e) => {
        if (e.key === "Escape" && selected) close();
      }}
    >
      <div role="group" aria-label="Filter parts by system" className="flex flex-wrap gap-2">
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
            {s.id !== "all" && (
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: systemColor(s.id) }}
              />
            )}
            {s.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-card border border-border bg-surface/90 p-2 backdrop-blur-sm sm:p-3">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${DIAGRAM_VIEWBOX.width} ${DIAGRAM_VIEWBOX.height}`}
            role="group"
            aria-label={`Car diagram, side view, front on the left. ${visibleParts.length} parts shown. Tab to move between parts.`}
            className="h-auto w-full select-none"
            data-testid="car-explorer"
          >
            <CarDrawing />
            {/* Connection lines from the active part */}
            {active && visible(byId.get(active)!) && (
              <g aria-hidden="true">
                {[...(activeLinks ?? [])].map((id) => {
                  const a = byId.get(active)!;
                  const b = byId.get(id);
                  if (!b || !visible(b)) return null;
                  return (
                    <line
                      key={id}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={systemColor(a.systemId)}
                      strokeWidth="3"
                      strokeDasharray="6 6"
                      opacity="0.8"
                    />
                  );
                })}
              </g>
            )}
            {parts.map((p) => (
              <PartHotspot
                key={p.id}
                id={p.id}
                name={p.name}
                systemId={p.systemId}
                systemName={systemName(p.systemId)}
                x={p.x}
                y={p.y}
                state={stateFor(p)}
                selected={selected === p.id}
                focused={focused === p.id}
                controlsId={drawerId}
                onSelect={select}
                onHover={setHovered}
                onFocusChange={setFocused}
              />
            ))}
            {/* Name label for the active part */}
            {active &&
              visible(byId.get(active)!) &&
              (() => {
                const a = byId.get(active)!;
                const left = a.x > 700;
                return (
                  <text
                    aria-hidden="true"
                    x={a.x + (left ? -26 : 26)}
                    y={Math.max(a.y - 22, 28)}
                    textAnchor={left ? "end" : "start"}
                    fontSize="24"
                    fontWeight="700"
                    fill="var(--fg)"
                    stroke="var(--surface)"
                    strokeWidth="7"
                    paintOrder="stroke"
                    pointerEvents="none"
                  >
                    {a.name}
                  </text>
                );
              })()}
          </svg>
          <p className="px-1 pt-1 text-xs text-muted">
            Schematic, not to scale. Hover or focus a part to see what it connects to.
          </p>
        </div>

        <section
          id={drawerId}
          aria-live="polite"
          aria-label="Part details"
          className="rounded-card border border-border bg-surface p-5"
          data-testid="explorer-drawer"
        >
          {sel ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <H ref={drawerHeadingRef} tabIndex={-1} className="text-xl font-bold outline-none">
                  {sel.name}
                </H>
                <button
                  type="button"
                  onClick={close}
                  aria-label={`Close details for ${sel.name}`}
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
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: systemColor(sel.systemId) }}
                />
                {systemName(sel.systemId)}
              </p>
              <p>{sel.summary}</p>
              {selLinks.length > 0 && (
                <div>
                  <p className="text-sm font-semibold">Connects to</p>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {selLinks.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!visible(c)) setFilter("all");
                            select(c.id);
                          }}
                          className="rounded-full border border-border px-2.5 py-1 text-sm hover:bg-surface-2"
                        >
                          {c.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Link
                href={`/parts/${sel.id}/`}
                className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:opacity-90"
              >
                Read about the {sel.name.toLowerCase()}
              </Link>
            </div>
          ) : (
            <p className="text-muted">
              Select a part on the diagram or in the list to see what it does.
            </p>
          )}
        </section>
      </div>

      <details className="rounded-card border border-border bg-surface p-4" open>
        <summary className="cursor-pointer font-semibold">
          All parts as a list ({visibleParts.length})
        </summary>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleParts.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => select(p.id, true)}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                aria-pressed={selected === p.id}
                aria-controls={drawerId}
                className={cn(
                  "flex min-h-10 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-2",
                  selected === p.id && "bg-surface-2 font-semibold",
                )}
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: systemColor(p.systemId) }}
                />
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
