"use client";
import { useEffect, useRef, useState } from "react";
import type {
  LearningState,
  Lesson,
  LearningReport,
  QuizRun,
} from "@/lib/types";
import {
  makeQuiz,
  submitLocalQuiz,
  startRemoteQuiz,
  submitRemoteQuiz,
  newSubjectReports,
  readRemoteReports,
} from "@/lib/assessment";
import { supabase } from "@/lib/supabase";
import { worlds } from "@/lib/content";
import { LessonPlayer } from "./activities";
export function ReportCard({
  report: r,
  demo,
  navigate,
  onClose,
}: {
  report: LearningReport;
  demo: boolean;
  navigate: (route: string) => void;
  onClose: () => void;
}) {
  const [review, setReview] = useState(false);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    panel.current?.scrollIntoView({ block: "start" });
  }, [r.id]);
  return (
    <section
      ref={panel}
      className="panel outcome-report"
      data-report-open="true"
      aria-label={
        r.kind === "assessment"
          ? "Assessment report"
          : "Subject completion report"
      }
    >
      <div className="between">
        <div>
          <span className="eyebrow">
            {r.kind === "assessment"
              ? "ASSESSMENT REPORT"
              : "SUBJECT COMPLETION REPORT"}
          </span>
          <h2>{r.title}</h2>
        </div>
        <button className="text-button" onClick={onClose}>
          Close Report
        </button>
      </div>
      <p>
        {worlds.find((w) => w.id === r.subject)?.subject || r.subject} ·{" "}
        {r.level} ·{" "}
        {r.kind === "assessment"
          ? "Attempt " + r.attempt
          : "All configured scored activities mastered"}
      </p>
      <p className="pill lavender">
        {demo ? "Saved on this browser · Demo report" : "Saved to your account"}
      </p>
      <div className="report-metrics">
        <p>
          Total: <strong>{r.total}</strong>
        </p>
        <p>
          Correct: <strong>{r.correct}</strong>
        </p>
        <p>
          Incorrect: <strong>{r.incorrect}</strong>
        </p>
        <p>
          Unanswered: <strong>{r.unanswered}</strong>
        </p>
        <p>
          Accuracy:{" "}
          <strong>
            {r.accuracy === null
              ? "Not enough data"
              : r.accuracy.toFixed(1) + "%"}
          </strong>
        </p>
        <p>
          {r.kind === "assessment" ? "XP this attempt" : "Subject XP"}:{" "}
          <strong>{r.xp}</strong>
        </p>
        <p>
          XP today at completion: <strong>{r.todayXp}</strong>
        </p>
        <p>
          {r.kind === "assessment"
            ? "Newly mastered activities"
            : "Required activities completed"}
          :{" "}
          <strong>
            {r.completed}/{r.required}
          </strong>
        </p>
      </div>
      <p>
        {r.kind === "subject"
          ? "Accuracy includes all recorded scored answers in this subject and level up to completion, including retakes. "
          : "One answer per question in this attempt. "}
        Opening a report earns no XP. Study duration is not measured.
      </p>
      <p>
        Completed:{" "}
        {new Date(r.completedAt).toLocaleString(undefined, {
          timeZone: r.timezone,
        })}{" "}
        · {r.timezone}
      </p>
      <p className="hint">{r.recommendation}</p>
      <div className="button-row">
        {r.items.length > 0 && (
          <button className="secondary" onClick={() => setReview(!review)}>
            Review Mistakes
          </button>
        )}
        {r.lessonId && (
          <button
            className="primary"
            onClick={() =>
              navigate("quiz:" + r.lessonId + ":new:" + crypto.randomUUID())
            }
          >
            Practice More
          </button>
        )}
        <button className="secondary" onClick={() => navigate("dashboard")}>
          Continue
        </button>
        <button className="text-button" onClick={() => navigate("reports")}>
          My Learning Reports
        </button>
      </div>
      {review && (
        <div>
          <h3>Review your answers</h3>
          {r.items.filter((i) => i.correct !== true).length ? (
            r.items
              .filter((i) => i.correct !== true)
              .map((i) => (
                <article className="recommend-card" key={i.id}>
                  <strong>{i.prompt}</strong>
                  <p>{i.correct === null ? "Unanswered" : "Incorrect"}</p>
                  <p>{i.explanation}</p>
                </article>
              ))
          ) : (
            <p>No incorrect answers in this attempt.</p>
          )}
        </div>
      )}
    </section>
  );
}
export function AssessmentPlayer({
  lesson,
  state,
  onState,
  remote,
  navigate,
  refresh,
  onActivityChange,
}: {
  lesson: Lesson;
  state: LearningState;
  onState: (s: LearningState) => void;
  remote: boolean;
  navigate: (v: string) => void;
  refresh: () => Promise<void>;
  onActivityChange: (lessonId: string, activityId: string) => void;
}) {
  const [run, setRun] = useState<QuizRun | null>(null),
    [error, setError] = useState(""),
    [starting, setStarting] = useState(false),
    [answered, setAnswered] = useState<string | null>(null),
    [closed, setClosed] = useState(false);
  const pending = useRef(false),
    latest = useRef(state),
    mounted = useRef(true);
  useEffect(() => {
    latest.current = state;
  }, [state]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function start() {
    if (pending.current) return;
    pending.current = true;
    setStarting(true);
    setError("");
    try {
      let next: QuizRun;
      if (remote) next = await startRemoteQuiz(lesson.id);
      else {
        next =
          latest.current.quizRuns?.find(
            (r) => r.lesson_id === lesson.id && !r.ended_at,
          ) || makeQuiz(lesson);
        const nextState = {
          ...latest.current,
          quizRuns: [
            ...(latest.current.quizRuns || []).filter((r) => r.id !== next.id),
            next,
          ],
        };
        localStorage.setItem("stemquest-demo-v1", JSON.stringify(nextState));
        latest.current = nextState;
        onState(nextState);
      }
      if (mounted.current) setRun(next);
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : "Could not start quiz.");
    } finally {
      pending.current = false;
      if (mounted.current) setStarting(false);
    }
  }
  const question =
    run?.questions.find((q) => q.id === answered) ||
    run?.questions.find((q) => !run.responses[q.id]);
  if (run?.report && !closed)
    return (
      <ReportCard
        report={run.report}
        demo={!remote}
        navigate={navigate}
        onClose={() => setClosed(true)}
      />
    );
  if (closed)
    return (
      <section className="panel">
        <h1>Report saved</h1>
        <p>Reopen it in My Learning Reports whenever you need it.</p>
        <button className="primary" onClick={() => navigate("reports")}>
          My Learning Reports
        </button>
        <button
          className="text-button"
          onClick={() => navigate("lesson:" + lesson.id)}
        >
          Return to lesson
        </button>
      </section>
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CHECK WHAT YOU HAVE LEARNED</span>
          <h1>{lesson.title} · quiz</h1>
          <p>
            One recorded answer per question. Incorrect answers stay in this
            attempt so the report reflects what happened. Retakes keep the old
            report.
          </p>
        </div>
      </div>
      {error && (
        <p role="alert" className="error-banner">
          {error}
        </p>
      )}
      {!run ? (
        <section className="panel">
          <p>
            {lesson.activities.filter((a) => a.xp > 0).length} scored questions
            ·{" "}
            {remote ? "Account persistence" : "Browser-local demo persistence"}
          </p>
          <p>
            An unfinished quiz resumes when you start again. No XP is awarded
            for opening it.
          </p>
          <button className="primary" disabled={starting} onClick={start}>
            {starting ? "Starting…" : "Start or resume quiz"}
          </button>
        </section>
      ) : question ? (
        <section className="panel">
          <p className="pill lavender">
            {Object.keys(run.responses).length}/{run.questions.length} answers
            recorded
          </p>
          <LessonPlayer
            key={question.id}
            practiceMode
            lesson={{ ...lesson, activities: [question] }}
            completed={state.completed}
            reducedMotion={state.profile.reducedMotion}
            onActivityChange={onActivityChange}
            onExit={() => navigate("lesson:" + lesson.id)}
            onSubmit={async (a, value) => {
              if (pending.current)
                throw new Error("An answer is already being saved.");
              pending.current = true;
              try {
                let next: QuizRun;
                if (remote) {
                  next = await submitRemoteQuiz(run.id, a.id, value);
                  if (mounted.current) {
                    if (!next.report) setAnswered(a.id);
                    setRun(next);
                  }
                  try {
                    await refresh();
                  } catch {
                    if (mounted.current)
                      setError(
                        "Your quiz answer was saved, but dashboard refresh failed. Reload to refresh progress.",
                      );
                  }
                } else {
                  const result = submitLocalQuiz(
                    latest.current,
                    run.id,
                    a.id,
                    value,
                  );
                  localStorage.setItem(
                    "stemquest-demo-v1",
                    JSON.stringify(result.state),
                  );
                  latest.current = result.state;
                  onState(result.state);
                  next = result.run;
                }
                if (mounted.current) {
                  if (next.report) setRun(next);
                  else {
                    setAnswered(a.id);
                    setRun({ ...next, responses: next.responses });
                  }
                }
                return next.responses[a.id];
              } finally {
                pending.current = false;
              }
            }}
          />
          {answered && (
            <>
              <p className="hint">
                {run.questions.find((q) => q.id === answered)?.explanation}
              </p>
              <button className="primary" onClick={() => setAnswered(null)}>
                Next quiz question
              </button>
            </>
          )}
        </section>
      ) : (
        <p>Loading report…</p>
      )}
    </>
  );
}
export function LearningReports({
  state,
  onState,
  catalogue,
  remote,
  view,
  navigate,
  blocked,
}: {
  state: LearningState;
  onState: (s: LearningState) => void;
  catalogue: Lesson[];
  remote: boolean;
  view: string;
  navigate: (s: string) => void;
  blocked: boolean;
}) {
  const [cloud, setCloud] = useState<LearningReport[]>([]),
    [opened, setOpened] = useState<LearningReport | null>(null),
    [pendingSubject, setPendingSubject] = useState<LearningReport | null>(null),
    [retry, setRetry] = useState(0),
    [loading, setLoading] = useState(remote),
    [error, setError] = useState("");
  const reports = remote ? cloud : state.learningReports || [];
  useEffect(() => {
    setOpened(null);
  }, [view]);
  useEffect(() => {
    let cancelled = false;
    if (remote) {
      setLoading(true);
      (async () => {
        const { data, error } = await supabase!.rpc("sync_subject_reports");
        const rows = await readRemoteReports();
        if (!cancelled) {
          setCloud(rows);
          if (data?.length) setPendingSubject(data[0]);
          setError(
            error
              ? "Saved reports loaded, but subject milestones could not be checked. Please retry."
              : "",
          );
        }
      })()
        .catch((e) => {
          if (!cancelled) setError(e.message || "Could not load reports.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      const added = newSubjectReports(state, catalogue);
      if (added.length) {
        const next = {
          ...state,
          learningReports: [...(state.learningReports || []), ...added],
        };
        try {
          localStorage.setItem("stemquest-demo-v1", JSON.stringify(next));
          onState(next);
          setPendingSubject(added[0]);
          setError("");
        } catch {
          setError(
            "Report could not be saved on this browser. Free browser storage and try again.",
          );
        }
      }
    }
    return () => {
      cancelled = true;
    };
  }, [state, catalogue, remote, onState, retry]);
  const report = !blocked ? opened || pendingSubject : null;
  return (
    <>
      {report && (
        <ReportCard
          report={report}
          demo={!remote}
          navigate={navigate}
          onClose={() => {
            setOpened(null);
            setPendingSubject(null);
          }}
        />
      )}
      {(view === "reports" || view === "dashboard") && (
        <section className="panel" aria-label="My Learning Reports">
          <div className="between">
            <h2>My Learning Reports</h2>
            {view === "dashboard" && (
              <button
                className="text-button"
                onClick={() => navigate("reports")}
              >
                View all reports
              </button>
            )}
          </div>
          <p>
            {remote
              ? "Saved account reports"
              : "Reports saved in this browser for this demo learner"}
            . Quiz attempts, subject milestones and dashboard session summaries
            are separate.
          </p>
          {error && (
            <div role="alert" className="error-banner">
              {error}
              <button
                className="secondary"
                disabled={loading}
                onClick={() => setRetry((n) => n + 1)}
              >
                Retry loading reports
              </button>
            </div>
          )}
          {loading && <p role="status">Loading saved reports…</p>}
          {!reports.length && !loading && !error ? (
            <p>
              Finish a lesson quiz to automatically save your first assessment
              report. Complete all configured scored activities in a subject and
              level to earn its completion report.
            </p>
          ) : (
            <div className="learning-columns">
              {[...reports]
                .sort(
                  (a, b) =>
                    Date.parse(b.completedAt) - Date.parse(a.completedAt),
                )
                .slice(0, view === "dashboard" ? 3 : undefined)
                .map((r) => (
                  <article key={r.id} className="recommend-card">
                    <span className="pill lavender">
                      {r.kind === "assessment"
                        ? "Quiz attempt " + r.attempt
                        : "Subject milestone"}
                    </span>
                    <h3>{r.title}</h3>
                    <p>
                      {r.correct}/{r.total} correct ·{" "}
                      {r.accuracy === null
                        ? "No score"
                        : r.accuracy.toFixed(1) + "%"}{" "}
                      · {r.xp} XP
                    </p>
                    <p>{new Date(r.completedAt).toLocaleString()}</p>
                    <button className="secondary" onClick={() => setOpened(r)}>
                      Open saved report
                    </button>
                  </article>
                ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
