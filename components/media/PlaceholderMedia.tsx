import { cn } from "@/lib/cn";

const gradients: Record<string, string> = {
  hero: "linear-gradient(135deg, color-mix(in oklab, var(--accent) 35%, var(--surface-2)) 0%, var(--surface-2) 45%, color-mix(in oklab, var(--sys-cooling) 25%, var(--surface-2)) 100%)",
  ambient:
    "linear-gradient(160deg, var(--surface-2) 0%, color-mix(in oklab, var(--sys-cooling) 22%, var(--surface-2)) 100%)",
  transition:
    "linear-gradient(90deg, var(--surface-2), color-mix(in oklab, var(--accent) 30%, var(--surface-2)), var(--surface-2))",
  social:
    "linear-gradient(120deg, color-mix(in oklab, var(--accent) 30%, var(--surface-2)), var(--surface-2))",
};

const grid =
  "repeating-linear-gradient(0deg, color-mix(in oklab, var(--fg) 6%, transparent) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, color-mix(in oklab, var(--fg) 6%, transparent) 0 1px, transparent 1px 40px)";

/**
 * Stand-in for media that is not ready yet: a gradient in the slot's aspect
 * ratio, labelled with the slot id so the media agent can see where it goes.
 */
export function PlaceholderMedia({
  slotId,
  role = "hero",
  aspectCss,
  alt = "",
  fill = false,
  showLabel = true,
  className,
}: {
  slotId: string;
  role?: string;
  aspectCss: string;
  alt?: string;
  fill?: boolean;
  showLabel?: boolean;
  className?: string;
}) {
  const a11y = alt ? { role: "img" as const, "aria-label": alt } : { "aria-hidden": true as const };
  return (
    <div
      {...a11y}
      data-media-slot={slotId}
      data-media-state="placeholder"
      className={cn(
        "relative overflow-hidden",
        fill ? "absolute inset-0 h-full w-full" : "w-full",
        className,
      )}
      style={{
        aspectRatio: fill ? undefined : aspectCss,
        backgroundImage: `${grid}, ${gradients[role] ?? gradients.hero}`,
      }}
    >
      {showLabel && (
        <span className="absolute right-2 bottom-2 rounded bg-bg/80 px-2 py-0.5 font-mono text-[11px] text-muted">
          {slotId} · placeholder
        </span>
      )}
    </div>
  );
}
