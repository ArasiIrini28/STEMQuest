import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }, info) => {
  if (!info.title.includes("welcome fact"))
    await page.addInitScript(() => {
      for (const id of ["explorer", "nova", "byte"])
        sessionStorage.setItem("stemquest-fact-welcome:" + id, "shown");
    });
});
test("companion processes messages, remembers context, links to real pages and isolates learner history", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".companion-card").click();
  const dialog = page.getByRole("dialog", { name: "Quest companion" });
  const input = dialog.getByLabel("Ask a learning question");
  await input.fill("daily fact");
  await input.press("Enter");
  await expect(
    dialog.getByText(/Sunlight takes about eight minutes/),
  ).toBeVisible();
  await input.fill("i cant find it");
  await dialog.getByRole("button", { name: "Send question" }).click();
  await expect(dialog.getByText(/Use “Open STEM facts”/)).toBeVisible();
  await dialog
    .getByRole("button", { name: "Open STEM facts", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "STEM facts", exact: true }),
  ).toBeVisible();
  await page.locator(".companion-card").click();
  await expect(
    dialog.getByText(/Sunlight takes about eight minutes/),
  ).toBeVisible();
  await input.fill("Explain fractions");
  await input.press("Enter");
  await expect(
    dialog.getByText(/Count equal parts \(the denominator\)/),
  ).toBeVisible();
  await input.fill("Give me an easier example");
  await input.press("Enter");
  await expect(
    dialog.getByText(/sandwich cut into four equal pieces/),
  ).toBeVisible();
  await expect(dialog.locator(".service-note")).toContainText(
    "Built-in study helper",
  );
  await page.keyboard.press("Escape");
  await page.goto("/#settings");
  await page
    .getByRole("button", { name: "Nova · Primary", exact: true })
    .click();
  await page.locator(".companion-card").click();
  await expect(
    dialog.getByText(/sandwich cut into four equal pieces/),
  ).toHaveCount(0);
  await dialog
    .getByRole("button", { name: "Help me with coding", exact: true })
    .click();
  await expect(dialog.getByText(/A loop repeats instructions/)).toBeVisible();
});
test("companion is keyboard accessible and fits mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.locator(".companion-card").click();
  const dialog = page.getByRole("dialog", { name: "Quest companion" });
  await expect(dialog.getByLabel("Ask a learning question")).toBeFocused();
  await dialog.getByLabel("Ask a learning question").fill("I can't find it");
  await page.keyboard.press("Enter");
  await expect(dialog.getByText(/What are you trying to find/)).toBeVisible();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    result.violations
      .filter((v) => ["critical", "serious"].includes(v.impact || ""))
      .map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.failureSummary) })),
  ).toEqual([]);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "work/companion-mobile.png" });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
test("welcome fact opens automatically and the next fact follows five active minutes", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Hey, Explorer!" }),
  ).toBeVisible();
  await page.clock.runFor(1100);
  const dialog = page.getByRole("dialog", { name: "Did You Know?" });
  await expect(dialog).toBeVisible();
  const first = await dialog.locator("h3").textContent();
  await dialog.getByRole("button", { name: "Cool! Continue" }).click();
  for (let n = 0; n < 29; n++) {
    await page.evaluate(() => window.dispatchEvent(new Event("pointerdown")));
    await page.clock.runFor(10000);
  }
  await expect(dialog).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event("pointerdown")));
  await page.clock.runFor(11000);
  await expect(dialog).toBeVisible();
  expect(await dialog.locator("h3").textContent()).not.toBe(first);
});
test("quiz automatically saves a 66.7 percent report, survives refresh and records a separate retake", async ({
  page,
}) => {
  await page.goto("/#lesson:fraction-flight");
  await page.getByRole("button", { name: "Take lesson quiz" }).click();
  await page.getByRole("button", { name: "Start or resume quiz" }).click();
  await page.getByRole("button", { name: "A 1/4", exact: true }).click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page
    .getByRole("button", { name: "Next quiz question", exact: true })
    .click();
  for (const s of ["2/4", "3/6", "4/8"])
    await page.getByLabel(s, { exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page
    .getByRole("button", { name: "Next quiz question", exact: true })
    .click();
  await page.getByLabel("Your answer", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Check answer" }).click();
  const report = page.getByRole("region", { name: "Assessment report" });
  await expect(report).toBeVisible();
  await expect(
    report.getByText("Accuracy: 66.7%", { exact: true }),
  ).toBeVisible();
  await expect(report.getByText("Incorrect: 1", { exact: true })).toBeVisible();
  await report
    .getByRole("button", { name: "Review Mistakes", exact: true })
    .click();
  await expect(
    report.getByText(/Your fuel tank has 4 equal sections/),
  ).toBeVisible();
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem("stemquest-demo-v1")!).xp,
  );
  await page.goto("/#reports");
  await page.getByRole("button", { name: "Open saved report" }).click();
  await expect(
    report.getByText("Accuracy: 66.7%", { exact: true }),
  ).toBeVisible();
  // A stale legacy snapshot must not overwrite the active learner's roster.
  await page.evaluate(() => localStorage.setItem("stemquest-demo-v1", "{}"));
  await page.reload();
  await page.getByRole("button", { name: "Open saved report" }).click();
  await expect(
    report.getByText("Accuracy: 66.7%", { exact: true }),
  ).toBeVisible();
  await report
    .getByRole("button", { name: "Practice More", exact: true })
    .click();
  await page.getByRole("button", { name: "Start or resume quiz" }).click();
  await page.getByRole("button", { name: "B 1/2", exact: true }).click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page
    .getByRole("button", { name: "Next quiz question", exact: true })
    .click();
  for (const s of ["2/4", "3/6", "4/8"])
    await page.getByLabel(s, { exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page
    .getByRole("button", { name: "Next quiz question", exact: true })
    .click();
  await page.getByLabel("Your answer", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    report.getByText("XP this attempt: 25", { exact: true }),
  ).toBeVisible();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("stemquest-demo-v1")!),
  );
  expect(state.xp).toBe(before + 25);
  expect(
    state.learningReports.filter(
      (r: { kind: string }) => r.kind === "assessment",
    ),
  ).toHaveLength(2);
  await page.screenshot({ path: "work/assessment-report.png", fullPage: true });
});
test("subject milestone waits for every required activity", async ({
  page,
}) => {
  await page.goto("/#quiz:spaceship-fuel");
  await page.getByRole("button", { name: "Start or resume quiz" }).click();
  for (let n = 1; n <= 6; n++)
    await page
      .getByRole("button", { name: `Fuel cell ${n}`, exact: true })
      .click();
  await page.getByRole("button", { name: "Launch spaceship" }).click();
  await expect(
    page.getByRole("region", { name: "Assessment report" }),
  ).toBeVisible();
  let state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("stemquest-demo-v1")!),
  );
  expect(
    state.learningReports.some((r: { kind: string }) => r.kind === "subject"),
  ).toBe(false);
  await page.goto("/#quiz:fraction-flight");
  await page.getByRole("button", { name: "Start or resume quiz" }).click();
  await page.getByRole("button", { name: "B 1/2", exact: true }).click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page
    .getByRole("button", { name: "Next quiz question", exact: true })
    .click();
  for (const s of ["2/4", "3/6", "4/8"])
    await page.getByLabel(s, { exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page
    .getByRole("button", { name: "Next quiz question", exact: true })
    .click();
  await page.getByLabel("Your answer", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Check answer" }).click();
  await page
    .getByRole("region", { name: "Assessment report" })
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Subject completion report" }),
  ).toBeVisible();
  state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("stemquest-demo-v1")!),
  );
  expect(
    state.learningReports.filter((r: { kind: string }) => r.kind === "subject"),
  ).toHaveLength(1);
});
