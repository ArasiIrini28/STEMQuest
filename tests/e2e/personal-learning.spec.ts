import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    for (const id of ["explorer", "nova", "byte"])
      sessionStorage.setItem("stemquest-fact-welcome:" + id, "shown");
  });
});
test("focused practice rotates questions and completes after incorrect answers", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Recommended for You" }),
  ).toBeVisible();
  await page.goto("/#settings");
  await page.getByLabel("Learning level").selectOption("Primary");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByText("Your preferences are saved.")).toBeVisible();
  await page.getByRole("button", { name: "My dashboard", exact: true }).click();
  const card = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "Fractions in flight",
      exact: true,
    }),
  });
  await card.getByRole("button", { name: "Practice More" }).click();
  const practice = page.locator(".adaptive-panel");
  await practice.getByRole("button", { name: "A 1/4", exact: true }).click();
  await practice.getByRole("button", { name: "Check answer" }).click();
  await expect(
    practice.getByRole("button", { name: "Check answer" }),
  ).toBeDisabled();
  await practice
    .getByRole("button", { name: "Next practice question" })
    .click();
  await practice.getByLabel("1/3", { exact: true }).check();
  await practice.getByRole("button", { name: "Check answer" }).click();
  await practice
    .getByRole("button", { name: "Next practice question" })
    .click();
  await practice.getByLabel("Your answer", { exact: true }).fill("3");
  await practice.getByRole("button", { name: "Check answer" }).click();
  await practice
    .getByRole("button", { name: "Finish practice", exact: true })
    .click();
  await expect(
    page.getByText("Practice finished: 1/3 correct.", { exact: false }),
  ).toBeVisible();
  const attempts = await page.evaluate(
    () => JSON.parse(localStorage.getItem("stemquest-demo-v1")!).attempts,
  );
  expect(attempts).toHaveLength(3);
  expect(
    new Set(attempts.map((a: { activityId: string }) => a.activityId)).size,
  ).toBe(3);
});
test("session reports separate attempts and rewards and survive reload", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start Learning Session", exact: true })
    .click();
  await expect(
    page.getByText("Learning session in progress", { exact: true }),
  ).toBeVisible();
  await page.goto("/#lesson:fraction-flight");
  await page.getByRole("button", { name: "Let’s begin" }).click();
  await page.getByRole("button", { name: "A 1/4", exact: true }).click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    page.getByText("You’re learning. Give it another try!"),
  ).toBeVisible();
  await page.getByRole("button", { name: "B 1/2", exact: true }).click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("Nicely done! +25 XP")).toBeVisible();
  await page.goto("/#dashboard");
  await page
    .getByRole("button", { name: "Finish Learning", exact: true })
    .click();
  const report = page.getByRole("region", { name: "Learning outcome report" });
  await expect(
    report.getByText("2 scored answers: 1 correct, 1 incorrect").first(),
  ).toBeVisible();
  await expect(report.getByText("Accuracy: 50% · 25 XP").first()).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /View saved report/ }).click();
  await expect(report.getByText("Accuracy: 50% · 25 XP").first()).toBeVisible();
});
test("facts rotate, close with Escape, and do not award XP", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: /Discover a STEM fact/ }).click();
  const dialog = page.getByRole("dialog", { name: "Did You Know?" });
  await expect(dialog).toBeVisible();
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    accessibility.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || ""),
    ),
  ).toEqual([]);
  const first = await dialog.locator("h3").textContent();
  await dialog.getByRole("button", { name: "Another Fact" }).click();
  expect(await dialog.locator("h3").textContent()).not.toBe(first);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("stemquest-demo-v1")!).xp,
    ),
  ).toBe(0);
});
test("fact clock defers while learning and shows once when safe", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/#lesson:fraction-flight");
  await expect(
    page.getByRole("heading", { name: "Fractions in flight", exact: true }),
  ).toBeVisible();
  for (let n = 0; n < 31; n++) {
    await page.evaluate(() => window.dispatchEvent(new Event("pointerdown")));
    await page.clock.runFor(10000);
  }
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.evaluate(() => {
    location.hash = "dashboard";
  });
  await expect(
    page.getByRole("heading", { name: "Recommended for You" }),
  ).toBeVisible();
  await page.clock.runFor(1000);
  await expect(
    page.getByRole("dialog", { name: "Did You Know?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cool! Continue" }).click();
  await page.clock.runFor(2000);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
