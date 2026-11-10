import Link from "next/link";
import { getGlossary } from "@/lib/content";
import { cn } from "@/lib/cn";
import { SAFETY } from "@/lib/safety";
import type { SafetyTopic } from "@/lib/schemas";
import { difficultyLabel } from "@/lib/systems";

/* ------------------------------------------------------------------ */

export function DifficultyBadge({
  level,
  label = "Difficulty",
}: {
  level: number;
  label?: string;
}) {
  const text = difficultyLabel(level);
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm"
      aria-label={`${label}: ${level} out of 5, ${text}`}
    >
      <span aria-hidden="true" className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={cn("h-2 w-2 rounded-full", n <= level ? "bg-accent" : "bg-border")}
          />
        ))}
      </span>
      <span aria-hidden="true">{text}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */

function WarningIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="mt-0.5 shrink-0"
    >
      <path d="M12 3 2 21h20L12 3z" />
      <path d="M12 10v5M12 18h.01" />
    </svg>
  );
}

/**
 * Safety callout. Uses the standard text for the topic unless children are
 * given; `note` adds a job-specific line.
 */
export function SafetyCallout({
  topic,
  note,
  children,
}: {
  topic: SafetyTopic;
  note?: string;
  children?: React.ReactNode;
}) {
  const s = SAFETY[topic];
  if (!s) throw new Error(`Unknown safety topic "${topic}"`);
  const danger = s.tone === "danger";
  return (
    <aside
      aria-label={`Safety: ${s.title}`}
      data-safety-topic={topic}
      className={cn(
        "my-4 flex gap-3 rounded-card border-l-4 p-4 text-sm",
        danger
          ? "border-danger-border bg-danger-bg text-danger-fg"
          : "border-warn-border bg-warn-bg text-warn-fg",
      )}
    >
      <WarningIcon />
      <div className="space-y-1">
        <p className="font-semibold">
          <span className="sr-only">{danger ? "Danger: " : "Warning: "}</span>
          {s.title}
        </p>
        <div>{children ?? s.body}</div>
        {note && <p className="font-medium">For this job: {note}</p>}
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Torque values are never invented. Shows "see your manual", plus an optional
 * broad typical range that is clearly labelled as such.
 */
export function TorqueSpec({ fastener, range }: { fastener: string; range?: string }) {
  return (
    <div className="my-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg border border-dashed border-border bg-surface-2 px-4 py-3 text-sm">
      <span className="font-semibold">
        <Link href="/glossary/#torque" className="term-link">
          Torque
        </Link>{" "}
        · {fastener}:
      </span>
      <span>see your vehicle&apos;s service manual.</span>
      {range && <span className="text-muted">Typical range, for reference only: {range}.</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function ToolList({ tools }: { tools: string[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {tools.map((tool) => (
        <li key={tool} className="flex items-start gap-2 text-sm">
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="mt-0.5 shrink-0 text-accent"
          >
            <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4 2.5-2.5z" />
          </svg>
          {tool}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */

/** Inline glossary link for MDX: <Term id="caliper">calipers</Term>. */
export function Term({ id, children }: { id: string; children?: React.ReactNode }) {
  const entry = getGlossary().find((g) => g.id === id);
  if (!entry) throw new Error(`<Term id="${id}"> is not in content/glossary.json`);
  return (
    <Link href={`/glossary/#${id}`} className="term-link" title={entry.definition}>
      {children ?? entry.term}
    </Link>
  );
}

/* ------------------------------------------------------------------ */

/** Presentational step card. The number comes from the step's position in the guide. */
export function StepCard({
  id,
  index,
  total,
  title,
  children,
  aside,
}: {
  id: string;
  index: number;
  total: number;
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section
      id={`step-${id}`}
      aria-labelledby={`step-${id}-title`}
      data-step-id={id}
      className="scroll-mt-24 rounded-card border border-border bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 id={`step-${id}-title`} className="flex items-start gap-3 text-lg font-semibold">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-fg"
          >
            {index}
          </span>
          <span className="pt-0.5">
            <span className="sr-only">
              Step {index} of {total}:{" "}
            </span>
            {title}
          </span>
        </h3>
        {aside}
      </div>
      <div className="mt-3 space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}
