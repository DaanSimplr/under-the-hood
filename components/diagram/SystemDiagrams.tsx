import { SectionHeading } from "@/components/ui/primitives";
import { ASSEMBLY_IDS, assemblies } from "@/lib/assemblies";
import { getDiagramParts, getPartsForSystem, getSystems } from "@/lib/content";
import { CarExplorer } from "./CarExplorer";
import { ExplodedView } from "./ExplodedView";

/** The diagrams on a system page: the car explorer filtered to this system, and any exploded views. */
export function SystemDiagrams({ systemId }: { systemId: string }) {
  const partIds = new Set(getPartsForSystem(systemId).map((p) => p.id));
  const systemAssemblies = ASSEMBLY_IDS.filter((id) =>
    assemblies[id].pieces.some((piece) => piece.partId && partIds.has(piece.partId)),
  );

  return (
    <>
      <section aria-labelledby="diagram-heading">
        <SectionHeading id="diagram-heading">Where these parts sit</SectionHeading>
        <p className="mt-2 mb-4 max-w-prose text-muted">
          The diagram starts filtered to this system. Pick &ldquo;All systems&rdquo; to see how it
          connects to the rest of the car.
        </p>
        <CarExplorer
          parts={getDiagramParts()}
          systems={getSystems().map((s) => ({ id: s.id, name: s.name }))}
          initialSystem={systemId}
          heading="h3"
        />
      </section>
      {systemAssemblies.map((id) => (
        <section key={id} aria-labelledby={`exploded-${id}-heading`}>
          <SectionHeading id={`exploded-${id}-heading`}>
            {assemblies[id].title}: exploded view
          </SectionHeading>
          <div className="mt-4">
            <ExplodedView assembly={id} />
          </div>
        </section>
      ))}
    </>
  );
}
