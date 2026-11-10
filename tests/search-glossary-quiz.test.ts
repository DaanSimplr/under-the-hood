import { describe, expect, it } from "vitest";
import { getContent } from "@/lib/content";
import { buildGlossaryMatcher, linkifyGlossary } from "@/lib/glossary";
import { isCorrect, scoreAnswers, scoreMessage } from "@/lib/quiz";
import { buildSearchPayload, searcherFromPayload } from "@/lib/search";

describe("search", () => {
  // Round-trip through JSON, exactly like the browser receives it.
  const payload = JSON.parse(JSON.stringify(buildSearchPayload(getContent())));
  const searcher = searcherFromPayload(payload);
  const top = (q: string) => searcher.search(q)[0]?.item;

  it("indexes parts, systems, guides and glossary terms", () => {
    const types = new Set(payload.docs.map((d: { type: string }) => d.type));
    expect([...types].sort()).toEqual(["glossary", "part", "system", "teardown"]);
  });

  it("finds parts by name and by alias", () => {
    expect(top("alternator")?.url).toMatch(/alternator/);
    expect(top("gearbox")?.url).toBe("/parts/transmission/");
    expect(top("silencer")?.url).toBe("/parts/muffler/");
  });

  it("tolerates small typos", () => {
    expect(top("radiater")?.url).toBe("/parts/radiator/");
  });

  it("finds guides", () => {
    expect(searcher.search("brake pads").map((r) => r.item.url)).toContain(
      "/teardowns/replace-front-brake-pads/",
    );
  });
});

describe("glossary linking", () => {
  const matcher = buildGlossaryMatcher([
    { id: "caliper", term: "Caliper", aka: [], definition: "clamp" },
    { id: "brake-fluid", term: "Brake fluid", aka: [], definition: "liquid" },
    { id: "abs", term: "ABS", aka: ["anti-lock brakes"], definition: "anti-lock" },
  ]);

  it("links the first use of each term, plurals included", () => {
    const segs = linkifyGlossary("Calipers push pads. The caliper again.", matcher);
    const terms = segs.filter((s) => s.kind === "term");
    expect(terms).toHaveLength(1);
    expect(terms[0]).toMatchObject({ id: "caliper", text: "Calipers" });
    expect(segs.map((s) => s.text).join("")).toBe("Calipers push pads. The caliper again.");
  });

  it("prefers the longest phrase and matches aliases", () => {
    const segs = linkifyGlossary("Brake fluid and anti-lock brakes.", matcher);
    expect(segs.filter((s) => s.kind === "term").map((s) => s.kind === "term" && s.id)).toEqual([
      "brake-fluid",
      "abs",
    ]);
  });

  it("does not match inside other words", () => {
    expect(linkifyGlossary("absorbs bumps", matcher).every((s) => s.kind === "text")).toBe(true);
  });

  it("respects exclude and a shared seen set", () => {
    const seen = new Set<string>();
    linkifyGlossary("caliper", matcher, { seen });
    expect(linkifyGlossary("caliper", matcher, { seen }).every((s) => s.kind === "text")).toBe(
      true,
    );
    expect(linkifyGlossary("ABS", matcher, { exclude: new Set(["abs"]) })[0]?.kind).toBe("text");
  });

  it("links real glossary terms in real part text", () => {
    const c = getContent();
    const m = buildGlossaryMatcher(c.glossary);
    const caliper = c.parts.find((p) => p.id === "brake-caliper")!;
    const ids = linkifyGlossary(caliper.howItWorks, m).flatMap((s) =>
      s.kind === "term" ? [s.id] : [],
    );
    expect(ids).toContain("brake-fluid");
    expect(ids).toContain("piston");
  });
});

describe("quiz scoring", () => {
  const qs = [
    { answerIndex: 1, options: ["a", "b"] },
    { answerIndex: 0, options: ["a", "b"] },
  ];

  it("scores answers, treating unanswered as wrong", () => {
    expect(isCorrect(qs[0]!, null)).toBe(false);
    expect(scoreAnswers(qs, [1, null])).toEqual({ correct: 1, total: 2, pct: 0.5 });
    expect(scoreAnswers(qs, [1, 0]).correct).toBe(2);
  });

  it("gives an encouraging message", () => {
    expect(scoreMessage(2, 2)).toMatch(/Perfect/);
    expect(scoreMessage(0, 2)).toMatch(/Keep going/);
  });

  it("has valid answers for every seed quiz", () => {
    for (const quiz of getContent().quizzes)
      for (const q of quiz.questions) expect(q.options[q.answerIndex]).toBeTruthy();
  });
});
