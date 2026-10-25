import { supabase } from "./supabase";
export interface StudySession {
  id: string;
  started_at: string;
  ended_at: string | null;
}
const key = (owner: string) => "stemquest-sessions:" + owner;
export async function sessions(
  owner: string,
  remote: boolean,
): Promise<StudySession[]> {
  if (remote) {
    const { data, error } = await supabase!
      .from("study_sessions")
      .select("id,started_at,ended_at")
      .order("started_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }
  try {
    return JSON.parse(localStorage.getItem(key(owner)) || "[]");
  } catch {
    return [];
  }
}
export async function sessionAction(
  owner: string,
  remote: boolean,
  action: "start" | "finish",
  id?: string,
): Promise<StudySession> {
  if (remote) {
    const { data, error } = await supabase!.rpc(
      action === "start" ? "start_study_session" : "finish_study_session",
      action === "start" ? {} : { session_id: id },
    );
    if (error) throw error;
    return data;
  }
  const rows = await sessions(owner, false);
  let row =
    action === "start"
      ? rows.find((r) => !r.ended_at)
      : rows.find((r) => r.id === id);
  if (!row && action === "start") {
    row = {
      id: crypto.randomUUID(),
      started_at: new Date().toISOString(),
      ended_at: null,
    };
    rows.unshift(row);
  }
  if (!row) throw new Error("Learning session not found.");
  if (action === "finish" && !row.ended_at)
    row.ended_at = new Date().toISOString();
  localStorage.setItem(key(owner), JSON.stringify(rows));
  return row;
}
