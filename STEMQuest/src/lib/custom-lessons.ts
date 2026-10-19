import type { Lesson } from "./types";
import { supabase } from "./supabase";
export interface AuthoredLesson {
  lesson: Lesson;
  published: boolean;
}
export function readDemoLessons(): AuthoredLesson[] {
  try {
    return JSON.parse(
      localStorage.getItem("stemquest-authored-lessons") || "[]",
    );
  } catch {
    return [];
  }
}
export async function loadAuthoredLessons(
  demo: boolean,
  includeDrafts = false,
): Promise<AuthoredLesson[]> {
  if (demo)
    return readDemoLessons().filter((r) => includeDrafts || r.published);
  const { data, error } = await supabase!
    .from("lessons")
    .select("id,content,published,activities(content)")
    .like("id", "custom-%");
  if (error) throw new Error(error.message);
  return (data || [])
    .filter((r) => includeDrafts || r.published)
    .map((r) => ({
      published: r.published,
      lesson: {
        ...r.content,
        activities: (r.activities || []).map((a: { content: object }) => ({
          ...a.content,
          answer: "",
        })),
      } as Lesson,
    }));
}
export async function saveAuthoredLesson(
  lesson: Lesson,
  published: boolean,
  demo: boolean,
) {
  if (demo) {
    const rows = readDemoLessons();
    const i = rows.findIndex((r) => r.lesson.id === lesson.id);
    if (i >= 0) rows[i] = { lesson, published };
    else rows.push({ lesson, published });
    localStorage.setItem("stemquest-authored-lessons", JSON.stringify(rows));
  } else {
    const { error } = await supabase!.rpc("save_custom_lesson", {
      document: lesson,
      is_published: published,
    });
    if (error) throw new Error(error.message);
  }
  window.dispatchEvent(new Event("stemquest-content-updated"));
}
