import { describe, expect, it } from "vitest";
import { checkReferences, loadContent, scanMdx } from "@/lib/content";
import { SYSTEM_IDS } from "@/lib/schemas";

describe("seed content", () => {
  const content = loadContent();

  it("loads without validation errors", () => {
    expect(content.systems.length).toBe(8);
  });

  it("has every system, in order", () => {
    expect(content.systems.map((s) => s.id).sort()).toEqual([...SYSTEM_IDS].sort());
    const orders = content.systems.map((s) => s.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("has about three parts per system", () => {
    expect(content.parts.length).toBeGreaterThanOrEqual(24);
    for (const s of content.systems) expect(s.partIds.length).toBeGreaterThanOrEqual(3);
  });

  it("has two complete teardowns with steps", () => {
    expect(content.teardowns.length).toBeGreaterThanOrEqual(2);
    for (const t of content.teardowns) {
      expect(t.stepIds.length).toBeGreaterThan(3);
      expect(new Set(t.stepIds).size).toBe(t.stepIds.length);
    }
  });

  it("has a quiz per system and about 30 glossary terms", () => {
    expect(content.quizzes.length).toBe(8);
    expect(content.glossary.length).toBeGreaterThanOrEqual(30);
  });

  it("gives every part a hotspot on the diagram", () => {
    const hotspotIds = new Set(content.hotspots.map((h) => h.id));
    for (const p of content.parts) expect(hotspotIds.has(p.location)).toBe(true);
  });

  it("never states an exact torque figure", () => {
    // Broad ranges ("80–140 N·m") are allowed; a single figure ("110 N·m") is not.
    const all = JSON.stringify(content.parts) + content.teardowns.map((t) => t.body).join("\n");
    const figures = [...all.matchAll(/(\d+(?:\s?[–-]\s?\d+)?)\s?N·?m\b/gi)].map((m) => m[1]!);
    for (const figure of figures) expect(figure).toMatch(/[–-]/);
  });
});

describe("reference checks", () => {
  const content = loadContent();

  it("reports a part pointing at a missing hotspot", () => {
    const broken = structuredClone(content);
    broken.parts[0]!.location = "nowhere";
    expect(checkReferences(broken).join("\n")).toMatch(/location "nowhere"/);
  });

  it("reports an unknown hero slot", () => {
    const broken = structuredClone(content);
    broken.systems[0]!.heroSlot = "not-a-slot";
    expect(checkReferences(broken).join("\n")).toMatch(/heroSlot "not-a-slot"/);
  });

  it("reports an unknown part hero slot", () => {
    const broken = structuredClone(content);
    broken.parts[0]!.heroSlot = "not-a-slot";
    expect(checkReferences(broken).join("\n")).toMatch(/part ".+": heroSlot "not-a-slot"/);
  });

  it("reports duplicate step ids and unknown DiagramFocus parts", () => {
    const broken = structuredClone(content);
    broken.teardowns[0]!.body =
      '<Step id="a" title="A">x</Step><Step id="a" title="B"><DiagramFocus part="ghost" /></Step>';
    const issues = checkReferences(broken).join("\n");
    expect(issues).toMatch(/duplicate step id "a"/);
    expect(issues).toMatch(/DiagramFocus part="ghost"/);
  });

  it("reports a connectsTo that points nowhere", () => {
    const broken = structuredClone(content);
    broken.parts[0]!.connectsTo = ["ghost-part"];
    expect(checkReferences(broken).join("\n")).toMatch(/connectsTo unknown part "ghost-part"/);
  });
});

describe("scanMdx", () => {
  it("finds steps and component props", () => {
    const scan = scanMdx(
      `<Step id="one" title="First">\n<DiagramFocus part="brake-pads" />\n<Term id="caliper">x</Term>\n</Step>`,
    );
    expect(scan.steps).toEqual([{ id: "one", title: "First" }]);
    expect(scan.diagramFocus).toEqual(["brake-pads"]);
    expect(scan.terms).toEqual(["caliper"]);
  });
});
