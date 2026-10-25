import type { LearningState, Lesson, LearningReport, QuizRun } from "./types";
import { award, dayKey } from "./engine";
import { supabase } from "./supabase";
import { learningPolicy } from "./personalization";
export function nextStep(accuracy: number | null) {
  return accuracy === null
    ? "Try a scored activity to collect evidence."
    : accuracy < learningPolicy.developing
      ? "Review the foundation and worked explanation, then try guided practice."
      : accuracy < learningPolicy.progressing
        ? "Try guided practice and review each missed question."
        : accuracy < learningPolicy.strong
          ? "Revise the missed questions, then reassess."
          : "Consider a related challenge; sustained mastery needs evidence across questions.";
}
export function makeQuiz(
  lesson: Lesson,
  id = crypto.randomUUID(),
  now = new Date(),
): QuizRun {
  const questions = lesson.activities.filter((a) => a.xp > 0);
  if (!questions.length)
    throw new Error("This lesson has no scored quiz activities.");
  return {
    id,
    lesson_id: lesson.id,
    title: lesson.title,
    subject: lesson.world,
    level: lesson.level,
    started_at: now.toISOString(),
    ended_at: null,
    questions,
    responses: {},
    report: null,
  };
}
export function todayXP(state: LearningState, now: Date) {
  return state.attempts
    .filter(
      (a) =>
        dayKey(new Date(a.at), state.profile.timezone) ===
        dayKey(now, state.profile.timezone),
    )
    .reduce((s, a) => s + a.xp, 0);
}
export function scoreQuiz(
  run: QuizRun,
  state: LearningState,
  now = new Date(),
): LearningReport {
  const values = Object.values(run.responses),
    total = run.questions.length,
    correct = values.filter((r) => r.correct).length;
  const accuracy = total ? Math.round((correct / total) * 1000) / 10 : null;
  return {
    id: run.id,
    kind: "assessment",
    lessonId: run.lesson_id,
    subject: run.subject,
    title: run.title,
    level: run.level,
    completedAt: now.toISOString(),
    timezone: state.profile.timezone,
    attempt:
      (state.learningReports || []).filter(
        (r) => r.kind === "assessment" && r.lessonId === run.lesson_id,
      ).length + 1,
    total,
    correct,
    incorrect: values.length - correct,
    unanswered: total - values.length,
    accuracy,
    xp: values.reduce((n, r) => n + r.xp, 0),
    todayXp: todayXP(state, now),
    completed: values.filter((r) => r.xp > 0).length,
    required: total,
    recommendation: nextStep(accuracy),
    items: run.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      explanation: q.explanation,
      correct: run.responses[q.id]?.correct ?? null,
    })),
  };
}
export function submitLocalQuiz(
  state: LearningState,
  runId: string,
  activityId: string,
  answer: unknown,
  now = new Date(),
) {
  const original = state.quizRuns?.find((r) => r.id === runId);
  if (!original) throw new Error("Quiz attempt unavailable.");
  if (original.responses[activityId])
    return { state, run: original, result: original.responses[activityId] };
  if (original.ended_at) throw new Error("This attempt is complete.");
  const question = original.questions.find((q) => q.id === activityId);
  if (!question) throw new Error("Question is not part of this attempt.");
  const awarded = award(state, original.lesson_id, question, answer, now);
  const a = awarded.attempts.at(-1)!;
  const result = { correct: a.correct, xp: a.xp, at: a.at };
  const run = {
    ...original,
    responses: { ...original.responses, [activityId]: result },
  };
  if (Object.keys(run.responses).length === run.questions.length) {
    run.ended_at = now.toISOString();
    run.report = scoreQuiz(run, awarded, now);
  }
  const next = {
    ...awarded,
    quizRuns: (state.quizRuns || []).map((r) => (r.id === runId ? run : r)),
    learningReports: run.report
      ? [
          ...(state.learningReports || []).filter((r) => r.id !== run.id),
          run.report,
        ]
      : state.learningReports,
  };
  return { state: next, run, result };
}
export function newSubjectReports(
  state: LearningState,
  catalogue: Lesson[],
  now = new Date(),
): LearningReport[] {
  const groups = new Map<string, Lesson[]>();
  for (const l of catalogue) {
    const key = l.world + ":" + l.level;
    groups.set(key, [...(groups.get(key) || []), l]);
  }
  const reports: LearningReport[] = [];
  for (const [group, ls] of groups) {
    const required = ls
      .flatMap((l) =>
        l.activities.filter((a) => a.xp > 0).map((a) => l.id + ":" + a.id),
      )
      .sort();
    const id = "subject:" + group + ":" + required.join("|");
    if (
      !required.length ||
      (state.learningReports || []).some((r) => r.id === id) ||
      !required.every((k) => state.completed.includes(k))
    )
      continue;
    const attempts = state.attempts.filter((a) =>
      required.includes(a.lessonId + ":" + a.activityId),
    );
    const correct = attempts.filter((a) => a.correct).length,
      total = attempts.length,
      accuracy = total ? Math.round((correct / total) * 1000) / 10 : null;
    reports.push({
      id,
      kind: "subject",
      subject: ls[0].world,
      title: ls[0].world + " · " + ls[0].level,
      level: ls[0].level,
      completedAt: now.toISOString(),
      timezone: state.profile.timezone,
      attempt: 1,
      total,
      correct,
      incorrect: total - correct,
      unanswered: 0,
      accuracy,
      xp: attempts.reduce((s, a) => s + a.xp, 0),
      todayXp: todayXP(state, now),
      completed: required.length,
      required: required.length,
      recommendation:
        "All configured scored activities at this subject and level are mastered. Explore another subject or revisit a quiz to check retention.",
      items: [],
    });
  }
  return reports;
}
export async function startRemoteQuiz(lessonId: string): Promise<QuizRun> {
  const { data, error } = await supabase!.rpc("start_quiz", {
    lesson_key: lessonId,
  });
  if (error) throw error;
  return data;
}
export async function submitRemoteQuiz(
  id: string,
  activityId: string,
  answer: unknown,
): Promise<QuizRun> {
  const { data, error } = await supabase!.rpc("submit_quiz_answer", {
    quiz_id: id,
    question_id: activityId,
    answer,
  });
  if (error) throw error;
  return data;
}
export async function readRemoteReports(): Promise<LearningReport[]> {
  const { data, error } = await supabase!
    .from("learning_reports")
    .select("document")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => r.document);
}
