import Link from "next/link";
import { cn } from "@/lib/cn";
import { systemColor } from "@/lib/systems";

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
        variant === "primary"
          ? "bg-accent text-accent-fg hover:opacity-90"
          : "border border-border bg-surface text-fg hover:bg-surface-2",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "article" | "li" | "section";
}) {
  return (
    <Tag className={cn("rounded-card border border-border bg-surface p-5", className)}>
      {children}
    </Tag>
  );
}

/** A card whose whole area is one link (the heading link stretches over it). */
export function LinkCard({
  href,
  title,
  children,
  media,
  eyebrow,
  className,
  headingLevel: H = "h3",
}: {
  href: string;
  title: string;
  children?: React.ReactNode;
  media?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
  headingLevel?: "h2" | "h3";
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface transition-shadow focus-within:shadow-lg hover:shadow-lg",
        className,
      )}
    >
      {media && <div className="relative">{media}</div>}
      <div className="flex flex-1 flex-col gap-2 p-5">
        {eyebrow && (
          <div className="text-xs font-medium tracking-wide text-muted uppercase">{eyebrow}</div>
        )}
        <H className="text-lg font-semibold">
          <Link
            href={href}
            className="after:absolute after:inset-0 after:content-[''] group-hover:text-accent focus-visible:outline-none"
          >
            {title}
          </Link>
        </H>
        {children && <div className="text-sm text-muted">{children}</div>}
      </div>
      {/* Focus ring for the stretched link, drawn on the card. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-card ring-focus group-has-[a:focus-visible]:ring-[3px]"
      />
    </article>
  );
}

export function SystemChip({ systemId, name }: { systemId: string; name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium">
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 rounded-full"
        style={{ background: systemColor(systemId) }}
      />
      {name}
    </span>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ href?: string; label: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link className="prose-link" href={item.href}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SectionHeading({
  id,
  children,
  level: H = "h2",
}: {
  id?: string;
  children: React.ReactNode;
  level?: "h2" | "h3";
}) {
  return (
    <H id={id} className={cn("font-bold tracking-tight", H === "h2" ? "text-2xl" : "text-lg")}>
      {children}
    </H>
  );
}

export function BulletList({ items, className }: { items: React.ReactNode[]; className?: string }) {
  return (
    <ul className={cn("list-disc space-y-1.5 pl-5 marker:text-accent", className)}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
