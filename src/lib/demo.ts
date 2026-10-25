import type { LearningState } from "./types";
import { initialState } from "./engine";
export type DemoRoster = Record<string, LearningState>;
/** Restore the local learner after reload or account logout, without cloud data. */
export function readActiveDemo(
  storage: Pick<Storage, "getItem"> = localStorage,
) {
  let id = "explorer";
  const read = (key: string) => {
    try {
      return JSON.parse(storage.getItem(key) || "null");
    } catch {
      return null;
    }
  };
  try {
    id = storage.getItem("stemquest-active-demo") || id;
  } catch {}
  const roster = read("stemquest-demo-roster");
  const saved = roster?.[id] || read("stemquest-demo-v1");
  const valid =
    saved &&
    typeof saved === "object" &&
    Array.isArray(saved.attempts) &&
    Array.isArray(saved.completed);
  const state: LearningState = valid
    ? {
        ...initialState,
        ...saved,
        profile: { ...initialState.profile, ...saved.profile },
      }
    : { ...initialState, profile: { ...initialState.profile } };
  // A demo must never inherit a connected account's privileged role.
  state.profile.role = "student";
  return { id, state };
}
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
