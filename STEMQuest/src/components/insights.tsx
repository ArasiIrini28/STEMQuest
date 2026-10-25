"use client";
import { readRoster, rankingRows } from "@/lib/demo";
import { useState, useEffect } from "react";
import {
  Flame,
  Trophy,
  Zap,
  ArrowRight,
  Check,
  BookOpen,
  ShieldCheck,
  Send,
  Sparkles,
} from "lucide-react";
import { dayKey, streak } from "@/lib/engine";
import { achievements, lessons, worlds } from "@/lib/content";
import { supabase } from "@/lib/supabase";
import type { LearningState, Lesson } from "@/lib/types";
export function Missions({
  state,
  openLesson,
}: {
  state: LearningState;
  openLesson: (l: Lesson) => void;
}) {
  const today = dayKey(new Date(), state.profile.timezone),
    count = state.attempts.filter(
      (a) =>
        a.xp > 0 && dayKey(new Date(a.at), state.profile.timezone) === today,
    ).length;
  const recommended =
    lessons.find((l) => l.level === state.profile.level) || lessons[0];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A LITTLE PROGRESS EVERY DAY</span>
          <h1>Your daily missions</h1>
          <p>Small challenges. Real discoveries. A reason to feel proud.</p>
        </div>
        <span className="pill orange">
          <Flame size={16} />
          Fresh every day
        </span>
      </div>
      <section className="mission-banner">
        <div>
          <h2>Today is full of possibilities.</h2>
          <p>Pick one mission and see where your curiosity takes you.</p>
        </div>
        <span>🎯</span>
      </section>
      <div className="lesson-grid">
        {[
          {
            title: "Make a new discovery",
            text: "Master one challenge today.",
            goal: 1,
            icon: "🌱",
          },
          {
            title: "Give your brain a little stretch",
            text: "Master three challenges today.",
            goal: 3,
            icon: "🧠",
          },
          {
            title: "Explore a new world",
            text: "Try the robot rescue mission.",
            goal: 1,
            icon: "🤖",
          },
        ].map((m, i) => {
          const done =
            i === 2
              ? state.completed.includes("robot-rescue:maze")
              : count >= m.goal;
          return (
            <section className="panel mission-card" key={m.title}>
              <span className="large-emoji">{m.icon}</span>
              <span className={"pill " + (done ? "mint" : "lavender")}>
                {done ? "Mission accomplished" : "Daily mission"}
              </span>
              <h2>{m.title}</h2>
              <p>{m.text}</p>
              <div className="mini-progress">
                <i
                  style={{
                    width: `${done ? 100 : Math.min(100, (count / m.goal) * 100)}%`,
                  }}
                />
              </div>
              <button
                className={done ? "secondary" : "primary"}
                onClick={() =>
                  openLesson(
                    i === 2
                      ? lessons.find((l) => l.id === "robot-rescue")!
                      : recommended,
                  )
                }
              >
                {done ? "Practice again" : "Start mission"}
                {done ? <Check size={16} /> : <ArrowRight size={16} />}
              </button>
            </section>
          );
        })}
      </div>
      <p className="muted small">
        Mission progress comes from completed activities. XP is awarded once per
        activity; missions do not add duplicate rewards.
      </p>
    </>
  );
}
export function Achievements({ state }: { state: LearningState }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">LOOK HOW FAR YOU’VE COME</span>
          <h1>Your little hall of fame</h1>
          <p>Every badge tells a story of something you tried.</p>
        </div>
      </div>
      <div className="achievement-summary">
        <Trophy size={44} />
        <div>
          <h2>
            {
              achievements.filter((a) => state.completed.length >= a.target)
                .length
            }{" "}
            of {achievements.length} badges earned
          </h2>
          <p>
            Your next milestone is one discovery away. {state.coins} coins
            earned.
          </p>
        </div>
      </div>
      <div className="achievement-grid">
        {achievements.map((a, i) => {
          const earned = state.completed.length >= a.target;
          return (
            <section
              className={"panel achievement-card " + (earned ? "earned" : "")}
              key={a.id}
            >
              <div className="medallion">{["🌱", "💡", "🧭", "🌟"][i]}</div>
              <h2>{a.title}</h2>
              <p>{a.description}</p>
              <span className={"pill " + (earned ? "mint" : "neutral")}>
                {earned
                  ? "Earned!"
                  : `${Math.min(state.completed.length, a.target)} / ${a.target}`}
              </span>
              <div className="mini-progress">
                <i
                  style={{
                    width: `${Math.min(100, (state.completed.length / a.target) * 100)}%`,
                  }}
                />
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
export function Analytics({ state }: { state: LearningState }) {
  const s = streak(state.days, dayKey(new Date(), state.profile.timezone));
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const key = dayKey(d, state.profile.timezone);
    return {
      key,
      label: d.toLocaleDateString("en", { weekday: "short" }),
      xp: state.attempts
        .filter((a) => dayKey(new Date(a.at), state.profile.timezone) === key)
        .reduce((n, a) => n + a.xp, 0),
    };
  });
  const max = Math.max(100, ...days.map((d) => d.xp));
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SMALL STEPS ADD UP</span>
          <h1>Your learning story</h1>
          <p>A look at the discoveries you’re making along the way.</p>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon lavender">
            <Zap />
          </span>
          <div>
            <strong>{state.xp}</strong>
            <span>Total XP</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon orange">
            <Flame />
          </span>
          <div>
            <strong>{s.current} days</strong>
            <span>Current streak</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon mint">
            <Trophy />
          </span>
          <div>
            <strong>{s.longest} days</strong>
            <span>Personal best streak</span>
          </div>
        </div>
      </div>
      <div className="analytics-grid">
        <section className="panel">
          <h2>A week of curiosity</h2>
          <p className="muted">XP earned each day</p>
          <div className="bar-chart">
            {days.map((d) => (
              <div key={d.key}>
                <span>{d.xp}</span>
                <i style={{ height: Math.max(3, (d.xp / max) * 160) }} />
                <small>{d.label}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Your learning calendar</h2>
          <p className="muted">Last 28 days · {state.profile.timezone}</p>
          <div className="calendar-grid">
            {Array.from({ length: 28 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - 27 + i);
              const key = dayKey(d, state.profile.timezone);
              return (
                <div
                  key={key}
                  title={
                    key +
                    (state.days.includes(key) ? " · Learned" : " · Rest day")
                  }
                  className={state.days.includes(key) ? "active" : ""}
                >
                  {d.getDate()}
                </div>
              );
            })}
          </div>
          <p className="small muted">
            A learning day counts after your first newly mastered activity. Rest
            days are okay.
          </p>
        </section>
      </div>
      <section className="panel">
        <h2>Your worlds, in progress</h2>
        <div className="subject-progress">
          {worlds.map((w) => {
            const items = lessons
                .filter((l) => l.world === w.id)
                .flatMap((l) =>
                  l.activities
                    .filter((a) => a.xp > 0)
                    .map((a) => l.id + ":" + a.id),
                ),
              done = items.filter((id) => state.completed.includes(id)).length;
            return (
              <div key={w.id}>
                <div className="between">
                  <strong>{w.title}</strong>
                  <span>
                    {done}/{items.length} challenges
                  </span>
                </div>
                <div className="mini-progress">
                  <i
                    style={{
                      width: `${(done / items.length) * 100}%`,
                      background: w.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="panel recent-attempts">
        <h2>Recent learning moments</h2>
        {state.attempts.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Lesson</th>
                  <th>Result</th>
                  <th>XP</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {state.attempts
                  .slice(-8)
                  .reverse()
                  .map((a, i) => (
                    <tr key={i}>
                      <td>
                        {lessons.find((l) => l.id === a.lessonId)?.title ||
                          a.lessonId}
                      </td>
                      <td>
                        <span
                          className={"pill " + (a.correct ? "mint" : "orange")}
                        >
                          {a.correct ? "Mastered" : "Practicing"}
                        </span>
                      </td>
                      <td>+{a.xp}</td>
                      <td>{new Date(a.at).toLocaleDateString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <BookOpen size={32} />
            <p>Your learning story starts with your first challenge.</p>
          </div>
        )}
      </section>
    </>
  );
}
export function Leaderboard({
  state,
  demo,
}: {
  state: LearningState;
  demo: boolean;
}) {
  const [period, setPeriod] = useState("Weekly"),
    [rows, setRows] = useState<{ name: string; xp: number; avatar: string }[]>(
      [],
    ),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (demo) {
      const roster = readRoster();
      const activeId =
        localStorage.getItem("stemquest-active-demo") || "explorer";
      roster[activeId] = state;
      setRows(
        rankingRows(roster, period).map((r) => ({
          ...r,
          name: r.name + (r.id === activeId ? " (you)" : ""),
        })),
      );
      return;
    }
    let cancelled = false;
    supabase
      ?.rpc("class_leaderboard", { period: period.toLowerCase() })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setMessage(error.message);
        else
          setRows(
            (data || []).map((r: { display_name: string; xp: number }) => ({
              name: r.display_name,
              xp: r.xp,
              avatar: "🌟",
            })),
          );
      });
    return () => {
      cancelled = true;
    };
  }, [period, demo, state]);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CELEBRATE EACH OTHER</span>
          <h1>The curiosity club</h1>
          <p>A little friendly encouragement for the journey.</p>
        </div>
      </div>
      <div className="filter-bar">
        <div className="tabs">
          {["Daily", "Weekly", "Monthly", "All time"].map((p) => (
            <button
              key={p}
              className={period === p ? "active" : ""}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      {demo && (
        <div className="service-note">
          <ShieldCheck size={19} />
          <span>
            Device-only leaderboard · Scores come from completed demo
            activities. Switch demo learners in Settings to explore together on
            this device.
          </span>
        </div>
      )}
      {rows.length > 0 && (
        <div className="podium">
          {[1, 0, 2].map(
            (i) =>
              rows[i] && (
                <div className={"podium-place rank-" + (i + 1)} key={i}>
                  <span className="podium-avatar">{rows[i].avatar}</span>
                  <span className="rank-medal">{["🥇", "🥈", "🥉"][i]}</span>
                  <h3>{rows[i].name}</h3>
                  <p>{rows[i].xp.toLocaleString()} XP</p>
                  <div>{i + 1}</div>
                </div>
              ),
          )}
        </div>
      )}
      <section className="panel leaderboard-table">
        <div className="between">
          <h2>{period} explorers</h2>
          <span className="pill lavender">
            {demo ? "This device" : "Your classes"}
          </span>
        </div>
        {message && <p role="alert">{message}</p>}
        {rows.length ? (
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Explorer</th>
                <th>XP earned</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.name}
                  className={r.name.includes("(you)") ? "you" : ""}
                >
                  <td>{i + 1}</td>
                  <td>
                    <span className="table-avatar">{r.avatar}</span>
                    {r.name}
                  </td>
                  <td>{r.xp.toLocaleString()} XP</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <Trophy />
            <p>
              {demo
                ? "No recorded scores yet. Complete a challenge to earn your place here."
                : "No class rankings yet. Join a teacher’s class and opt in from your settings."}
            </p>
          </div>
        )}
        <p className="small muted">
          Rankings use XP earned in the selected period. Repeating a completed
          activity adds no XP. Connected accounts only see opted-in learners in
          their own classes.
        </p>
      </section>
    </>
  );
}
export function Tutor({
  onClose,
  demo,
}: {
  level: string;
  onClose: () => void;
  demo: boolean;
}) {
  const [q, setQ] = useState(""),
    [messages, setMessages] = useState([
      {
        who: "tutor",
        text: "Hi, explorer! What are you curious about? I can help with fractions, gravity, algorithms, and study strategies.",
      },
    ]),
    [busy, setBusy] = useState(false);
  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim() || busy) return;
    const question = q.trim();
    setQ("");
    setMessages((m) => [...m, { who: "you", text: question }]);
    setBusy(true);
    let answer = "";
    if (!demo && supabase) {
      const r = await supabase.functions.invoke("tutor", {
        body: { question },
      });
      answer = r.error
        ? "The AI service is not available. Try the lesson’s built-in hints."
        : r.data?.answer || "Try the lesson’s built-in hints.";
    } else {
      const lower = question.toLowerCase();
      answer = /fraction|half|quarter/.test(lower)
        ? "Think of a pizza cut into equal slices. The denominator counts all the slices; the numerator counts the slices you have. For 2/4, can you group the slices into two equal halves?"
        : /gravity|fall|moon/.test(lower)
          ? "Gravity pulls objects toward a planet. The Moon has weaker gravity than Earth. Try the same drop height in both places in the Gravity Lab. Where does the ball take longer?"
          : /code|robot|algorithm|loop/.test(lower)
            ? "An algorithm is a sequence of steps. In Robot Rescue, follow your directions one at a time. If Byte hits a rock, find the first step that went wrong and change it. What does Byte need to do first?"
            : "Try breaking the problem into smaller steps: what do you know, what do you need to find, and what could you try first? Open the hint inside a lesson for a topic-specific clue.";
    }
    setMessages((m) => [...m, { who: "tutor", text: answer }]);
    setBusy(false);
  }
  return (
    <aside className="tutor-drawer" aria-label="Learning helper">
      <div className="between">
        <div>
          <span className="eyebrow">A LITTLE HELP ALONG THE WAY</span>
          <h2>
            <Sparkles size={20} />
            Quest companion
          </h2>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close learning helper"
        >
          ×
        </button>
      </div>
      <p className="service-note">
        {demo
          ? "Built-in study hints · Not live AI"
          : "Optional AI tutor · Check important answers with a trusted source"}
      </p>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={"chat " + m.who}>
            {m.text}
          </div>
        ))}
        {busy && <div className="chat tutor">Thinking…</div>}
      </div>
      <form onSubmit={ask}>
        <input
          aria-label="Ask a learning question"
          placeholder="What are you curious about?"
          value={q}
          maxLength={500}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          className="primary"
          disabled={busy || !q.trim()}
          aria-label="Send question"
        >
          <Send size={17} />
        </button>
      </form>
    </aside>
  );
}
