import { MediaSlot } from "@/components/media/MediaSlot";
import { Container } from "./Container";

/**
 * Page header with a decorative background behind the title: a media slot,
 * or a drawing passed as `background`. Text sits on a solid surface card so
 * contrast never depends on what is behind it.
 */
export function PageHero({
  slotId,
  background,
  title,
  children,
  eyebrow,
  priority = true,
  minHeight = "min-h-[16rem] sm:min-h-[20rem]",
}: ({ slotId: string; background?: never } | { background: React.ReactNode; slotId?: never }) & {
  title: React.ReactNode;
  children?: React.ReactNode;
  eyebrow?: React.ReactNode;
  priority?: boolean;
  minHeight?: string;
}) {
  return (
    <section
      className={`relative isolate flex items-end overflow-hidden border-b border-border ${minHeight}`}
    >
      <div className="absolute inset-0 -z-10">
        {slotId ? <MediaSlot id={slotId} fill priority={priority} /> : background}
      </div>
      <Container className="py-8 sm:py-10">
        <div className="max-w-2xl rounded-card border border-border bg-surface p-5 shadow-sm sm:p-6">
          {eyebrow && <div className="mb-2">{eyebrow}</div>}
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          {children && <div className="mt-3 text-base text-muted sm:text-lg">{children}</div>}
        </div>
      </Container>
    </section>
  );
}
