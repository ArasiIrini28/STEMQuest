import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
let db: PGlite;
const ids = {
  a: "00000000-0000-4000-8000-000000000001",
  b: "00000000-0000-4000-8000-000000000002",
  t: "00000000-0000-4000-8000-000000000003",
  g: "00000000-0000-4000-8000-000000000004",
  admin: "00000000-0000-4000-8000-000000000005",
  q: "00000000-0000-4000-8000-000000000006",
  r: "00000000-0000-4000-8000-000000000007",
};
async function asUser(id: string, sql: string) {
  await db.exec(
    `reset role; select set_config('request.jwt.claim.sub','${id}',false);set role authenticated;`,
  );
  try {
    return await db.query<Record<string, unknown>>(sql);
  } finally {
    await db.exec("reset role");
  }
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`,
  );
  for (const path of [
    "001_core.sql",
    "002_seed.sql",
    "003_services.sql",
    "004_expanded_content.sql",
    "005_content_and_classrooms.sql",
    "006_study_sessions.sql",
    "007_assessment_reports.sql",
  ])
    await db.exec(readFileSync("supabase/migrations/" + path, "utf8"));
  for (const id of Object.values(ids))
    await db.exec(
      `insert into auth.users(id,email,email_confirmed_at) values('${id}','test-${id}@example.invalid',now())`,
    );
  await db.exec(
    `update public.profiles set role='teacher' where id='${ids.t}';update public.profiles set role='guardian' where id='${ids.g}';update public.profiles set role='admin' where id='${ids.admin}';`,
  );
}, 30000);
afterAll(async () => {
  await db?.close();
});
describe("durable quiz and subject reports", () => {
  it("grades on the server, snapshots a full quiz, and isolates reports", async () => {
    const first = (
      await asUser(ids.q, "select public.start_quiz('fraction-flight') as q")
    ).rows[0].q as { id: string };
    expect(
      (
        (
          await asUser(
            ids.q,
            "select public.start_quiz('fraction-flight') as q",
          )
        ).rows[0].q as { id: string }
      ).id,
    ).toBe(first.id);
    await expect(
      asUser(
        ids.r,
        `select public.submit_quiz_answer('${first.id}','fuel','\"1/2\"')`,
      ),
    ).rejects.toThrow("Quiz unavailable");
    await expect(
      asUser(
        ids.q,
        `select public.submit_quiz_answer('${first.id}','forged','\"answer\"')`,
      ),
    ).rejects.toThrow("Question not part");
    await asUser(
      ids.q,
      `select public.submit_quiz_answer('${first.id}','fuel','\"wrong\"')`,
    );
    expect(
      (await asUser(ids.q, "select * from public.learning_reports")).rows,
    ).toHaveLength(0);
    await asUser(
      ids.q,
      `select public.submit_quiz_answer('${first.id}','equal','[\"2/4\",\"3/6\",\"4/8\"]')`,
    );
    const finished = (
      await asUser(
        ids.q,
        `select public.submit_quiz_answer('${first.id}','sum','\"3\"') as q`,
      )
    ).rows[0].q as { report: Record<string, unknown> };
    expect(finished.report).toMatchObject({
      total: 3,
      correct: 2,
      incorrect: 1,
      unanswered: 0,
      accuracy: 66.7,
      attempt: 1,
    });
    expect(
      (
        await asUser(
          ids.q,
          `select public.submit_quiz_answer('${first.id}','fuel','\"1/2\"') as q`,
        )
      ).rows[0].q,
    ).toEqual(finished);
    expect(
      (await asUser(ids.q, "select * from public.learning_reports")).rows,
    ).toHaveLength(1);
    expect(
      (await asUser(ids.r, "select * from public.learning_reports")).rows,
    ).toHaveLength(0);
    expect(
      (await asUser(ids.r, "select * from public.quiz_runs")).rows,
    ).toHaveLength(0);
    await expect(
      asUser(ids.q, `update public.learning_reports set document='{}'`),
    ).rejects.toThrow();
    await expect(
      asUser(
        ids.q,
        `insert into public.quiz_runs(student_id,lesson_id,title,subject,level,questions) values('${ids.q}','fraction-flight','Fake','math','Primary','[{}]')`,
      ),
    ).rejects.toThrow();
    const second = (
      await asUser(ids.q, "select public.start_quiz('fraction-flight') as q")
    ).rows[0].q as { id: string };
    expect(second.id).not.toBe(first.id);
    await asUser(
      ids.q,
      `select public.submit_quiz_answer('${second.id}','fuel','\"1/2\"')`,
    );
    await asUser(
      ids.q,
      `select public.submit_quiz_answer('${second.id}','equal','[\"2/4\",\"3/6\",\"4/8\"]')`,
    );
    const retake = (
      await asUser(
        ids.q,
        `select public.submit_quiz_answer('${second.id}','sum','\"3\"') as q`,
      )
    ).rows[0].q as { report: Record<string, unknown> };
    expect(retake.report).toMatchObject({ attempt: 2, xp: 25 });
    expect(
      (await asUser(ids.q, "select public.sync_subject_reports() as r")).rows[0]
        .r,
    ).toEqual([]);
    await asUser(
      ids.q,
      `select public.submit_activity('spaceship-fuel','fuel-game','\"6\"')`,
    );
    const milestone = (
      await asUser(ids.q, "select public.sync_subject_reports() as r")
    ).rows[0].r as Record<string, unknown>[];
    expect(milestone).toHaveLength(1);
    expect(milestone[0]).toMatchObject({
      kind: "subject",
      subject: "math",
      completed: 4,
      required: 4,
    });
    expect(
      (await asUser(ids.q, "select public.sync_subject_reports() as r")).rows[0]
        .r,
    ).toEqual([]);
  });
});
describe("database security and rewards", () => {
  it("owns sessions, reuses an active session, and finishes idempotently", async () => {
    const first = (
      await asUser(ids.b, "select public.start_study_session() as s")
    ).rows[0].s as { id: string };
    const again = (
      await asUser(ids.b, "select public.start_study_session() as s")
    ).rows[0].s as { id: string };
    expect(again.id).toBe(first.id);
    expect(
      (await asUser(ids.a, "select * from public.study_sessions")).rows,
    ).toHaveLength(0);
    await expect(
      asUser(ids.a, `select public.finish_study_session('${first.id}')`),
    ).rejects.toThrow("Session unavailable");
    await expect(
      asUser(
        ids.b,
        `insert into public.study_sessions(student_id) values('${ids.b}')`,
      ),
    ).rejects.toThrow();
    const finished = (
      await asUser(
        ids.b,
        `select public.finish_study_session('${first.id}') as s`,
      )
    ).rows[0].s;
    expect(
      (
        await asUser(
          ids.b,
          `select public.finish_study_session('${first.id}') as s`,
        )
      ).rows[0].s,
    ).toEqual(finished);
    expect(
      (await asUser(ids.b, "select * from public.xp_transactions")).rows,
    ).toHaveLength(0);
  });
  it("has every seeded lesson", async () => {
    const r = await db.query<{ n: number }>(
      "select count(*)::int as n from public.lessons",
    );
    expect(r.rows[0].n).toBe(16);
  });
  it("validates answers and prevents duplicate XP", async () => {
    let r = await asUser(
      ids.a,
      `select public.submit_activity('fraction-flight','fuel','"1/4"') as r`,
    );
    expect(r.rows[0].r).toEqual({ correct: false, xp: 0 });
    r = await asUser(
      ids.a,
      `select public.submit_activity('fraction-flight','fuel','"1/2"') as r`,
    );
    expect(r.rows[0].r).toEqual({ correct: true, xp: 25 });
    r = await asUser(
      ids.a,
      `select public.submit_activity('fraction-flight','fuel','"1/2"') as r`,
    );
    expect(r.rows[0].r).toEqual({ correct: true, xp: 0 });
  });
  it("validates maze commands on the server", async () => {
    const r = await asUser(
      ids.a,
      `select public.submit_activity('robot-rescue','maze','["up","up","right","right","up","up","right","right"]') as r`,
    );
    expect(r.rows[0].r).toEqual({ correct: true, xp: 60 });
  });
  it("validates the restricted Python exercise", async () => {
    const sql = `select public.submit_activity('loop-lab','python',to_jsonb(E'for i in range(5):\\n    print(i)'::text)) as r`;
    const r = await asUser(ids.a, sql);
    expect(r.rows[0].r).toEqual({ correct: true, xp: 45 });
  });
  it("hides another student’s progress and answers", async () => {
    expect(
      (await asUser(ids.b, "select * from public.learning_progress")).rows,
    ).toHaveLength(0);
    expect(
      (await asUser(ids.b, "select * from public.student_answers")).rows,
    ).toHaveLength(0);
  });
  it("blocks forged XP and role changes", async () => {
    await expect(
      asUser(
        ids.b,
        `insert into public.xp_transactions(student_id,lesson_id,activity_id,amount) values('${ids.b}','fraction-flight','fuel',9999)`,
      ),
    ).rejects.toThrow();
    await expect(
      asUser(
        ids.b,
        `update public.profiles set role='admin' where id='${ids.b}'`,
      ),
    ).rejects.toThrow();
  });
  it("keeps answer keys private", async () => {
    await expect(
      asUser(ids.a, "select * from private.answer_keys"),
    ).rejects.toThrow();
  });
  it("rejects student-created classes", async () => {
    await expect(
      asUser(ids.a, `select public.create_class('Forged class')`),
    ).rejects.toThrow("Verified teacher");
  });
  it("enforces teacher membership and single-use invites", async () => {
    const created = await asUser(
      ids.t,
      `select public.create_class('Test class') as c`,
    );
    const cid = (created.rows[0].c as { id: string }).id;
    const invite = await asUser(
      ids.t,
      `select public.create_class_invite('${cid}') as token`,
    );
    const token = invite.rows[0].token;
    expect(
      (await asUser(ids.t, "select * from public.learning_progress")).rows,
    ).toHaveLength(0);
    await asUser(ids.a, `select public.accept_class_invite('${token}')`);
    expect(
      (await asUser(ids.t, "select * from public.learning_progress")).rows
        .length,
    ).toBeGreaterThan(0);
    await expect(
      asUser(ids.b, `select public.accept_class_invite('${token}')`),
    ).rejects.toThrow("invalid or expired");
    await expect(
      asUser(
        ids.b,
        `insert into public.assignments(class_id,lesson_id,title,due_at,created_by) values('${cid}','fraction-flight','Fake',now(),'${ids.b}')`,
      ),
    ).rejects.toThrow();
  });
  it("does not allow guardian lookup without verified linking", async () => {
    expect(
      (await asUser(ids.g, "select * from public.guardian_summary()")).rows,
    ).toHaveLength(0);
    await expect(
      asUser(ids.g, `select public.create_guardian_invite('${ids.a}')`),
    ).rejects.toThrow("Administrator");
  });
  it("computes only the requesting student snapshot", async () => {
    const r = await asUser(ids.a, "select public.learning_snapshot() as s");
    const s = r.rows[0].s as {
      xp: number;
      completed: string[];
      days: string[];
    };
    expect(s.xp).toBe(130);
    expect(s.completed).toHaveLength(3);
    expect(s.days).toHaveLength(1);
    const other = await asUser(ids.b, "select public.learning_snapshot() as s");
    expect((other.rows[0].s as { xp: number }).xp).toBe(0);
  });
  it("requires consent and service role for email jobs", async () => {
    await expect(
      asUser(ids.a, "select * from public.claim_reminders()"),
    ).rejects.toThrow();
    await db.exec("set role service_role");
    const r = await db.query("select * from public.claim_reminders()");
    expect(r.rows).toHaveLength(0);
    await db.exec("reset role");
  });
  it("records failed email attempts, retries, and deduplicates sent reminders", async () => {
    await db.exec(
      `update public.profiles set consent_verified=true,settings=jsonb_set(settings,'{timezone}',to_jsonb((select name from pg_timezone_names where extract(hour from now() at time zone name)=18 limit 1))) where id='${ids.b}';update public.reminder_preferences set enabled=true where user_id='${ids.b}';set role service_role`,
    );
    const first = await db.query<{ delivery_id: string }>(
      "select * from public.claim_reminders()",
    );
    expect(first.rows).toHaveLength(1);
    const id = first.rows[0].delivery_id;
    expect(
      (await db.query("select * from public.claim_reminders()")).rows,
    ).toHaveLength(0);
    await db.query(
      `select public.finish_delivery('${id}',null,'Provider unavailable')`,
    );
    const retry = await db.query<{ delivery_id: string }>(
      "select * from public.claim_reminders()",
    );
    expect(retry.rows[0].delivery_id).toBe(id);
    await db.query(
      `select public.finish_delivery('${id}','test-provider-confirmation',null)`,
    );
    expect(
      (await db.query("select * from public.claim_reminders()")).rows,
    ).toHaveLength(0);
    await db.exec("reset role");
  });
  it("limits AI usage atomically to five questions a day", async () => {
    await db.exec(
      `update public.profiles set consent_verified=true where id='${ids.b}'`,
    );
    for (let i = 0; i < 5; i++)
      await asUser(ids.b, "select public.reserve_ai_use()");
    await expect(
      asUser(ids.b, "select public.reserve_ai_use()"),
    ).rejects.toThrow("five tutor questions");
  });
  it("requires consent for AI", async () => {
    await expect(
      asUser(ids.a, "select public.reserve_ai_use()"),
    ).rejects.toThrow("Verified consent");
  });
});
describe("expanded curriculum and content permissions", () => {
  it("awards both new games once with server validation", async () => {
    expect(
      (
        await asUser(
          ids.b,
          `select public.submit_activity('spaceship-fuel','fuel-game','"4"') as r`,
        )
      ).rows[0].r,
    ).toEqual({ correct: false, xp: 0 });
    expect(
      (
        await asUser(
          ids.b,
          `select public.submit_activity('spaceship-fuel','fuel-game','"6"') as r`,
        )
      ).rows[0].r,
    ).toEqual({ correct: true, xp: 40 });
    expect(
      (
        await asUser(
          ids.b,
          `select public.submit_activity('fraction-memory','memory','["half","third","threequarters"]') as r`,
        )
      ).rows[0].r,
    ).toEqual({ correct: true, xp: 45 });
    expect(
      (
        await asUser(
          ids.b,
          `select public.submit_activity('fraction-memory','memory','["half","third","threequarters"]') as r`,
        )
      ).rows[0].r,
    ).toEqual({ correct: true, xp: 0 });
  });
  it("reports only enrolled learners to their teacher", async () => {
    await expect(
      asUser(ids.b, "select * from public.class_performance()"),
    ).rejects.toThrow("Teacher permission");
    const r = await asUser(ids.t, "select * from public.class_performance()");
    expect(r.rows).toHaveLength(1);
    expect(Number(r.rows[0].xp)).toBe(130);
    expect(Number(r.rows[0].completed)).toBe(3);
    expect(
      (await asUser(ids.admin, "select * from public.class_performance()"))
        .rows,
    ).toHaveLength(0);
  });
  it("restricts publishing, hides drafts and answers, caps authored XP", async () => {
    const id = "custom-12345678-1234-1234-1234-123456789012";
    const doc = {
      id,
      title: "New numbers",
      world: "math",
      level: "Primary",
      concept: "Two equal groups make the whole. Learn to count them.",
      activities: [
        {
          id: "question",
          kind: "choice",
          prompt: "One plus one?",
          options: ["1", "2", "3"],
          answer: "2",
          explanation: "One and one make two.",
          xp: 99999,
        },
      ],
    };
    const literal = "'" + JSON.stringify(doc) + "'::jsonb";
    await expect(
      asUser(ids.b, `select public.save_custom_lesson(${literal},true)`),
    ).rejects.toThrow("Administrator");
    await asUser(
      ids.admin,
      `select public.save_custom_lesson(${literal},false)`,
    );
    expect(
      (await asUser(ids.b, `select * from public.lessons where id='${id}'`))
        .rows,
    ).toHaveLength(0);
    await expect(
      asUser(ids.b, `select public.submit_activity('${id}','question','"2"')`),
    ).rejects.toThrow();
    await asUser(
      ids.admin,
      `select public.save_custom_lesson(${literal},true)`,
    );
    const r = await asUser(
      ids.b,
      `select content from public.activities where lesson_id='${id}'`,
    );
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].content).not.toHaveProperty("answer");
    expect(
      (
        await asUser(
          ids.b,
          `select public.submit_activity('${id}','question','"2"') as r`,
        )
      ).rows[0].r,
    ).toEqual({ correct: true, xp: 25 });
    await asUser(
      ids.admin,
      `select public.save_custom_lesson(${literal},false)`,
    );
    expect(
      (
        await asUser(
          ids.b,
          `select * from public.activities where lesson_id='${id}'`,
        )
      ).rows,
    ).toHaveLength(0);
  });
});
