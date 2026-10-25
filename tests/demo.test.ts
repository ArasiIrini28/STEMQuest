import { describe, expect, it } from "vitest";
import { readActiveDemo } from "../src/lib/demo";
import { initialState } from "../src/lib/engine";
import { lessons } from "../src/lib/content";
import { makeQuiz, submitLocalQuiz } from "../src/lib/assessment";

const storage = (values: Record<string, string>) => ({
  getItem: (key: string) => values[key] ?? null,
});

describe("local learner restoration across account transitions", () => {
  it("restores the active roster's completed quiz, XP and saved report", () => {
    const quiz = makeQuiz(lessons.find((l) => l.id === "fraction-flight")!);
    let state = { ...initialState, quizRuns: [quiz] };
    for (const q of quiz.questions) {
      state = submitLocalQuiz(state, quiz.id, q.id, q.answer)
        .state as typeof state;
    }
    const values = {
      "stemquest-active-demo": "nova",
      "stemquest-demo-roster": JSON.stringify({ nova: state }),
      "stemquest-demo-v1": JSON.stringify(initialState),
    };
    const restored = readActiveDemo(storage(values));
    expect(restored.id).toBe("nova");
    expect(restored.state).toEqual(state);
    expect(restored.state.learningReports).toHaveLength(1);
    expect(values["stemquest-demo-roster"]).toBe(
      JSON.stringify({ nova: state }),
    );
  });
  it("keeps legacy progress when no roster was saved", () => {
    const saved = { ...initialState, xp: 75 };
    expect(
      readActiveDemo(storage({ "stemquest-demo-v1": JSON.stringify(saved) }))
        .state.xp,
    ).toBe(75);
  });
  it("handles invalid or unavailable storage without crashing", () => {
    expect(
      readActiveDemo(storage({ "stemquest-demo-v1": "broken" })).state,
    ).toEqual(initialState);
    expect(
      readActiveDemo({
        getItem() {
          throw new Error("Storage blocked");
        },
      }).id,
    ).toBe("explorer");
  });
  it("never restores a privileged account role into a local learner", () => {
    const saved = {
      ...initialState,
      profile: { ...initialState.profile, role: "admin" },
    };
    expect(
      readActiveDemo(storage({ "stemquest-demo-v1": JSON.stringify(saved) }))
        .state.profile.role,
    ).toBe("student");
  });
});
