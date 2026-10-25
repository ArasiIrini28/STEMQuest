import { describe, it, expect } from "vitest";
import {
  topicEvidence,
  recommendations,
  reportTotals,
  choosePractice,
  learningPolicy,
  practiceTarget,
} from "../src/lib/personalization";
import { facts, nextFact, factClock, FACT_INTERVAL } from "../src/lib/facts";
import { lessons } from "../src/lib/content";
import { initialState } from "../src/lib/engine";
import type { Attempt } from "../src/lib/types";
const attempt = (
  id: string,
  correct: boolean,
  at = "2026-10-24T09:00:00Z",
  xp = 0,
): Attempt => ({
  lessonId: "fraction-flight",
  activityId: id,
  correct,
  score: correct ? 100 : 0,
  at,
  xp,
});
describe("learning evidence", () => {
  it("steps back to a real prerequisite after repeated mistakes and advances only with evidence", () => {
    const fuel = lessons.find((l) => l.id === "spaceship-fuel")!;
    const fraction = lessons.find((l) => l.id === "fraction-flight")!;
    const misses = [attempt("a", false), attempt("a", false)].map((a) => ({
      ...a,
      lessonId: fuel.id,
    }));
    expect(practiceTarget(fuel, lessons, misses).lesson.id).toBe(fraction.id);
    expect(
      practiceTarget(fraction, lessons, [attempt("a", true)]).lesson.id,
    ).toBe(fraction.id);
    const mastered = [
      attempt("a", true),
      attempt("b", true),
      attempt("a", true),
    ];
    expect(["spaceship-fuel", "fraction-memory"]).toContain(
      practiceTarget(fraction, lessons, mastered).lesson.id,
    );
  });
  it("never claims mastery from a single correct answer or repeated one-question answers", () => {
    expect(
      topicEvidence([attempt("a", true)], "fraction-flight").mastered,
    ).toBe(false);
    expect(
      topicEvidence(Array(8).fill(attempt("a", true)), "fraction-flight")
        .enough,
    ).toBe(false);
  });
  it("classifies low scores with multiple question evidence", () => {
    expect(
      topicEvidence(
        [attempt("a", false), attempt("b", false), attempt("a", true)],
        "fraction-flight",
      ).band,
    ).toBe("Needs more practice");
  });
  it("recognizes recent improvement only on comparable question sets", () => {
    const prior = Array.from({ length: 8 }, (_, i) =>
      attempt(String(i % 2), false),
    );
    const recent = Array.from({ length: 8 }, (_, i) =>
      attempt(String(i % 2), true, "2026-10-24T10:00:00Z"),
    );
    expect(
      topicEvidence([...prior, ...recent], "fraction-flight").improvement,
    ).toBe(100);
    expect(
      topicEvidence(
        [...prior, ...recent.map((a) => ({ ...a, activityId: "different" }))],
        "fraction-flight",
      ).improvement,
    ).toBeNull();
  });
  it("ranks a low score above unexplored subjects and filters missing prerequisites", () => {
    const state = {
      ...initialState,
      attempts: [attempt("a", false), attempt("b", false), attempt("a", true)],
    };
    const r = recommendations(state, lessons);
    expect(r[0].lesson.id).toBe("fraction-flight");
    expect(
      r
        .flatMap((x) => x.foundation)
        .every((id) => lessons.some((l) => l.id === id)),
    ).toBe(true);
    expect(recommendations(state, [])).toEqual([]);
  });
  it("uses configurable thresholds", () => {
    const old = learningPolicy.strong;
    try {
      learningPolicy.strong = 60;
      expect(
        topicEvidence(
          [attempt("a", true), attempt("b", true), attempt("a", false)],
          "fraction-flight",
        ).mastered,
      ).toBe(true);
    } finally {
      learningPolicy.strong = old;
    }
  });
  it("selects unattempted or missed real questions before mastered ones", () => {
    const l = lessons[0];
    expect(choosePractice(l, [attempt(l.activities[0].id, true)])?.id).not.toBe(
      l.activities[0].id,
    );
  });
});
describe("session reports", () => {
  it("separates session and daily totals with no reward mutation", () => {
    const rows = [
      attempt("a", true, "2026-10-24T08:00:00Z", 25),
      attempt("b", false, "2026-10-24T09:00:00Z"),
      attempt("b", true, "2026-10-24T09:30:00Z", 30),
    ];
    const r = reportTotals(
      rows,
      "2026-10-24T08:30:00Z",
      "2026-10-24T10:00:00Z",
      "UTC",
    );
    expect(r.session).toMatchObject({
      questions: 2,
      correct: 1,
      incorrect: 1,
      accuracy: 50,
      xp: 30,
      completed: 1,
    });
    expect(r.today.xp).toBe(55);
    expect(rows).toHaveLength(3);
  });
  it("respects timezone day boundaries and timestamp offsets", () => {
    const r = reportTotals(
      [attempt("a", true, "2026-10-23T23:00:00Z", 25)],
      "2026-10-24T04:00:00+05:30",
      "2026-10-24T05:00:00+05:30",
      "Asia/Kolkata",
    );
    expect(r.session.xp).toBe(25);
    expect(r.today.xp).toBe(25);
  });
  it("empty results have no invented accuracy", () => {
    expect(
      reportTotals([], "2026-10-24T09:00:00Z", "2026-10-24T10:00:00Z", "UTC")
        .session.accuracy,
    ).toBeNull();
  });
});
describe("fact scheduling", () => {
  it("only counts active visible time and never builds a backlog", () => {
    expect(factClock(100, 1000, false, true)).toBe(100);
    expect(factClock(100, 1000, true, false)).toBe(100);
    expect(factClock(FACT_INTERVAL, 1000, true, true)).toBe(FACT_INTERVAL);
    expect(factClock(0, 100000, true, true)).toBe(2000);
  });
  it("avoids recent facts and advanced facts for Primary", () => {
    const seen: string[] = [];
    for (let i = 0; i < 10; i++) {
      const f = nextFact(seen, "Primary");
      expect(seen).not.toContain(f.id);
      expect(f.advanced).not.toBe(true);
      seen.push(f.id);
    }
  });
  it("facts have sources and only link to available lessons", () => {
    expect(facts.length).toBeGreaterThanOrEqual(24);
    for (const f of facts) {
      expect(f.source).toMatch(/^https:\/\//);
      if (f.lesson) expect(lessons.some((l) => l.id === f.lesson)).toBe(true);
    }
  });
});
