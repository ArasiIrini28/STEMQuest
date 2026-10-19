import type { LearningState } from "./types";
export type DemoRoster = Record<string, LearningState>;
export function readRoster(): DemoRoster {
  try {
    return JSON.parse(localStorage.getItem("stemquest-demo-roster") || "{}");
  } catch {
    return {};
  }
}
export function rankingRows(
  roster: DemoRoster,
  period: string,
  now = new Date(),
) {
  const since =
    period === "Daily"
      ? Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      : period === "Weekly"
        ? now.getTime() - 7 * 86400000
        : period === "Monthly"
          ? now.getTime() - 30 * 86400000
          : -Infinity;
  return Object.entries(roster)
    .map(([id, s]) => ({
      id,
      name: s.profile.name,
      xp: s.attempts
        .filter((a) => Date.parse(a.at) >= since)
        .reduce((n, a) => n + a.xp, 0),
      avatar: "🧑‍🚀",
    }))
    .filter((r) => r.xp > 0)
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
}
