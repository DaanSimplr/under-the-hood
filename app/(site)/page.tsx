import { Container } from "@/components/ui/Container";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <Container className="py-16">
      <h1 className="text-4xl font-bold tracking-tight">{site.name}</h1>
      <p className="mt-4 max-w-prose text-lg text-muted">{site.tagline}</p>
    </Container>
  );
}
