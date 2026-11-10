import Link from "next/link";
import { site } from "@/lib/site";
import { Container } from "./Container";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <Container className="grid gap-6 py-10 text-sm text-muted sm:grid-cols-2">
        <div>
          <p className="font-semibold text-fg">{site.name}</p>
          <p className="mt-1 max-w-prose">
            For learning only. Always follow your vehicle&apos;s service manual, and stop if you are
            unsure. Diagrams are schematic and not to scale.
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 sm:justify-end">
          <li>
            <Link className="prose-link" href="/glossary/">
              Glossary
            </Link>
          </li>
          <li>
            <Link className="prose-link" href="/progress/">
              Your progress
            </Link>
          </li>
          <li>
            <Link className="prose-link" href="/teardowns/">
              Teardown guides
            </Link>
          </li>
        </ul>
      </Container>
    </footer>
  );
}
