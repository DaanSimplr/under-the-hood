import type { Metadata } from "next";
import { CarModelExplorer } from "@/components/diagram/CarModelExplorer";
import { Container } from "@/components/ui/Container";
import { getParts, getSystems } from "@/lib/content";

export const metadata: Metadata = {
  title: "3D car",
  description:
    "A whole car in 3D that you can take apart. Select any part to see what it is called and what it does.",
};

export default function Car3DPage() {
  const parts = Object.fromEntries(
    getParts().map((p) => [p.id, { name: p.name, summary: p.summary }]),
  );
  return (
    <Container className="py-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Take the car apart in 3D</h1>
        <p className="mt-3 text-lg text-muted">
          A whole car you can turn around and pull apart. Move the slider to spread the parts out,
          then select a part to see what it is called and what it does.
        </p>
      </div>
      <div className="mt-6">
        <CarModelExplorer
          parts={parts}
          systems={getSystems().map((s) => ({ id: s.id, name: s.name }))}
        />
      </div>
    </Container>
  );
}
