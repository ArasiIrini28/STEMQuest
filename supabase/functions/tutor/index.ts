import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json, cors } from "../_shared/http.ts";
import {
  parseTutorInput,
  generateTutorReply,
} from "../_shared/tutor-provider.ts";
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const auth = req.headers.get("authorization");
  if (!auth) return json({ error: "Sign in first" }, 401);
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } },
  );
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return json({ error: "Sign in first" }, 401);
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key)
    return json(
      { error: "AI is not configured. Built-in study help is available." },
      503,
    );
  let input;
  try {
    const raw = await req.text();
    if (raw.length > 25000) return json({ error: "Request too large" }, 413);
    input = parseTutorInput(JSON.parse(raw));
  } catch {
    return json({ error: "Invalid question or conversation context" }, 400);
  }
  const { data: profile, error } = await db.rpc("reserve_ai_use");
  if (error)
    return json(
      {
        error: "AI requires verified consent and an available daily allowance.",
      },
      429,
    );
  try {
    let context =
      "No current lesson provided. No student scores or reports are available to you.";
    if (input.lessonId) {
      const { data: lesson } = await db
        .from("lessons")
        .select("id,title,content")
        .eq("id", input.lessonId)
        .eq("published", true)
        .maybeSingle();
      if (lesson) {
        const { data: activity } = input.activityId
          ? await db
              .from("activities")
              .select("id,content")
              .eq("lesson_id", lesson.id)
              .eq("id", input.activityId)
              .maybeSingle()
          : { data: null };
        const { data: recent } = await db
          .from("assessment_attempts")
          .select("activity_id,correct")
          .eq("student_id", user.id)
          .eq("lesson_id", lesson.id)
          .order("created_at", { ascending: false })
          .limit(1);
        context = JSON.stringify({
          title: lesson.title,
          concept: lesson.content?.concept,
          question: activity?.content?.prompt,
          hint: activity?.content?.hint,
          recentResult: recent?.[0] || null,
        }).slice(0, 5000);
      }
    }
    return json(
      await generateTutorReply(input, {
        key,
        model: Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini",
        level: profile.level || "student",
        context,
      }),
    );
  } catch {
    return json(
      {
        error:
          "The AI provider could not respond. Use built-in study help or retry.",
      },
      503,
    );
  }
});
