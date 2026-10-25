import { describe, it, expect } from "vitest";
import {
  award,
  initialState,
  runMaze,
  runPythonSubset,
  streak,
  dayKey,
  reminderEligible,
  validateAnswer,
} from "../src/lib/engine";
import { lessons } from "../src/lib/content";
const activity = lessons[0].activities[0];
describe("learning rewards", () => {
  it("gives no XP for a wrong answer", () => {
    const s = award(initialState, "fraction-flight", activity, "1/4");
    expect(s.xp).toBe(0);
    expect(s.days).toEqual([]);
  });
  it("awards only once despite repeat submissions", () => {
    const one = award(initialState, "fraction-flight", activity, "1/2");
    const two = award(one, "fraction-flight", activity, "1/2");
    expect(two.xp).toBe(25);
    expect(two.coins).toBe(5);
    expect(two.completed).toHaveLength(1);
    expect(two.attempts).toHaveLength(2);
  });
  it("rejects duplicate multi-select options", () =>
    expect(
      validateAnswer(lessons[0].activities[1], ["2/4", "3/6", "4/8", "4/8"]),
    ).toBe(false));
  it("never grades a reflection automatically", () =>
    expect(
      validateAnswer(
        lessons.find((l) => l.id === "bridge-builder")!.activities[1],
        "reflection",
      ),
    ).toBe(false));
});
describe("robot and code safety", () => {
  it("runs a valid maze solution", () =>
    expect(
      runMaze(["up", "up", "right", "right", "up", "up", "right", "right"])
        .success,
    ).toBe(true));
  it("rejects walls and invalid commands", () => {
    expect(runMaze(["right"]).success).toBe(false);
    expect(runMaze(["teleport"]).success).toBe(false);
  });
  it("limits instruction count", () =>
    expect(runMaze(Array(41).fill("up")).success).toBe(false));
  it("evaluates only the supported Python subset", () => {
    expect(runPythonSubset("for i in range(5):\n    print(i)").output).toBe(
      "0\n1\n2\n3\n4",
    );
    expect(runPythonSubset('__import__("os").system("x")').ok).toBe(false);
    expect(runPythonSubset("for i in range(99):\n    print(i)").ok).toBe(false);
  });
});
describe("streak and reminders", () => {
  it("handles duplicate days and yesterday grace", () =>
    expect(
      streak(["2026-10-16", "2026-10-17", "2026-10-17"], "2026-10-18"),
    ).toEqual({ current: 2, longest: 2 }));
  it("resets current streak after a rest gap but keeps best", () =>
    expect(streak(["2026-10-14", "2026-10-15"], "2026-10-18")).toEqual({
      current: 0,
      longest: 2,
    }));
  it("uses real timezone dates at DST boundaries", () => {
    expect(dayKey(new Date("2026-11-01T05:30:00Z"), "America/New_York")).toBe(
      "2026-11-01",
    );
    expect(dayKey(new Date("2026-11-01T06:30:00Z"), "America/New_York")).toBe(
      "2026-11-01",
    );
  });
  it("respects midnight quiet hours, cooldown, consent and activity", () => {
    const p = {
      enabled: true,
      consent: true,
      hour: 18,
      quietStart: 20,
      quietEnd: 8,
      lastSentHours: 25,
      learnedToday: false,
    };
    expect(reminderEligible(p)).toBe(true);
    for (const change of [
      { hour: 22 },
      { hour: 7 },
      { consent: false },
      { lastSentHours: 12 },
      { learnedToday: true },
      { enabled: false },
    ])
      expect(reminderEligible({ ...p, ...change })).toBe(false);
  });
});
