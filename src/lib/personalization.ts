import type { Attempt, LearningState, Lesson } from "./types";
import { dayKey } from "./engine";
export const learningPolicy = {
  minimumAttempts: 3,
  minimumQuestions: 2,
  developing: 50,
  progressing: 70,
  strong: 85,
  recentWindow: 8,
};
export const prerequisites: Record<string, string[]> = {
  "fraction-memory": ["fraction-flight"],
  "spaceship-fuel": ["fraction-flight"],
  "loop-lab": ["sequence-safari", "robot-rescue"],
  "robot-rescue": ["sequence-safari"],
  "circuit-city": [],
};
export function topicEvidence(attempts: Attempt[], lessonId: string) {
  const rows = attempts
    .filter((a) => a.lessonId === lessonId)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const recent = rows.slice(-learningPolicy.recentWindow);
  const accuracy = recent.length
    ? Math.round((100 * recent.filter((a) => a.correct).length) / recent.length)
    : null;
  const enough =
    recent.length >= learningPolicy.minimumAttempts &&
    new Set(recent.map((a) => a.activityId)).size >=
      learningPolicy.minimumQuestions;
  const band = !enough
    ? "Gathering evidence"
    : accuracy! < learningPolicy.developing
      ? "Needs more practice"
      : accuracy! < learningPolicy.progressing
        ? "Developing"
        : accuracy! < learningPolicy.strong
          ? "Progressing"
          : "Strong understanding";
  // Compare two non-overlapping windows only if they contain the same question IDs.
  const prior = rows.slice(
    -learningPolicy.recentWindow * 2,
    -learningPolicy.recentWindow,
  );
  const keys = (xs: Attempt[]) =>
    [...new Set(xs.map((a) => a.activityId))].sort().join("|");
  const improvement =
    prior.length === learningPolicy.recentWindow &&
    recent.length === learningPolicy.recentWindow &&
    keys(prior) === keys(recent)
      ? accuracy! -
        Math.round((100 * prior.filter((a) => a.correct).length) / prior.length)
      : null;
  return {
    attempts: rows.length,
    recentCount: recent.length,
    accuracy,
    enough,
    band,
    mastered: enough && accuracy! >= learningPolicy.strong,
    improvement,
  };
}
export function recommendations(state: LearningState, catalogue: Lesson[]) {
  const ids = new Set(catalogue.map((l) => l.id));
  return catalogue
    .filter(
      (l) =>
        l.level === state.profile.level ||
        state.attempts.some((a) => a.lessonId === l.id),
    )
    .map((lesson) => {
      const evidence = topicEvidence(state.attempts, lesson.id);
      const foundation = (prerequisites[lesson.id] || []).filter(
        (id) => ids.has(id) && !topicEvidence(state.attempts, id).mastered,
      );
      const need =
        evidence.enough && evidence.accuracy! < learningPolicy.progressing;
      const reason = need
        ? `${evidence.accuracy}% on ${evidence.recentCount} recent attempts. Revisit the explanation, then practise.`
        : !evidence.enough
          ? `A short diagnostic will help choose your next step. ${evidence.attempts} attempts recorded.`
          : "Build on your progress with another challenge.";
      return {
        lesson,
        evidence,
        foundation,
        reason,
        priority: need ? 100 - evidence.accuracy! : !evidence.enough ? 25 : 0,
      };
    })
    .sort(
      (a, b) =>
        b.priority - a.priority || a.lesson.title.localeCompare(b.lesson.title),
    )
    .slice(0, 4);
}
export function summarize(rows: Attempt[]) {
  const correct = rows.filter((a) => a.correct).length;
  return {
    questions: rows.length,
    correct,
    incorrect: rows.length - correct,
    accuracy: rows.length ? Math.round((correct / rows.length) * 100) : null,
    xp: rows.reduce((n, a) => n + a.xp, 0),
    attempted: new Set(rows.map((a) => a.lessonId + ":" + a.activityId)).size,
    completed: new Set(
      rows.filter((a) => a.xp > 0).map((a) => a.lessonId + ":" + a.activityId),
    ).size,
    topics: [...new Set(rows.map((a) => a.lessonId))],
  };
}
export function reportTotals(
  attempts: Attempt[],
  start: string,
  end: string,
  timezone: string,
) {
  const inside = (a: Attempt) =>
    Date.parse(a.at) >= Date.parse(start) && Date.parse(a.at) < Date.parse(end);
  const day = dayKey(new Date(end), timezone);
  return {
    session: summarize(attempts.filter(inside)),
    today: summarize(
      attempts.filter(
        (a) =>
          dayKey(new Date(a.at), timezone) === day &&
          Date.parse(a.at) < Date.parse(end),
      ),
    ),
  };
}
export function choosePractice(lesson: Lesson, attempts: Attempt[]) {
  const questions = lesson.activities.filter((a) => a.xp > 0);
  return [...questions].sort((a, b) => {
    const score = (id: string) => {
      const rows = attempts.filter(
        (r) => r.lessonId === lesson.id && r.activityId === id,
      );
      const last = rows.at(-1);
      return !last ? -1 : last.correct ? 2 : 0;
    };
    return score(a.id) - score(b.id);
  })[0];
}
export function practiceTarget(
  lesson: Lesson,
  catalogue: Lesson[],
  attempts: Attempt[],
) {
  const recent = attempts.filter((a) => a.lessonId === lesson.id).slice(-2);
  if (recent.length === 2 && recent.every((a) => !a.correct)) {
    const foundation = catalogue.find(
      (l) =>
        (prerequisites[lesson.id] || []).includes(l.id) &&
        !topicEvidence(attempts, l.id).mastered &&
        l.activities.some((a) => a.xp > 0),
    );
    if (foundation)
      return {
        lesson: foundation,
        reason:
          "Two recent answers need review. Practise a linked foundation before trying this topic again.",
      };
  }
  if (topicEvidence(attempts, lesson.id).mastered) {
    const challenge = catalogue.find(
      (l) =>
        (prerequisites[l.id] || []).includes(lesson.id) &&
        (prerequisites[l.id] || []).every(
          (id) => topicEvidence(attempts, id).mastered,
        ) &&
        !topicEvidence(attempts, l.id).mastered &&
        l.activities.some((a) => a.xp > 0),
    );
    if (challenge)
      return {
        lesson: challenge,
        reason: "Your recent results support moving to this linked challenge.",
      };
  }
  return {
    lesson,
    reason:
      "Unseen and recently missed questions come first. Repeating mastered questions earns no extra XP.",
  };
}
