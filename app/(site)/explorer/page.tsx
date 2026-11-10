import type { Metadata } from "next";
import { MediaSlot } from "@/components/media/MediaSlot";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Car explorer",
  description: "An interactive diagram of a whole car. Click a part to learn what it does.",
};

export default function ExplorerPage() {
  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 opacity-60">
        <MediaSlot id="explorer-bg-loop" fill priority />
      </div>
      <Container className="py-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Car explorer</h1>
          <p className="mt-3 text-lg text-muted">
            A schematic side view of a typical front-engined car. Select a part to learn what it
            does. Hover or focus a part to see what it connects to.
          </p>
        </div>
      </Container>
    </div>
  );
}
