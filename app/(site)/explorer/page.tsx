import type { Metadata } from "next";
import { CarExplorer } from "@/components/diagram/CarExplorer";
import { MediaSlot } from "@/components/media/MediaSlot";
import { Container } from "@/components/ui/Container";
import { getDiagramParts, getSystems } from "@/lib/content";

export const metadata: Metadata = {
  title: "Car explorer",
  description: "An interactive diagram of a whole car. Select a part to learn what it does.",
};

export default function ExplorerPage() {
  return (
    <div className="relative isolate">
      {/* Decorative, low-contrast background loop behind the diagram. */}
      <div className="absolute inset-0 -z-10 opacity-60">
        <MediaSlot id="explorer-bg-loop" fill priority />
      </div>
      <Container className="py-10">
        <div className="max-w-2xl rounded-card bg-bg/85 p-4 backdrop-blur-sm">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Car explorer</h1>
          <p className="mt-3 text-lg text-muted">
            A schematic side view of a typical front-engined car. Select a part to learn what it
            does. Hover or focus a part to see what it connects to.
          </p>
        </div>
        <div className="mt-6">
          <CarExplorer
            parts={getDiagramParts()}
            systems={getSystems().map((s) => ({ id: s.id, name: s.name }))}
            readQueryString
          />
        </div>
      </Container>
    </div>
  );
}
