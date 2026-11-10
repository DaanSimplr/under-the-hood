import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import brakesQuiz from "../content/quizzes/brakes.json" with { type: "json" };

/** Fails the test on any uncaught page error or console error. */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
}

test.describe("pages", () => {
  test("home renders the hero slot as a placeholder and the entry points", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("how a car fits together");
    const hero = page.locator('[data-media-slot="home-hero-loop"]');
    await expect(hero).toHaveAttribute("data-media-state", "placeholder");
    await expect(hero).toContainText("home-hero-loop");
    await expect(page.getByRole("link", { name: "Explore the car" }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("systems grid lists all eight systems with their hero slots", async ({ page }) => {
    await page.goto("/systems/");
    await expect(page.getByTestId("systems-grid").locator("> li")).toHaveCount(8);
    await expect(page.locator('[data-media-slot^="system-"]')).toHaveCount(8);
  });

  test("a part page shows the diagram focus and links jargon to the glossary", async ({ page }) => {
    await page.goto("/parts/brake-caliper/");
    await expect(page.getByRole("heading", { level: 1, name: "Brake caliper" })).toBeVisible();
    await expect(page.locator('[data-diagram-focus="brake-caliper"]')).toBeVisible();
    await expect(page.locator('a.term-link[href="/glossary/#brake-fluid"]').first()).toBeVisible();
  });

  test("teardown shows all core safety callouts and numbered steps", async ({ page }) => {
    await page.goto("/teardowns/replace-front-brake-pads/");
    const safety = page.getByTestId("safety-callouts");
    for (const topic of [
      "jack-stands",
      "battery-disconnect",
      "hot-fluids",
      "airbags",
      "ev-high-voltage",
    ]) {
      await expect(safety.locator(`[data-safety-topic="${topic}"]`)).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: /Step 1 of 12/ })).toBeVisible();
    await expect(page.locator('[data-media-slot="workshop-ambient-loop"]')).toBeVisible();
  });

  test("unknown routes show the 404 page", async ({ page }) => {
    const res = await page.goto("/parts/flux-capacitor/");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "This part is missing" })).toBeVisible();
  });
});

test.describe("explorer", () => {
  test("mouse: selecting a hotspot opens the drawer", async ({ page }) => {
    await page.goto("/explorer/");
    await page.locator('[data-hotspot="alternator"]').click();
    const drawer = page.getByTestId("explorer-drawer");
    await expect(drawer.getByRole("heading", { name: "Alternator" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: /Read about the alternator/ })).toHaveAttribute(
      "href",
      "/parts/alternator/",
    );
  });

  test("keyboard: Enter opens, Escape closes and returns focus", async ({ page }) => {
    await page.goto("/explorer/");
    const battery = page.locator('[data-hotspot="battery"]');
    await battery.focus();
    await page.keyboard.press("Enter");
    const heading = page
      .getByTestId("explorer-drawer")
      .getByRole("heading", { name: "12-volt battery" });
    await expect(heading).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(heading).toHaveCount(0);
    await expect(battery).toBeFocused();
  });

  test("filtering by system hides other hotspots", async ({ page }) => {
    await page.goto("/explorer/");
    await page.getByRole("button", { name: "Brakes", exact: true }).click();
    await expect(page.locator('[data-hotspot="brake-pads"]')).toBeVisible();
    await expect(page.locator('[data-hotspot="battery"]')).toHaveCount(0);
  });

  test("the 3D exploded view loads lazily on the brakes page", async ({ page }) => {
    const requestedThree: string[] = [];
    page.on("request", (r) => {
      if (/ExplodedViewCanvas|three/i.test(r.url())) requestedThree.push(r.url());
    });
    await page.goto("/systems/brakes/");
    const view = page.getByTestId("exploded-view");
    await view.scrollIntoViewIfNeeded();
    // Either the WebGL canvas, or the graceful fallback if WebGL is unavailable.
    await expect(view.locator("canvas, :text('could not start')").first()).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: "Explode", exact: true }).click();
    await expect(view.getByRole("slider")).toHaveValue("100");
  });
});

test.describe("progress, quiz and search", () => {
  test("marking a part as learned persists and shows on the progress page", async ({ page }) => {
    await page.goto("/parts/battery/");
    const btn = page.getByTestId("mark-learned");
    await expect(btn).toBeEnabled();
    await btn.click();
    await expect(btn).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(page.getByTestId("mark-learned")).toHaveAttribute("aria-pressed", "true");
    await page.goto("/progress/");
    await expect(page.getByTestId("stat-parts-learned")).toContainText("1 / 25");
  });

  test("ticking a teardown step updates the guide progress", async ({ page }) => {
    await page.goto("/teardowns/remove-alternator/");
    await expect(page.getByTestId("teardown-progress")).toContainText("0 of 11 steps done");
    await page.locator('[data-step-toggle="confirm"]').check();
    await expect(page.getByTestId("teardown-progress")).toContainText("1 of 11 steps done");
  });

  test("quiz: answering every question correctly gives a perfect score", async ({ page }) => {
    await page.goto("/quiz/brakes/");
    for (const q of brakesQuiz.questions) {
      await page.getByRole("radio", { name: q.options[q.answerIndex]!, exact: true }).check();
      await page.getByRole("button", { name: "Check answer" }).click();
      await expect(page.getByText("Correct!")).toBeVisible();
      await page.getByRole("button", { name: /Next question|See results/ }).click();
    }
    await expect(page.getByTestId("quiz-result")).toContainText(
      `You scored ${brakesQuiz.questions.length} out of ${brakesQuiz.questions.length}`,
    );
    await page.goto("/quiz/");
    await expect(
      page.getByText(`Best: ${brakesQuiz.questions.length}/${brakesQuiz.questions.length}`),
    ).toBeVisible();
  });

  test("search: '/' opens it, Enter goes to the top result", async ({ page }) => {
    await page.goto("/glossary/");
    await page.waitForLoadState("networkidle");
    await page.keyboard.press("/");
    const input = page.getByTestId("search-input");
    await expect(input).toBeFocused();
    await input.fill("alternator");
    await expect(page.getByRole("option").first()).toContainText("Alternator");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/parts\/alternator\/$/);
  });

  test("theme toggle switches and remembers dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.getByTestId("theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("accessibility", () => {
  for (const path of [
    "/",
    "/systems/brakes/",
    "/parts/alternator/",
    "/teardowns/replace-front-brake-pads/",
    "/explorer/",
    "/quiz/engine/",
    "/glossary/",
    "/progress/",
  ]) {
    test(`no serious axe violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(
        serious.map(
          (v) =>
            `${v.id}: ${v.nodes
              .map((n) => n.target.join(" "))
              .slice(0, 3)
              .join(" | ")}`,
        ),
      ).toEqual([]);
    });
  }

  test("dark mode passes colour contrast on the home page", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    expect(results.violations.map((v) => v.nodes.map((n) => n.target.join(" ")))).toEqual([]);
  });
});

test.describe("mobile @mobile", () => {
  for (const path of [
    "/",
    "/systems/",
    "/parts/strut/",
    "/teardowns/replace-front-brake-pads/",
    "/explorer/",
    "/quiz/cooling/",
    "/progress/",
    "/glossary/",
  ]) {
    test(`no horizontal scroll at 375px on ${path} @mobile`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("mobile menu opens and navigates @mobile", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.locator("#mobile-nav").getByRole("link", { name: "Teardowns" }).click();
    await expect(page).toHaveURL(/\/teardowns\/$/);
  });
});
