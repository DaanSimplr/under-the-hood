import Link from "next/link";
import { getHotspots, getPart, getParts, getSystem } from "@/lib/content";
import { describeLocation, DIAGRAM_VIEWBOX } from "@/lib/diagram";
import { systemColor } from "@/lib/systems";
import { CarDrawing } from "./CarDrawing";

/**
 * Static car diagram with one part highlighted. Used in teardown steps
 * (<DiagramFocus part="brake-pads" />) and on part pages. Renders on the
 * server: no client JavaScript.
 */
export function DiagramFocus({ part }: { part: string }) {
  const p = getPart(part);
  if (!p) throw new Error(`<DiagramFocus part="${part}"> names an unknown part`);
  const hotspots = getHotspots();
  const spot = hotspots.find((h) => h.id === p.location)!;
  const system = getSystem(p.systemId)!;
  const where = describeLocation(spot.x, spot.y);
  const color = systemColor(p.systemId);
  const others = getParts().filter((o) => o.id !== p.id);
  const labelLeft = spot.x > 700;
  const titleId = `focus-${p.id}-title`;

  return (
    <figure
      className="my-4 rounded-card border border-border bg-surface p-3"
      data-diagram-focus={p.id}
    >
      <svg
        viewBox={`0 0 ${DIAGRAM_VIEWBOX.width} ${DIAGRAM_VIEWBOX.height}`}
        role="img"
        aria-labelledby={titleId}
        className="h-auto w-full"
      >
        <title id={titleId}>{`Diagram: the ${p.name.toLowerCase()} sits ${where}.`}</title>
        <CarDrawing />
        {others.map((o) => {
          const h = hotspots.find((x) => x.id === o.location);
          return h ? (
            <circle key={o.id} cx={h.x} cy={h.y} r="5" fill="var(--diagram-line)" opacity="0.5" />
          ) : null;
        })}
        <circle cx={spot.x} cy={spot.y} r="30" fill={color} opacity="0.18" />
        <circle
          cx={spot.x}
          cy={spot.y}
          r="15"
          fill={color}
          stroke="var(--surface)"
          strokeWidth="4"
        />
        <g transform={`translate(${spot.x + (labelLeft ? -24 : 24)} ${Math.max(spot.y - 30, 30)})`}>
          <text
            textAnchor={labelLeft ? "end" : "start"}
            fontSize="26"
            fontWeight="700"
            fill="var(--fg)"
            stroke="var(--surface)"
            strokeWidth="7"
            paintOrder="stroke"
          >
            {p.name}
          </text>
        </g>
      </svg>
      <figcaption className="mt-2 px-1 text-sm text-muted">
        <span className="font-medium text-fg">{p.name}</span> ({system.name}): {where}. Schematic,
        not to scale.{" "}
        <Link className="prose-link" href={`/explorer/?part=${p.id}`}>
          Open in the explorer
        </Link>
      </figcaption>
    </figure>
  );
}
