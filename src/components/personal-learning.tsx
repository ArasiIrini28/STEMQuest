"use client";
import { useEffect, useState } from "react";
import type { Activity, LearningState, Lesson } from "@/lib/types";
import {
  recommendations,
  topicEvidence,
  reportTotals,
  choosePractice,
  practiceTarget,
} from "@/lib/personalization";
import {
  sessions,
  sessionAction,
  type StudySession,
} from "@/lib/learning-sessions";
import { LessonPlayer } from "./activities";
import { DiscoveryFacts } from "./discovery-facts";
export function PersonalLearning({
  state,
  catalogue,
  owner,
  remote,
  view,
  submit,
  navigate,
  blocked,
}: {
  state: LearningState;
  catalogue: Lesson[];
  owner: string;
  remote: boolean;
  view: string;
  submit: (
    l: Lesson,
    a: Activity,
    v: unknown,
  ) => Promise<{ correct: boolean; xp: number }>;
  navigate: (s: string) => void;
  blocked: boolean;
}) {
  const [rows, setRows] = useState<StudySession[]>([]),
    [active, setActive] = useState<StudySession | null>(null),
    [report, setReport] = useState<StudySession | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [practice, setPractice] = useState<{
      lesson: Lesson;
      activity: Activity;
      turn: number;
      right: number;
      answered: boolean;
      reason: string;
    } | null>(null),
    [practiceDone, setPracticeDone] = useState<string | null>(null),
    [review, setReview] = useState(false);
  useEffect(() => {
    let cancelled = false;
    sessions(owner, remote)
      .then((r) => {
        if (!cancelled) {
          setRows(r);
          setActive(r.find((s) => !s.ended_at) || null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [owner, remote]);
  async function start() {
    setBusy(true);
    setError("");
    try {
      const row = await sessionAction(owner, remote, "start");
      setActive(row);
      setReport(null);
      setRows(await sessions(owner, remote));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start session");
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    if (!active || busy) return;
    setBusy(true);
    setError("");
    try {
      const row = await sessionAction(owner, remote, "finish", active.id);
      setReport(row);
      setActive(null);
      setRows(await sessions(owner, remote));
      navigate("dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save session");
    } finally {
      setBusy(false);
    }
  }
  const recs = recommendations(state, catalogue);
  const totals = report?.ended_at
    ? reportTotals(
        state.attempts,
        report.started_at,
        report.ended_at,
        state.profile.timezone,
      )
    : null;
  const mistakes = state.attempts
    .filter((a) => !a.correct)
    .slice(-10)
    .reverse();
  const summary = totals ? (
    <section
      className="panel"
      data-report-open="true"
      aria-label="Learning outcome report"
    >
      <div className="between">
        <h2>Today’s Learning Outcome</h2>
        <button className="text-button" onClick={() => setReport(null)}>
          Close report
        </button>
      </div>
      <p>
        {new Date(report!.started_at).toLocaleString()} · Daily totals use{" "}
        {state.profile.timezone} and stop at this report’s finish time.
      </p>
      <div className="learning-columns">
        {(
          [
            ["This session", totals.session],
            ["Whole day", totals.today],
          ] as const
        ).map(([label, s]) => (
          <div key={label}>
            <h3>{label}</h3>
            <p>
              {s.attempted} distinct activities attempted · {s.completed} newly
              mastered
            </p>
            <p>
              {s.questions} scored answers: {s.correct} correct, {s.incorrect}{" "}
              incorrect
            </p>
            <p>
              Accuracy:{" "}
              {s.accuracy === null ? "Not enough data" : s.accuracy + "%"} ·{" "}
              {s.xp} XP
            </p>
            <p>
              Topics:{" "}
              {s.topics
                .map((id) => catalogue.find((l) => l.id === id)?.title || id)
                .join(", ") || "None yet"}
            </p>
          </div>
        ))}
      </div>
      <p>
        Daily mission: {Math.min(3, totals.today.completed)}/3 new activities.
        Time on page is not counted as reliable study duration.
      </p>
      <h3>Strengths and next steps</h3>
      {totals.session.topics.length ? (
        totals.session.topics.map((id) => {
          const l = catalogue.find((x) => x.id === id);
          const e = topicEvidence(
            state.attempts.filter(
              (a) => Date.parse(a.at) < Date.parse(report!.ended_at!),
            ),
            id,
          );
          return (
            <p key={id}>
              {l?.title || id}: {e.band}.{" "}
              {e.improvement !== null && e.improvement > 0
                ? `Improved ${e.improvement} percentage points on comparable question sets.`
                : ""}{" "}
              {l && (
                <button
                  className="text-button"
                  onClick={() => {
                    setReport(null);
                    navigate("lesson:" + id);
                  }}
                >
                  Review lesson
                </button>
              )}
            </p>
          );
        })
      ) : (
        <p>Try a scored activity first. An empty session earns no XP.</p>
      )}
    </section>
  ) : null;
  function launch(l: Lesson) {
    const target = practiceTarget(l, catalogue, state.attempts);
    l = target.lesson;
    const a = choosePractice(l, state.attempts);
    if (a) {
      setPractice({
        lesson: l,
        activity: a,
        turn: 1,
        right: 0,
        answered: false,
        reason: target.reason,
      });
      setPracticeDone(null);
    }
  }
  return (
    <>
      <section className="learning-toolbar" aria-label="Learning session">
        <div>
          <strong>
            {active
              ? "Learning session in progress"
              : "Ready for a focused session?"}
          </strong>
          <p className="small muted">
            {remote
              ? "Session boundaries saved to your account."
              : "Sessions and facts are saved on this browser for this demo learner."}
          </p>
        </div>
        <div className="button-row">
          {active ? (
            <button
              className="secondary"
              disabled={
                busy ||
                !!practice ||
                view.startsWith("lesson:") ||
                view === "coding"
              }
              onClick={finish}
            >
              Finish Learning
            </button>
          ) : (
            <button className="primary" disabled={busy} onClick={start}>
              Start Learning Session
            </button>
          )}
          <DiscoveryFacts
            key={owner}
            owner={owner}
            level={state.profile.level}
            initial
            blocked={blocked || busy || !!practice || !!report}
          />
        </div>
      </section>
      {error && (
        <p role="alert" className="error-banner">
          {error} <button onClick={() => setError("")}>Dismiss</button>
        </p>
      )}
      {summary}
      {practiceDone && (
        <p role="status" className="hint">
          {practiceDone}{" "}
          <button onClick={() => setPracticeDone(null)}>Dismiss</button>
        </p>
      )}
      {practice ? (
        <section className="panel adaptive-panel">
          <p className="pill lavender">
            Focused practice · round {practice.turn}/3 ·{" "}
            {practice.answered ? "Answer recorded" : "Your turn"}
          </p>
          <p>{practice.reason}</p>
          <LessonPlayer
            practiceMode
            key={practice.turn}
            lesson={{ ...practice.lesson, activities: [practice.activity] }}
            reducedMotion={state.profile.reducedMotion}
            completed={state.completed}
            onSubmit={async (a, v) => {
              if (practice.answered)
                throw new Error(
                  "This practice answer is already recorded. Continue to the next round.",
                );
              const result = await submit(practice.lesson, a, v);
              setPractice((p) =>
                p
                  ? {
                      ...p,
                      answered: true,
                      right: p.right + (result.correct ? 1 : 0),
                    }
                  : null,
              );
              return result;
            }}
            onExit={() => setPractice(null)}
          />
          {practice.answered && (
            <>
              <p className="hint">{practice.activity.explanation}</p>
              <button
                className="primary"
                onClick={() => {
                  if (practice.turn >= 3) {
                    setPracticeDone(
                      `Practice finished: ${practice.right}/3 correct. Review the explanations for missed answers; your recommendations now reflect these attempts.`,
                    );
                    setPractice(null);
                  } else {
                    const target = practiceTarget(
                      practice.lesson,
                      catalogue,
                      state.attempts,
                    );
                    const a = choosePractice(target.lesson, state.attempts);
                    if (a)
                      setPractice({
                        ...practice,
                        activity: a,
                        lesson: target.lesson,
                        reason: target.reason,
                        turn: practice.turn + 1,
                        answered: false,
                      });
                  }
                }}
              >
                {practice.turn >= 3
                  ? "Finish practice"
                  : "Next practice question"}
              </button>
            </>
          )}
          <button className="text-button" onClick={() => setPractice(null)}>
            End practice
          </button>
        </section>
      ) : null}
      {view === "dashboard" && !practice && (
        <>
          <section className="panel">
            <div className="between">
              <h2>Recommended for You</h2>
              <button
                className="text-button"
                onClick={() => setReview(!review)}
              >
                Review Your Mistakes
              </button>
            </div>
            <p className="muted">
              Your next best activities, based on recorded attempts. Strong
              understanding requires several attempts across different
              questions.
            </p>
            <div className="learning-columns">
              {recs.map(({ lesson, evidence, foundation, reason }, i) => (
                <article key={lesson.id} className="recommend-card">
                  <span className="pill lavender">
                    {i === 0
                      ? "Your Next Best Activity"
                      : evidence.mastered
                        ? "Ready for a Challenge?"
                        : evidence.enough
                          ? "Topics to Improve"
                          : "Short diagnostic"}
                  </span>
                  <h3>{lesson.title}</h3>
                  <p>{reason}</p>
                  <p>
                    {lesson.level} · {lesson.difficulty} · {lesson.minutes} min
                    · {evidence.band}
                  </p>
                  {foundation.map((id) => (
                    <p key={id}>
                      Foundation:{" "}
                      <button
                        className="text-button"
                        onClick={() => navigate("lesson:" + id)}
                      >
                        {catalogue.find((l) => l.id === id)?.title}
                      </button>
                    </p>
                  ))}
                  <div className="button-row">
                    <button className="primary" onClick={() => launch(lesson)}>
                      Practice More
                    </button>
                    <button
                      className="secondary"
                      onClick={() => navigate("lesson:" + lesson.id)}
                    >
                      Review Lesson
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {review && (
              <div>
                <h3>Recent mistakes</h3>
                {mistakes.length ? (
                  mistakes.map((a, i) => {
                    const l = catalogue.find((l) => l.id === a.lessonId);
                    const q = l?.activities.find((q) => q.id === a.activityId);
                    return (
                      <div key={i} className="recommend-card">
                        <strong>{q?.prompt || "Unavailable activity"}</strong>
                        <p>
                          {q?.explanation ||
                            "This activity is no longer in the available catalogue."}
                        </p>
                        <small>{new Date(a.at).toLocaleString()}</small>
                        {l && (
                          <button
                            className="text-button"
                            onClick={() => launch(l)}
                          >
                            Try targeted practice
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p>No incorrect scored answers recorded yet.</p>
                )}
              </div>
            )}
          </section>
          <section className="panel">
            <h2>Learning session history</h2>
            {rows.some((r) => r.ended_at) ? (
              rows
                .filter((r) => r.ended_at)
                .map((r) => (
                  <p key={r.id}>
                    <button
                      className="text-button"
                      onClick={() => setReport(r)}
                    >
                      {new Date(r.started_at).toLocaleString()} — View saved
                      report
                    </button>
                  </p>
                ))
            ) : (
              <p>
                Choose Start Learning Session, complete activities, then Finish
                Learning on your dashboard.
              </p>
            )}
          </section>
        </>
      )}
    </>
  );
}
