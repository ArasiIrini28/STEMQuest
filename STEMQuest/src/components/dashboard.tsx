import {
  ArrowRight,
  Flame,
  Zap,
  Target,
  Trophy,
  ChevronRight,
  Clock,
  BookOpen,
  Sparkles,
  Check,
  CalendarDays,
} from "lucide-react";
import { HeroArt, WorldArt } from "./art";
import { worlds, lessons, achievements } from "@/lib/content";
import { dayKey, streak } from "@/lib/engine";
import type { LearningState, Lesson } from "@/lib/types";
export function Dashboard({
  state,
  navigate,
  openLesson,
}: {
  state: LearningState;
  navigate: (v: string) => void;
  openLesson: (l: Lesson) => void;
  demo: boolean;
}) {
  const s = streak(state.days, dayKey(new Date(), state.profile.timezone));
  const recommend = lessons.filter((l) => l.level === state.profile.level);
  const today = state.attempts.filter(
    (a) =>
      dayKey(new Date(a.at), state.profile.timezone) ===
        dayKey(new Date(), state.profile.timezone) && a.xp > 0,
  ).length;
  const daily = Math.min(100, (today / 3) * 100);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">LET’S MAKE ROOM FOR WONDER</span>
          <h1>
            Hey, {state.profile.name}! <span className="wave">👋</span>
          </h1>
          <p>A little progress today. A world of possibilities tomorrow.</p>
        </div>
        <span className="date-chip">
          <CalendarDays size={16} />
          {state.profile.grade} Explorer
        </span>
      </div>
      <div className="dashboard-columns">
        <div className="main-column">
          <section className="adventure-hero">
            <div className="hero-copy">
              <span className="hero-kicker">
                <span /> YOUR NEXT BIG DISCOVERY
              </span>
              <h2>
                Small steps.
                <br />
                Extraordinary adventures.
              </h2>
              <p>
                New worlds to explore. New things to learn.
                <br />
                Your next “aha!” moment is waiting.
              </p>
              <button onClick={() => openLesson(recommend[0] || lessons[0])}>
                Let’s go exploring <ArrowRight size={18} />
              </button>
            </div>
            <HeroArt />
            <div className="hero-orbit" />
          </section>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon orange">
                <Flame size={23} />
              </span>
              <div>
                <strong>
                  {s.current}
                  <small> day{s.current === 1 ? "" : "s"}</small>
                </strong>
                <span>Learning streak</span>
              </div>
              <span className="stat-note">Keep it going!</span>
            </div>
            <div className="stat-card">
              <span className="stat-icon lavender">
                <Zap size={23} />
              </span>
              <div>
                <strong>{state.xp.toLocaleString()}</strong>
                <span>Total XP earned</span>
              </div>
              <span className="stat-note purple">
                Level {Math.floor(state.xp / 250) + 1}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-icon mint">
                <Target size={23} />
              </span>
              <div>
                <strong>{state.completed.length}</strong>
                <span>Challenges mastered</span>
              </div>
            </div>
          </div>
          <div className="section-title">
            <div>
              <h2>
                Pick your next adventure <span>✦</span>
              </h2>
              <p>Big discoveries begin with a little curiosity.</p>
            </div>
            <button className="text-button" onClick={() => navigate("worlds")}>
              All worlds <ArrowRight size={16} />
            </button>
          </div>
          <div className="world-grid">
            {worlds.slice(0, 3).map((w) => {
              const all = lessons.filter((l) => l.world === w.id);
              const count = all
                .flatMap((l) =>
                  l.activities
                    .filter((a) => a.xp > 0)
                    .map((a) => ({ key: l.id + ":" + a.id })),
                )
                .filter((a) => state.completed.includes(a.key)).length;
              const total = all.reduce(
                (n, l) => n + l.activities.filter((a) => a.xp > 0).length,
                0,
              );
              return (
                <button
                  className="world-card"
                  key={w.id}
                  onClick={() => navigate("world:" + w.id)}
                >
                  <div className="world-art-wrap">
                    <WorldArt kind={w.icon} />
                    <span className="world-lesson-pill">
                      {all.length} lessons
                    </span>
                  </div>
                  <div className="world-card-body">
                    <h3>
                      {w.title}
                      <ChevronRight size={18} />
                    </h3>
                    <p>{w.description}</p>
                    <div className="mini-progress">
                      <i
                        style={{
                          width: `${(count / total) * 100}%`,
                          background: w.color,
                        }}
                      />
                    </div>
                    <div className="world-progress">
                      <span>
                        {count
                          ? `${count} challenges mastered`
                          : "A new adventure awaits"}
                      </span>
                      <strong style={{ color: w.color }}>
                        {Math.round((count / total) * 100)}%
                      </strong>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="section-title">
            <div>
              <h2>Made for your curious mind</h2>
              <p>A good place to start, based on your learning level.</p>
            </div>
            <button
              className="text-button"
              onClick={() => navigate("catalogue")}
            >
              Browse lessons <ArrowRight size={16} />
            </button>
          </div>
          <div className="recommended-list">
            {recommend.slice(0, 2).map((l) => (
              <button
                key={l.id}
                className="recommended-card"
                onClick={() => openLesson(l)}
              >
                <span
                  className={
                    "lesson-symbol " +
                    (l.world === "science" ? "mint" : "lavender")
                  }
                >
                  {l.world === "science"
                    ? "🧪"
                    : l.world === "coding"
                      ? "🤖"
                      : "🚀"}
                </span>
                <div>
                  <span className="eyebrow">
                    {worlds.find((w) => w.id === l.world)?.subject}
                  </span>
                  <h3>{l.title}</h3>
                  <p>
                    <Clock size={13} />
                    {l.minutes} min <span>·</span>
                    {l.difficulty}
                  </p>
                </div>
                <span className="round-arrow">
                  <ArrowRight size={18} />
                </span>
              </button>
            ))}
          </div>
          <section className="curiosity-note">
            <span>💡</span>
            <p>
              <strong>Curiosity is your superpower.</strong> It’s okay to make
              mistakes. That’s where the learning happens.
            </p>
            <Sparkles size={25} />
          </section>
        </div>
        <aside className="right-column">
          <section className="panel daily-goal">
            <div className="between">
              <h3>Your daily goal</h3>
              <span className="tiny-label">TODAY</span>
            </div>
            <div
              className="goal-ring"
              style={{
                background: `conic-gradient(#8271e8 ${daily}%,#efedf7 0)`,
              }}
            >
              <div>
                <Target size={25} />
                <strong>
                  {Math.min(today, 3)} <small>/ 3</small>
                </strong>
                <span>challenges</span>
              </div>
            </div>
            <h4>
              {today >= 3
                ? "You did it! Make time to rest."
                : "A little learning goes a long way"}
            </h4>
            <p>
              {today >= 3
                ? "Your daily challenge goal is complete."
                : "Complete 3 challenges to reach today’s goal."}
            </p>
            <div className="week-dots">
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - 6 + i);
                const done = state.days.includes(
                  dayKey(date, state.profile.timezone),
                );
                return (
                  <div key={i}>
                    <span>
                      {date.toLocaleDateString("en", { weekday: "narrow" })}
                    </span>
                    <i className={done ? "done" : i === 6 ? "today" : ""}>
                      {done ? <Check size={12} /> : ""}
                    </i>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="panel missions-widget">
            <div className="between">
              <h3>Daily missions</h3>
              <span>⚡</span>
            </div>
            {[
              {
                title: "Make a new discovery",
                sub: "Complete one challenge",
                done: today >= 1,
                xp: 25,
              },
              {
                title: "Keep your curiosity going",
                sub: "Master three challenges",
                done: today >= 3,
                xp: 75,
              },
            ].map((m) => (
              <button
                className="mission-mini"
                key={m.title}
                onClick={() => navigate("missions")}
              >
                <span className={"mission-check " + (m.done ? "checked" : "")}>
                  {m.done ? <Check size={14} /> : <BookOpen size={17} />}
                </span>
                <div>
                  <strong>{m.title}</strong>
                  <small>{m.sub}</small>
                </div>
                <ChevronRight size={15} />
              </button>
            ))}
            <button
              className="text-button"
              onClick={() => navigate("missions")}
            >
              View all missions <ArrowRight size={14} />
            </button>
          </section>
          <section className="panel badge-widget">
            <div className="between">
              <h3>A little hall of fame</h3>
              <Trophy size={18} color="#dca950" />
            </div>
            <div className="badge-preview">
              {["🌱", "💡", "🧭"].map((a, i) => (
                <div
                  key={a}
                  className={
                    state.completed.length >= achievements[i].target
                      ? "earned"
                      : ""
                  }
                >
                  <span>{a}</span>
                  <small>{achievements[i].title}</small>
                </div>
              ))}
            </div>
            <button
              className="text-button"
              onClick={() => navigate("achievements")}
            >
              Your achievements <ArrowRight size={14} />
            </button>
          </section>
          <section className="community-note">
            <span>🌿</span>
            <div>
              <h4>Grow at your own pace.</h4>
              <p>Your only competition is yesterday’s you.</p>
            </div>
          </section>
        </aside>
      </div>
      <div className="page-footer">
        <span>Made for curious minds, everywhere.</span>
        <span>Keep wondering. Keep growing. ✨</span>
      </div>
    </>
  );
}
export function WorldCatalogue({
  state,
  openLesson,
  navigate,
  worldId,
  catalogue = lessons,
}: {
  state: LearningState;
  openLesson: (l: Lesson) => void;
  navigate: (v: string) => void;
  worldId?: string;
  catalogue?: Lesson[];
}) {
  const world = worlds.find((w) => w.id === worldId);
  if (world)
    return (
      <>
        <button className="text-button" onClick={() => navigate("worlds")}>
          ← All worlds
        </button>
        <div
          className="world-detail-hero"
          style={{ background: world.color + "18" }}
        >
          <div>
            <span className="eyebrow">YOUR LEARNING WORLD</span>
            <h1>{world.title}</h1>
            <p>{world.description}</p>
            <span className="pill">
              Original starter curriculum · More to explore over time
            </span>
          </div>
          <WorldArt kind={world.icon} />
        </div>
        <div className="lesson-grid">
          {lessons
            .filter((l) => l.world === world.id)
            .map((l, i) => (
              <LessonCard
                key={l.id}
                lesson={l}
                index={i}
                state={state}
                openLesson={openLesson}
              />
            ))}
        </div>
      </>
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">FOLLOW YOUR CURIOSITY</span>
          <h1>A world of possibilities</h1>
          <p>Six worlds. So many ways to discover what you can do.</p>
        </div>
      </div>
      <div className="world-grid all-worlds">
        {worlds.map((w) => (
          <button
            key={w.id}
            className="world-card"
            onClick={() => navigate("world:" + w.id)}
          >
            <WorldArt kind={w.icon} />
            <div className="world-card-body">
              <h3>
                {w.title}
                <ArrowRight size={18} />
              </h3>
              <p>{w.description}</p>
              <span
                className="pill"
                style={{ background: w.color + "15", color: w.color }}
              >
                {catalogue.filter((l) => l.world === w.id).length} adventures to
                explore
              </span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
export function LessonCard({
  lesson: l,
  index = 0,
  state,
  openLesson,
}: {
  lesson: Lesson;
  index?: number;
  state: LearningState;
  openLesson: (l: Lesson) => void;
}) {
  const done = l.activities.filter((a) =>
    state.completed.includes(l.id + ":" + a.id),
  ).length;
  return (
    <button className="panel lesson-card" onClick={() => openLesson(l)}>
      <div className="between">
        <span className="lesson-number">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="pill lavender">{l.level}</span>
      </div>
      <h3>{l.title}</h3>
      <p>{l.subtitle}</p>
      <div className="lesson-card-meta">
        <span>
          <Clock size={15} />
          {l.minutes} min
        </span>
        <span>
          <Zap size={15} />
          {l.activities.reduce((n, a) => n + a.xp, 0)} XP
        </span>
      </div>
      <div className="mini-progress">
        <i
          style={{
            width: `${(done / l.activities.filter((a) => a.xp > 0).length) * 100}%`,
          }}
        />
      </div>
      <div className="between">
        <small>
          {done}/{l.activities.filter((a) => a.xp > 0).length} challenges
          mastered
        </small>
        <ArrowRight size={18} />
      </div>
    </button>
  );
}
