import type { MDXComponents } from "mdx/types";
import { DiagramFocus } from "@/components/diagram/DiagramFocus";
import { ExplodedView } from "@/components/diagram/ExplodedView";
import { StepDoneToggle } from "@/components/progress/StepDoneToggle";
import { SafetyCallout, StepCard, Term, TorqueSpec } from "./lesson";

/**
 * Components available inside teardown MDX. `stepIds` (in body order, from the
 * content loader) gives each step its number; `slug` ties step progress to the guide.
 */
export function teardownComponents(slug: string, stepIds: string[]): MDXComponents {
  return {
    Step: ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
      <StepCard
        id={id}
        index={stepIds.indexOf(id) + 1}
        total={stepIds.length}
        title={title}
        aside={<StepDoneToggle slug={slug} stepId={id} title={title} />}
      >
        {children}
      </StepCard>
    ),
    DiagramFocus,
    ExplodedView,
    SafetyCallout,
    TorqueSpec,
    Term,
    ul: (props) => <ul className="list-disc space-y-1 pl-5 marker:text-accent" {...props} />,
    ol: (props) => <ol className="list-decimal space-y-1 pl-5" {...props} />,
    a: (props) => <a className="prose-link" {...props} />,
    strong: (props) => <strong className="font-semibold" {...props} />,
  };
}
