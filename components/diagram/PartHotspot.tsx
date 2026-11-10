"use client";

import { systemColor } from "@/lib/systems";

export type HotspotState = "normal" | "active" | "connected" | "dimmed" | "hidden";

/**
 * One clickable point on the car diagram. It is a real focusable control
 * (role="button") and works with Enter and Space as well as the mouse.
 */
export function PartHotspot({
  id,
  name,
  systemName,
  systemId,
  x,
  y,
  state,
  selected,
  focused,
  controlsId,
  onSelect,
  onHover,
  onFocusChange,
}: {
  id: string;
  name: string;
  systemName: string;
  systemId: string;
  x: number;
  y: number;
  state: HotspotState;
  selected: boolean;
  focused: boolean;
  controlsId: string;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onFocusChange: (id: string | null) => void;
}) {
  if (state === "hidden") {
    return (
      <circle cx={x} cy={y} r="5" fill="var(--diagram-line)" opacity="0.35" aria-hidden="true" />
    );
  }
  const big = state === "active" || selected;
  const r = big ? 16 : 13;
  const opacity = state === "dimmed" ? 0.3 : 1;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${name}, ${systemName}`}
      aria-pressed={selected}
      aria-controls={controlsId}
      data-hotspot={id}
      className="hotspot cursor-pointer outline-none"
      style={{ opacity, transition: "opacity 150ms" }}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(id);
        }
      }}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onFocusChange(id)}
      onBlur={() => onFocusChange(null)}
    >
      {/* Larger invisible hit area for touch. */}
      <circle cx={x} cy={y} r="22" fill="transparent" />
      {state === "connected" && (
        <circle
          cx={x}
          cy={y}
          r={r + 7}
          fill="none"
          stroke={systemColor(systemId)}
          strokeWidth="3"
          strokeDasharray="4 4"
        />
      )}
      {(selected || state === "active") && (
        <circle cx={x} cy={y} r={r + 9} fill={systemColor(systemId)} opacity="0.2" />
      )}
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={systemColor(systemId)}
        stroke="var(--surface)"
        strokeWidth="3"
      />
      {selected && <circle cx={x} cy={y} r="4" fill="var(--surface)" />}
      {focused && (
        <circle cx={x} cy={y} r={r + 6} fill="none" stroke="var(--focus)" strokeWidth="4" />
      )}
    </g>
  );
}
