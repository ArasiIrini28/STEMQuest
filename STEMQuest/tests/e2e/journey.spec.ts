import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("explorer completes maze, earns XP once, and retains progress", async ({
  page,
}) => {
  await page.goto("/#lesson:robot-rescue");
  await page.getByRole("button", { name: "Let’s begin" }).click();
  await page.getByRole("button", { name: "Add right", exact: true }).click();
  await page.getByRole("button", { name: "Run code", exact: true }).click();
  await expect(
    page.getByText("You’re learning. Give it another try!"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset program" }).click();
  for (const d of ["up", "up", "right", "right", "up", "up", "right", "right"])
    await page.getByRole("button", { name: "Add " + d, exact: true }).click();
  await page.getByRole("button", { name: "Run code", exact: true }).click();
  await expect(page.getByText("Nicely done! +60 XP")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Let’s begin" }).click();
  for (const d of ["up", "up", "right", "right", "up", "up", "right", "right"])
    await page.getByRole("button", { name: "Add " + d, exact: true }).click();
  await page.getByRole("button", { name: "Run code", exact: true }).click();
  await expect(
    page.getByText("You’ve got it! Already mastered."),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("stemquest-demo-v1")!),
  );
  expect(saved.xp).toBe(60);
  expect(saved.days.length).toBe(1);
});
test("onboarding personalizes the dashboard and settings persist", async ({
  page,
}) => {
  await page.goto("/#onboarding");
  await page.getByLabel("Explorer nickname").fill("Nova");
  await page
    .getByRole("combobox", { name: "Learning level", exact: true })
    .selectOption("College");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Start my adventure" }).click();
  await expect(page.getByRole("heading", { name: "Hey, Nova!" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Hey, Nova!" })).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Reduced motion").check();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByText("Your preferences are saved.")).toBeVisible();
});
test("catalogue filters and no-results recovery work", async ({ page }) => {
  await page.goto("/#catalogue");
  await page.getByLabel("Filter learning level").selectOption("College");
  await expect(
    page.getByRole("heading", { name: "Become a data detective" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Fractions in flight" }),
  ).toHaveCount(0);
  await page.getByLabel("Search lessons", { exact: true }).fill("zzzz");
  await expect(
    page.getByRole("heading", { name: "No adventures found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(
    page.getByRole("heading", { name: "Fractions in flight" }),
  ).toBeVisible();
});
test("teacher demo creates a class and an assignment", async ({ page }) => {
  await page.goto("/#teacher");
  await page.getByLabel("New class name").fill("Demo inventors");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(
    page.getByText("Demo class created on this device."),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Class", exact: true })
    .selectOption({ label: "Demo inventors" });
  await page.getByLabel("Due date").fill("2027-12-31");
  await page.getByRole("button", { name: "Assign lesson" }).click();
  await expect(page.getByText("Demo assignment saved.")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("cell", { name: "Fractions in flight" }),
  ).toBeVisible();
});
test("mobile navigation, layout and keyboard access work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Hey, Explorer!" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("button", { name: "Learning worlds", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "A world of possibilities" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "work/mobile-worlds.png", fullPage: true });
  await page.goto("/#lesson:fraction-flight");
  await page.getByRole("button", { name: "Let’s begin" }).click();
  await page.getByRole("button", { name: "B 1/2" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("Nicely done! +25 XP")).toBeVisible();
});
test("all main views load without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "welcome",
    "dashboard",
    "worlds",
    "catalogue",
    "coding",
    "simulations",
    "missions",
    "achievements",
    "leaderboard",
    "progress",
    "settings",
    "teacher",
    "guardian",
    "admin",
    "notifications",
    "help",
    "privacy",
    "login",
    "signup",
    "forgot",
  ]) {
    await page.goto("/#" + route);
    await expect(page.locator("h1,h2").first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test("dashboard has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Hey, Explorer!" }),
  ).toBeVisible();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  const severe = result.violations.filter((v) =>
    ["critical", "serious"].includes(v.impact || ""),
  );
  expect(
    severe.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  ).toEqual([]);
});
test("fuel game, profile switching and rankings use earned activity", async ({
  page,
}) => {
  await page.goto("/#lesson:spaceship-fuel");
  await page.getByRole("button", { name: "Let’s begin" }).click();
  await page.getByRole("button", { name: "Launch spaceship" }).click();
  await expect(
    page.getByText("You’re learning. Give it another try!"),
  ).toBeVisible();
  for (let i = 1; i <= 6; i++)
    await page
      .getByRole("button", { name: `Fuel cell ${i}`, exact: true })
      .click();
  await page.getByRole("button", { name: "Launch spaceship" }).click();
  await expect(page.getByText("Nicely done! +40 XP")).toBeVisible();
  await page.goto("/#leaderboard");
  await expect(
    page.getByRole("heading", { name: "Explorer (you)", exact: true }),
  ).toBeVisible();
  await page.goto("/#settings");
  await page
    .getByRole("button", { name: "Nova · Primary", exact: true })
    .click();
  await page.goto("/#dashboard");
  await expect(page.getByRole("heading", { name: "Hey, Nova!" })).toBeVisible();
  await page.goto("/#leaderboard");
  await expect(
    page.getByRole("heading", { name: "Explorer", exact: true }),
  ).toBeVisible();
  await page.goto("/#settings");
  await page.getByRole("button", { name: "Explorer", exact: true }).click();
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("stemquest-demo-v1")!),
  );
  expect(s.xp).toBe(40);
});
test("memory game handles mismatches and all three pairs", async ({ page }) => {
  await page.goto("/#lesson:fraction-memory");
  await page.getByRole("button", { name: "Let’s begin" }).click();
  await page.getByRole("button", { name: "Turn card 1", exact: true }).click();
  await page.getByRole("button", { name: "Turn card 2", exact: true }).click();
  await expect(
    page.getByText(
      "Different values. Remember their places and try another pair.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Turn card 1", exact: true }),
  ).toBeEnabled();
  for (const n of [1, 4, 2, 6, 3, 5])
    await page
      .getByRole("button", { name: `Turn card ${n}`, exact: true })
      .click();
  await expect(page.getByText("Nicely done! +45 XP")).toBeVisible();
});
test("circuit controls compute current and reset", async ({ page }) => {
  await page.goto("/#simulations");
  await expect(page.getByText("0.00 A", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close switch" }).click();
  await expect(page.getByText("0.30 A", { exact: true })).toBeVisible();
  await page.getByLabel("Battery voltage", { exact: true }).fill("12");
  await expect(page.getByText("0.60 A", { exact: true })).toBeVisible();
  await page.getByLabel("Lamp resistance", { exact: true }).fill("40");
  await expect(page.getByText("0.30 A", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Reset experiment", exact: true })
    .click();
  await expect(page.getByText("0.00 A", { exact: true })).toBeVisible();
});
test("admin authors, publishes and plays a persisted lesson", async ({
  page,
}) => {
  await page.goto("/#admin");
  await page
    .getByLabel("Lesson title", { exact: true })
    .fill("Test star counting");
  await page
    .getByLabel("Learning explanation", { exact: true })
    .fill("One star and another star make two stars. Count each star once.");
  await page
    .getByLabel("Assessment question", { exact: true })
    .fill("How many stars?");
  for (let i = 1; i <= 3; i++)
    await page
      .getByLabel(`Answer choice ${i}`, { exact: true })
      .fill(String(i));
  await page
    .getByRole("combobox", { name: "Correct answer", exact: true })
    .selectOption("1");
  await page
    .getByLabel("Answer explanation", { exact: true })
    .fill("One plus one equals two.");
  await page.getByRole("button", { name: "Save lesson", exact: true }).click();
  await expect(
    page.getByText("Draft saved. Only administrators can see it."),
  ).toBeVisible();
  await page.getByLabel("Publish in the catalogue").check();
  await page.getByRole("button", { name: "Save lesson", exact: true }).click();
  await page.getByRole("link", { name: "Open lesson" }).click();
  await page.getByRole("button", { name: "Let’s begin" }).click();
  await page.getByRole("button", { name: "B 2", exact: true }).click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("Nicely done! +25 XP")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Test star counting", exact: true }),
  ).toBeVisible();
});
test("missing account configuration explains setup and preserves demo access", async ({
  page,
}) => {
  await page.goto("/#login");
  await expect(
    page.getByText("Demo is ready to explore.", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Email address").fill("test@example.invalid");
  await page.getByLabel("Password", { exact: true }).fill("test-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByText("Account services are not connected yet.", { exact: false }),
  ).toBeVisible();
  await page.goto("/#catalogue");
  await expect(
    page.getByRole("heading", { name: "Fractions in flight", exact: true }),
  ).toBeVisible();
});
