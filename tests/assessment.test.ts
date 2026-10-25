import { describe, it, expect } from "vitest";
import {
  makeQuiz,
  submitLocalQuiz,
  newSubjectReports,
  scoreQuiz,
} from "../src/lib/assessment";
import { initialState } from "../src/lib/engine";
import { lessons } from "../src/lib/content";
import type { LearningState } from "../src/lib/types";
const lesson = lessons.find((l) => l.id === "fraction-flight")!;
describe("fixed-length quiz reports", () => {
  it("reports three actual answers as 66.7%, saves once, and prevents duplicated answers and XP", () => {
    const run = makeQuiz(lesson);
    let state: LearningState = { ...initialState, quizRuns: [run] };
    for (const q of run.questions) {
      const result = submitLocalQuiz(
        state,
        run.id,
        q.id,
        q.id === "fuel" ? "wrong" : q.answer,
      );
      state = result.state;
    }
    const report = state.learningReports![0];
    expect(report).toMatchObject({
      total: 3,
      correct: 2,
      incorrect: 1,
      unanswered: 0,
      accuracy: 66.7,
      kind: "assessment",
    });
    const repeated = submitLocalQuiz(state, run.id, "fuel", "1/2");
    expect(repeated.state).toBe(state);
    expect(repeated.run.report).toEqual(report);
    expect(report.xp).toBe(state.xp);
    expect(report.completed).toBe(2);
  });
  it("counts unanswered questions without creating a completed report early", () => {
    const run = makeQuiz(lesson);
    const result = submitLocalQuiz(
      { ...initialState, quizRuns: [run] },
      run.id,
      "fuel",
      "1/2",
    );
    expect(result.run.report).toBeNull();
    expect(scoreQuiz(result.run, result.state).unanswered).toBe(2);
  });
  it("keeps old reports immutable, records retakes and gives no XP for mastered repeats", () => {
    const first = makeQuiz(lesson);
    let state: LearningState = { ...initialState, quizRuns: [first] };
    for (const q of first.questions)
      state = submitLocalQuiz(state, first.id, q.id, q.answer).state;
    const old = JSON.stringify(state.learningReports![0]);
    const xp = state.xp;
    const second = makeQuiz(lesson);
    state = { ...state, quizRuns: [...state.quizRuns!, second] };
    for (const q of second.questions)
      state = submitLocalQuiz(state, second.id, q.id, q.answer).state;
    expect(state.xp).toBe(xp);
    expect(state.learningReports).toHaveLength(2);
    expect(state.learningReports![1]).toMatchObject({ attempt: 2, xp: 0 });
    expect(JSON.stringify(state.learningReports![0])).toBe(old);
  });
  it("requires every configured scored activity before creating a subject milestone", () => {
    const run = makeQuiz(lesson);
    let state: LearningState = { ...initialState, quizRuns: [run] };
    state = submitLocalQuiz(state, run.id, "fuel", "1/2").state;
    expect(newSubjectReports(state, [lesson])).toEqual([]);
    for (const q of run.questions.slice(1))
      state = submitLocalQuiz(state, run.id, q.id, q.answer).state;
    const reports = newSubjectReports(state, [lesson]);
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({
      kind: "subject",
      completed: 3,
      required: 3,
    });
    expect(
      newSubjectReports(
        { ...state, learningReports: [...state.learningReports!, ...reports] },
        [lesson],
      ),
    ).toEqual([]);
    expect(
      newSubjectReports(state, lessons).some(
        (r) => r.subject === "math" && r.level === "Primary",
      ),
    ).toBe(false);
  });
});
