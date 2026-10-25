import { writeFileSync, mkdirSync } from "node:fs";
import { worlds, lessons, achievements } from "../src/lib/content.ts";
const q = (v) => "'" + String(v).replaceAll("'", "''") + "'";
const j = (v) => q(JSON.stringify(v)) + "::jsonb";
const lines = [
  "-- Generated from src/lib/content.ts by npm run seed:generate. Review before applying.",
];
for (const w of worlds)
  lines.push(
    `insert into public.subjects(id,title,color) values(${q(w.id)},${q(w.subject)},${q(w.color)}) on conflict(id) do update set title=excluded.title,color=excluded.color;`,
  );
for (const level of [...new Set(lessons.map((l) => l.level))])
  lines.push(
    `insert into public.grade_levels values(${q(level)},${q(level)}) on conflict do nothing;`,
  );
for (const l of lessons) {
  const { activities, ...meta } = l;
  lines.push(
    `insert into public.courses values(${q(l.world + "-" + l.level)},${q(l.world)},${q(l.level)},${q(l.world + " · " + l.level)}) on conflict do nothing;`,
  );
  lines.push(
    `insert into public.topics values(${q(l.id)},${q(l.world + "-" + l.level)},${q(l.title)}) on conflict do nothing;`,
  );
  lines.push(
    `insert into public.lessons values(${q(l.id)},${q(l.id)},${q(l.title)},${j(meta)},true) on conflict(id) do update set title=excluded.title,content=excluded.content;`,
  );
  for (const a of activities) {
    const { answer, ...publicContent } = a;
    lines.push(
      `insert into public.activities values(${q(a.id)},${q(l.id)},${q(a.kind)},${j(publicContent)},${a.xp}) on conflict(lesson_id,id) do update set content=excluded.content,xp=excluded.xp;`,
    );
    lines.push(
      `insert into private.answer_keys values(${q(l.id)},${q(a.id)},${j(answer)}) on conflict(lesson_id,activity_id) do update set answer=excluded.answer;`,
    );
  }
}
mkdirSync(new URL("../work/", import.meta.url), { recursive: true });
writeFileSync(
  new URL("../work/seed.sql", import.meta.url),
  lines.join("\n") + "\n",
);
console.log(
  `Generated ${lessons.length} lessons and ${lessons.reduce((n, l) => n + l.activities.length, 0)} activities.`,
);
