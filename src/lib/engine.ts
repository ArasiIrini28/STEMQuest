import type { Activity, LearningState, Profile } from "./types";
export const defaultProfile: Profile = {
  name: "Explorer",
  grade: "Grade 7",
  level: "Middle school",
  ageBand: "13–15",
  country: "",
  curriculum: "General STEM",
  language: "English",
  interests: ["coding", "science"],
  goal: 15,
  timezone: "Asia/Kolkata",
  reminders: false,
  quietStart: 20,
  quietEnd: 8,
  leaderboard: false,
  reducedMotion: false,
  sound: false,
  role: "student",
};
export const initialState: LearningState = {
  profile: defaultProfile,
  attempts: [],
  completed: [],
  xp: 0,
  coins: 0,
  days: [],
  readNotifications: [],
  onboarded: false,
};
export function dayKey(date = new Date(), timezone = "Asia/Kolkata") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function streak(days: string[], today: string) {
  const sorted = [...new Set(days)].sort();
  let longest = 0,
    run = 0;
  for (let i = 0; i < sorted.length; i++) {
    run =
      i && Date.parse(sorted[i]) - Date.parse(sorted[i - 1]) === 86400000
        ? run + 1
        : 1;
    longest = Math.max(longest, run);
  }
  let current = 0;
  let t = Date.parse(today);
  if (!sorted.includes(today)) t -= 86400000;
  while (sorted.includes(new Date(t).toISOString().slice(0, 10))) {
    current++;
    t -= 86400000;
  }
  return { current, longest };
}
export const mazeRocks = [1, 6, 8, 16, 13, 18, 21];
export function runMaze(commands: string[]) {
  let x = 0,
    y = 4;
  const steps = [{ x, y }];
  if (commands.length > 40)
    return { success: false, steps, error: "Use at most 40 steps." };
  for (const command of commands) {
    if (!["up", "down", "left", "right"].includes(command))
      return { success: false, steps, error: "Unknown instruction." };
    const nx = x + (command === "right" ? 1 : command === "left" ? -1 : 0),
      ny = y + (command === "down" ? 1 : command === "up" ? -1 : 0);
    if (nx < 0 || nx > 4 || ny < 0 || ny > 4 || mazeRocks.includes(ny * 5 + nx))
      return {
        success: false,
        steps,
        error: "Byte found an obstacle. Change the route and try again.",
      };
    x = nx;
    y = ny;
    steps.push({ x, y });
  }
  return {
    success: x === 4 && y === 0,
    steps,
    error:
      x === 4 && y === 0
        ? ""
        : "Keep going! Byte has not reached the star yet.",
  };
}
export function runPythonSubset(code: string) {
  const match = code
    .trim()
    .match(/^for\s+i\s+in\s+range\((\d{1,2})\):\s*\n[ \t]+print\(i\)\s*$/);
  if (!match)
    return {
      ok: false,
      output:
        "Use the supported form: for i in range(n): followed by an indented print(i).",
      count: 0,
    };
  const n = Number(match[1]);
  if (n > 30)
    return {
      ok: false,
      output: "This practice sandbox allows at most 30 iterations.",
      count: 0,
    };
  return {
    ok: true,
    output: Array.from({ length: n }, (_, i) => String(i)).join("\n"),
    count: n,
  };
}
export function validateAnswer(activity: Activity, value: unknown) {
  if (activity.kind === "project" || activity.kind === "flashcard")
    return false;
  if (activity.kind === "maze")
    return Array.isArray(value) && runMaze(value as string[]).success;
  if (activity.kind === "code") {
    const r = runPythonSubset(String(value));
    return r.ok && r.count === Number(activity.answer);
  }
  if (Array.isArray(activity.answer)) {
    if (!Array.isArray(value)) return false;
    return activity.kind === "multi"
      ? [...value].sort().join("|") === [...activity.answer].sort().join("|")
      : value.join("|") === activity.answer.join("|");
  }
  return String(value).trim().toLowerCase() === activity.answer.toLowerCase();
}
export function award(
  state: LearningState,
  lessonId: string,
  activity: Activity,
  value: unknown,
  now = new Date(),
): LearningState {
  const correct = validateAnswer(activity, value),
    key = lessonId + ":" + activity.id,
    already = state.completed.includes(key),
    xp = correct && !already ? activity.xp : 0;
  return {
    ...state,
    xp: state.xp + xp,
    coins: state.coins + Math.floor(xp / 5),
    completed: correct
      ? [...new Set([...state.completed, key])]
      : state.completed,
    days:
      correct && xp > 0
        ? [...new Set([...state.days, dayKey(now, state.profile.timezone)])]
        : state.days,
    attempts: [
      ...state.attempts,
      {
        lessonId,
        activityId: activity.id,
        correct,
        score: correct ? 100 : 0,
        xp,
        at: now.toISOString(),
      },
    ],
  };
}
export function reminderEligible(p: {
  enabled: boolean;
  consent: boolean;
  hour: number;
  quietStart: number;
  quietEnd: number;
  lastSentHours: number;
  learnedToday: boolean;
}) {
  const quiet =
    p.quietStart === p.quietEnd
      ? true
      : p.quietStart > p.quietEnd
        ? p.hour >= p.quietStart || p.hour < p.quietEnd
        : p.hour >= p.quietStart && p.hour < p.quietEnd;
  return (
    p.enabled && p.consent && !quiet && !p.learnedToday && p.lastSentHours >= 24
  );
}
