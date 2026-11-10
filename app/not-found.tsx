import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/primitives";
import { SiteShell } from "@/components/ui/SiteShell";

export default function NotFound() {
  return (
    <SiteShell>
      <Container className="py-24 text-center">
        <p className="text-sm font-semibold text-accent">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">This part is missing</h1>
        <p className="mt-3 text-muted">We couldn&apos;t find that page.</p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/">Go home</ButtonLink>
          <ButtonLink href="/systems/" variant="secondary">
            Browse systems
          </ButtonLink>
        </div>
      </Container>
    </SiteShell>
  );
}
