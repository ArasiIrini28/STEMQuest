"use client";
import { FractionFuel, FractionMemory } from "./games";
import { useState, useEffect, useRef } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Play,
  RotateCcw,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";
import { mazeRocks, runMaze, runPythonSubset } from "@/lib/engine";
import type { Activity, Lesson } from "@/lib/types";
const arrows = {
  up: ArrowUp,
  down: ArrowDown,
  left: ArrowLeft,
  right: ArrowRight,
};
export function LessonPlayer({
  lesson,
  onSubmit,
  completed,
  onExit,
  reducedMotion,
}: {
  lesson: Lesson;
  onSubmit: (
    activity: Activity,
    value: unknown,
  ) => Promise<{ correct: boolean; xp: number; message?: string }>;
  completed: string[];
  onExit: () => void;
  reducedMotion: boolean;
}) {
  const [index, setIndex] = useState(-1),
    [feedback, setFeedback] = useState<{
      correct: boolean;
      xp: number;
      message?: string;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [hint, setHint] = useState(false);
  const activity = lesson.activities[index];
  async function submit(value: unknown) {
    if (busy) return;
    setBusy(true);
    try {
      setFeedback(await onSubmit(activity, value));
    } catch (e) {
      setFeedback({
        correct: false,
        xp: 0,
        message:
          e instanceof Error
            ? e.message
            : "Could not save your answer. Please retry.",
      });
    } finally {
      setBusy(false);
    }
  }
  function next() {
    setFeedback(null);
    setHint(false);
    setIndex(index + 1);
  }
  return (
    <div className="lesson-page">
      <button className="text-button" onClick={onExit}>
        ← Back to your worlds
      </button>
      <div className="lesson-meta">
        <span className="pill lavender">{lesson.level}</span>
        <span>
          {lesson.minutes} min · {lesson.difficulty}
        </span>
      </div>
      <h1>{lesson.title}</h1>
      <p className="lead">{lesson.subtitle}</p>
      <div className="lesson-progress">
        <i
          style={{
            width: `${(Math.max(0, index) / lesson.activities.length) * 100}%`,
          }}
        />
      </div>
      {index < 0 ? (
        <section className="panel lesson-intro">
          <span className="large-emoji">🚀</span>
          <h2>Your next adventure starts here</h2>
          <p>{lesson.intro}</p>
          <div className="concept">
            <Lightbulb size={24} />
            <div>
              <h3>A little knowledge before you go</h3>
              <p>{lesson.concept}</p>
            </div>
          </div>
          <button className="primary" onClick={next}>
            Let’s begin <ChevronRight size={18} />
          </button>
        </section>
      ) : index >= lesson.activities.length ? (
        <motion.section
          initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="panel completion"
        >
          <span className="large-emoji">🎉</span>
          <h2>Adventure complete!</h2>
          <p>
            You made room for something new in your brain. That’s worth
            celebrating.
          </p>
          <strong>
            {
              lesson.activities.filter((a) =>
                completed.includes(lesson.id + ":" + a.id),
              ).length
            }{" "}
            activities mastered
          </strong>
          <button className="primary" onClick={onExit}>
            Keep exploring <ChevronRight size={18} />
          </button>
        </motion.section>
      ) : (
        <section className="panel activity-panel">
          <div className="between">
            <span className="eyebrow">
              CHALLENGE {index + 1} OF {lesson.activities.length}
            </span>
            <span className="xp-tag">
              ✦ {activity.xp > 0 ? `${activity.xp} XP` : "Practice"}
            </span>
          </div>
          <h2>{activity.prompt}</h2>
          <ActivityInput
            key={activity.id}
            activity={activity}
            submit={submit}
            busy={busy}
            reducedMotion={reducedMotion}
          />
          <div className="activity-bottom">
            <button className="text-button" onClick={() => setHint(!hint)}>
              <Lightbulb size={17} />{" "}
              {hint ? "Hide hint" : "Need a little hint?"}
            </button>
            {["flashcard", "project"].includes(activity.kind) && (
              <button className="secondary" onClick={next}>
                Continue <ChevronRight size={16} />
              </button>
            )}
          </div>
          {hint && <p className="hint">{activity.hint}</p>}
          {feedback && (
            <div
              className={`feedback ${feedback.correct ? "correct" : "retry"}`}
              role="status"
            >
              <h3>
                {feedback.message
                  ? feedback.message
                  : feedback.correct
                    ? feedback.xp > 0
                      ? `Nicely done! +${feedback.xp} XP`
                      : "You’ve got it! Already mastered."
                    : "You’re learning. Give it another try!"}
              </h3>
              <p>{feedback.correct ? activity.explanation : activity.hint}</p>
              {feedback.correct && (
                <button className="primary" onClick={next}>
                  Continue <ChevronRight size={17} />
                </button>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
function ActivityInput({
  activity: a,
  submit,
  busy,
  reducedMotion,
}: {
  activity: Activity;
  submit: (value: unknown) => void;
  busy: boolean;
  reducedMotion: boolean;
}) {
  const [value, setValue] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [order, setOrder] = useState(a.options || []),
    [pairs, setPairs] = useState<string[]>(
      Array(a.options?.length || 0).fill(""),
    ),
    [flipped, setFlipped] = useState(false),
    [saved, setSaved] = useState(false);
  if (a.kind === "fraction-game")
    return <FractionFuel submit={submit} busy={busy} />;
  if (a.kind === "memory")
    return <FractionMemory submit={submit} busy={busy} />;
  if (a.kind === "maze")
    return <Maze submit={submit} busy={busy} reducedMotion={reducedMotion} />;
  if (a.kind === "simulation")
    return <GravityLab submit={submit} busy={busy} />;
  if (a.kind === "code") return <PythonLab submit={submit} busy={busy} />;
  if (a.kind === "flashcard")
    return (
      <button
        className={"flashcard " + (flipped ? "flipped" : "")}
        onClick={() => setFlipped(!flipped)}
      >
        <span>{flipped ? a.answer : "Think about your answer…"}</span>
        <small>{flipped ? "Click to turn back" : "Click to reveal"}</small>
      </button>
    );
  if (a.kind === "project")
    return (
      <>
        <textarea
          rows={6}
          maxLength={2000}
          aria-label="Project reflection"
          placeholder="My idea is…"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
        />
        <button
          className="secondary"
          disabled={value.trim().length < 30}
          onClick={() => {
            localStorage.setItem("stemquest-reflection-" + a.id, value);
            setSaved(true);
          }}
        >
          Save reflection on this device
        </button>
        {saved && (
          <p role="status" className="hint">
            Reflection saved on this device. It is ungraded and earns no
            automatic XP.
          </p>
        )}
      </>
    );
  return (
    <>
      {a.kind === "choice" && (
        <div className="answers">
          {a.options?.map((o, i) => (
            <button
              key={o}
              className={"answer " + (value === o ? "selected" : "")}
              onClick={() => setValue(o)}
              aria-pressed={value === o}
            >
              <span>{String.fromCharCode(65 + i)}</span>
              {o}
              <i>{value === o && <CheckCircle2 size={20} />}</i>
            </button>
          ))}
        </div>
      )}
      {a.kind === "multi" && (
        <div className="answers">
          {a.options?.map((o) => (
            <label
              className={"answer " + (selected.includes(o) ? "selected" : "")}
              key={o}
            >
              <input
                type="checkbox"
                checked={selected.includes(o)}
                onChange={() =>
                  setSelected(
                    selected.includes(o)
                      ? selected.filter((s) => s !== o)
                      : [...selected, o],
                  )
                }
              />
              {o}
            </label>
          ))}
        </div>
      )}
      {a.kind === "fill" && (
        <input
          className="big-input"
          aria-label="Your answer"
          placeholder="Type your answer…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={100}
        />
      )}
      {a.kind === "order" && (
        <div className="order-list">
          {order.map((o, i) => (
            <div key={o}>
              <span className="step-number">{i + 1}</span>
              <p>{o}</p>
              <button
                aria-label={"Move " + o + " up"}
                disabled={i === 0}
                onClick={() => {
                  const next = [...order];
                  [next[i], next[i - 1]] = [next[i - 1], next[i]];
                  setOrder(next);
                }}
              >
                <ArrowUp size={17} />
              </button>
              <button
                aria-label={"Move " + o + " down"}
                disabled={i === order.length - 1}
                onClick={() => {
                  const next = [...order];
                  [next[i], next[i + 1]] = [next[i + 1], next[i]];
                  setOrder(next);
                }}
              >
                <ArrowDown size={17} />
              </button>
            </div>
          ))}
        </div>
      )}
      {a.kind === "match" && (
        <div className="match-list">
          {a.options?.map((o, i) => (
            <label key={o}>
              {o}
              <select
                aria-label={"Match " + o}
                value={pairs[i]}
                onChange={(e) =>
                  setPairs(pairs.map((p, j) => (j === i ? e.target.value : p)))
                }
              >
                <option value="">Choose a match</option>
                {[...(a.answer as string[])].reverse().map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}
      <button
        className="primary check-answer"
        disabled={
          busy ||
          (a.kind === "choice" || a.kind === "fill"
            ? !value
            : a.kind === "multi"
              ? !selected.length
              : a.kind === "match"
                ? pairs.some((p) => !p)
                : false)
        }
        onClick={() =>
          submit(
            a.kind === "multi"
              ? selected
              : a.kind === "order"
                ? order
                : a.kind === "match"
                  ? pairs
                  : value,
          )
        }
      >
        {busy ? "Checking…" : "Check answer"} <CheckCircle2 size={18} />
      </button>
    </>
  );
}
function Maze({
  submit,
  busy,
  reducedMotion,
}: {
  submit: (v: unknown) => void;
  busy: boolean;
  reducedMotion: boolean;
}) {
  const [commands, setCommands] = useState<string[]>([]),
    [position, setPosition] = useState({ x: 0, y: 4 }),
    [running, setRunning] = useState(false),
    [message, setMessage] = useState("Add directions, then run your program."),
    [active, setActive] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function run() {
    const result = runMaze(commands);
    setRunning(true);
    setPosition({ x: 0, y: 4 });
    let i = 1;
    function step() {
      if (i < result.steps.length) {
        setPosition(result.steps[i]);
        setActive(i - 1);
        i++;
        timer.current = setTimeout(step, reducedMotion ? 40 : 350);
      } else {
        setRunning(false);
        setActive(-1);
        setMessage(
          result.success ? "Star reached! Your algorithm works." : result.error,
        );
        submit(commands);
      }
    }
    step();
  }
  return (
    <div className="maze-layout">
      <div
        className="maze-board"
        aria-label={`Robot at column ${position.x + 1}, row ${position.y + 1}`}
      >
        <div className="maze-grid">
          {Array.from({ length: 25 }, (_, i) => (
            <div key={i} className={mazeRocks.includes(i) ? "rock-cell" : ""}>
              {mazeRocks.includes(i) ? (
                "🪨"
              ) : i === 4 ? (
                <Star fill="#f5b94b" color="#dc9c29" size={30} />
              ) : i === 20 ? (
                <span className="start-label">START</span>
              ) : null}
            </div>
          ))}
        </div>
        <div
          className="maze-robot"
          style={{
            left: `${position.x * 20}%`,
            top: `${position.y * 20}%`,
            transition: reducedMotion ? "none" : "all .3s",
          }}
        >
          🤖
        </div>
      </div>
      <div className="maze-controls">
        <h3>
          Your program <small>{commands.length}/40 steps</small>
        </h3>
        <div className="direction-buttons">
          {Object.entries(arrows).map(([d, Icon]) => (
            <button
              key={d}
              onClick={() => setCommands([...commands, d])}
              disabled={running || commands.length >= 40}
              aria-label={"Add " + d}
            >
              <Icon size={20} />
              <small>{d}</small>
            </button>
          ))}
        </div>
        <div className="command-list">
          {commands.length ? (
            commands.map((c, i) => {
              const Icon = arrows[c as keyof typeof arrows];
              return (
                <button
                  className={active === i ? "active" : ""}
                  key={i}
                  aria-label={`Remove step ${i + 1}: ${c}`}
                  disabled={running}
                  onClick={() =>
                    setCommands(commands.filter((_, j) => j !== i))
                  }
                >
                  <small>{i + 1}</small>
                  <Icon size={17} />
                </button>
              );
            })
          ) : (
            <p>Your instructions will appear here.</p>
          )}
        </div>
        <div className="button-row">
          <button
            className="primary"
            onClick={run}
            disabled={!commands.length || running || busy}
          >
            <Play size={16} />
            {running ? "Running…" : "Run code"}
          </button>
          <button
            className="icon-button"
            aria-label="Reset program"
            disabled={running}
            onClick={() => {
              setCommands([]);
              setPosition({ x: 0, y: 4 });
              setMessage("Fresh start. Let’s try a new path.");
            }}
          >
            <RotateCcw size={18} />
          </button>
        </div>
        <p className="maze-message" role="status">
          {message}
        </p>
      </div>
    </div>
  );
}
export function GravityLab({
  submit,
  busy = false,
}: {
  submit?: (v: unknown) => void;
  busy?: boolean;
}) {
  const [height, setHeight] = useState(10),
    [gravity, setGravity] = useState(9.81),
    [drop, setDrop] = useState(0),
    [answer, setAnswer] = useState("");
  const duration = Math.sqrt((2 * height) / gravity);
  return (
    <div className="gravity-lab">
      <div className="gravity-stage">
        <div className="planet-label">
          {gravity === 9.81 ? "🌍 Earth" : "🌙 Moon"}
          <small>{gravity} m/s²</small>
        </div>
        <motion.div
          key={drop + "-" + gravity + "-" + height}
          className="falling-ball"
          initial={{ y: 0 }}
          animate={{ y: drop ? 150 : 0 }}
          transition={{ duration: drop ? duration : 0, ease: "easeIn" }}
        />
        <div className="ground" />
        <span className="height-line">{height} m</span>
      </div>
      <div className="simulation-controls">
        <label>
          Drop height <strong>{height} m</strong>
          <input
            type="range"
            min="2"
            max="20"
            value={height}
            onChange={(e) => {
              setHeight(+e.target.value);
              setDrop(0);
            }}
          />
        </label>
        <label>
          Location
          <select
            value={gravity}
            onChange={(e) => {
              setGravity(+e.target.value);
              setDrop(0);
            }}
          >
            <option value={9.81}>Earth</option>
            <option value={1.62}>Moon</option>
          </select>
        </label>
        <button className="secondary" onClick={() => setDrop(drop + 1)}>
          <Play size={16} />
          Drop the ball
        </button>
        <p>
          Calculated fall time: <strong>{duration.toFixed(2)} seconds</strong>
          <br />
          <small>Ideal model, without air resistance.</small>
        </p>
        {submit && (
          <>
            <label>
              Where does it fall more slowly?
              <select
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              >
                <option value="">Choose a place</option>
                <option>Earth</option>
                <option>Moon</option>
              </select>
            </label>
            <button
              className="primary"
              disabled={!drop || !answer || busy}
              onClick={() => submit(answer)}
            >
              Check discovery
            </button>
          </>
        )}
      </div>
    </div>
  );
}
export function PythonLab({
  submit,
  busy = false,
}: {
  submit?: (v: unknown) => void;
  busy?: boolean;
}) {
  const [code, setCode] = useState("for i in range(3):\n    print(i)"),
    [output, setOutput] = useState("Your output will appear here.");
  return (
    <div className="python-lab">
      <div className="editor-title">
        <span className="dot" /> Python practice{" "}
        <small>Limited learning interpreter</small>
      </div>
      <textarea
        aria-label="Python code"
        spellCheck={false}
        rows={7}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={500}
      />
      <div className="button-row">
        <button
          className="primary"
          disabled={busy}
          onClick={() => {
            const result = runPythonSubset(code);
            setOutput(result.output);
            if (submit && result.ok) submit(code);
          }}
        >
          <Play size={16} />
          Run code
        </button>
        <button
          className="secondary"
          onClick={() => {
            setCode("for i in range(3):\n    print(i)");
            setOutput("Your output will appear here.");
          }}
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>
      <pre aria-live="polite">{output}</pre>
      <p className="muted small">
        Supports range loops and print(i), up to 30 iterations. No arbitrary
        Python execution.
      </p>
    </div>
  );
}
