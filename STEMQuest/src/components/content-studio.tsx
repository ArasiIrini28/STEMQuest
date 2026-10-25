"use client";
import { useEffect, useState } from "react";
import { Plus, Save, BookOpen } from "lucide-react";
import {
  loadAuthoredLessons,
  saveAuthoredLesson,
  type AuthoredLesson,
} from "@/lib/custom-lessons";
import type { Lesson, Level } from "@/lib/types";
import { worlds } from "@/lib/content";
export function ContentStudio({ demo }: { demo: boolean }) {
  const [rows, setRows] = useState<AuthoredLesson[]>([]),
    [title, setTitle] = useState(""),
    [concept, setConcept] = useState(""),
    [world, setWorld] = useState("math"),
    [level, setLevel] = useState<Level>("Middle school"),
    [prompt, setPrompt] = useState(""),
    [options, setOptions] = useState(["", "", ""]),
    [correct, setCorrect] = useState(0),
    [explanation, setExplanation] = useState(""),
    [editing, setEditing] = useState<string | null>(null),
    [published, setPublished] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    loadAuthoredLessons(demo, true)
      .then(setRows)
      .catch((e) => setMessage(e.message));
  }, [demo]);
  function reset() {
    setEditing(null);
    setTitle("");
    setConcept("");
    setPrompt("");
    setOptions(["", "", ""]);
    setCorrect(0);
    setExplanation("");
    setPublished(false);
    setMessage("New lesson ready to write.");
  }
  async function edit(row: AuthoredLesson) {
    if (!demo) {
      setMessage(
        "Published assessment answers are private. When editing, select the correct answer again before saving.",
      );
    }
    setEditing(row.lesson.id);
    setTitle(row.lesson.title);
    setConcept(row.lesson.concept);
    setPrompt(row.lesson.activities[0].prompt);
    setOptions(row.lesson.activities[0].options || ["", "", ""]);
    setCorrect(
      Math.max(
        0,
        (row.lesson.activities[0].options || []).indexOf(
          String(row.lesson.activities[0].answer),
        ),
      ),
    );
    setExplanation(row.lesson.activities[0].explanation);
    setWorld(row.lesson.world);
    setLevel(row.lesson.level);
    setPublished(row.published);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (new Set(options.map((o) => o.trim())).size !== 3) {
      setMessage("Use three different answer choices.");
      return;
    }
    setBusy(true);
    try {
      const item: Lesson = {
        id: editing || "custom-" + crypto.randomUUID(),
        title: title.trim(),
        subtitle: "An adventure from your content studio.",
        world,
        level,
        minutes: 5,
        difficulty: "Explorer",
        intro: concept.trim(),
        concept: concept.trim(),
        activities: [
          {
            id: "question",
            kind: "choice",
            prompt: prompt.trim(),
            options: options.map((o) => o.trim()),
            answer: options[correct].trim(),
            hint: "Read the learning explanation again, then compare the choices.",
            explanation: explanation.trim(),
            xp: 25,
          },
        ],
      };
      await saveAuthoredLesson(item, published, demo);
      setEditing(item.id);
      setRows(await loadAuthoredLessons(demo, true));
      setMessage(
        published
          ? "Lesson published. It is available in the subject catalogue."
          : "Draft saved. Only administrators can see it.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save the lesson.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <div className="between">
        <h2>Lesson authoring studio</h2>
        <button className="secondary" onClick={reset}>
          <Plus size={16} />
          New lesson
        </button>
      </div>
      <p className="muted small">
        {demo
          ? "Device-only content workspace. Published lessons are playable in this browser."
          : "Authorized administrators can create, edit, publish, and unpublish a lesson with one multiple-choice assessment."}{" "}
        Editing a published assessment does not reset past rewards.
      </p>
      <div className="cms-list">
        {rows.map((r) => (
          <div key={r.lesson.id}>
            <div className="between">
              <h3>{r.lesson.title}</h3>
              <span className={"pill " + (r.published ? "mint" : "lavender")}>
                {r.published ? "Published" : "Draft"}
              </span>
            </div>
            <p>
              {r.lesson.level} ·{" "}
              {worlds.find((w) => w.id === r.lesson.world)?.subject}
            </p>
            <button className="text-button" onClick={() => edit(r)}>
              Edit lesson
            </button>
            {r.published && (
              <a
                className="text-button"
                style={{ marginLeft: 18 }}
                href={"#lesson:" + r.lesson.id}
              >
                Open lesson <BookOpen size={14} />
              </a>
            )}
          </div>
        ))}
      </div>
      <form className="cms-form" onSubmit={save}>
        <label>
          Lesson title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
          />
        </label>
        <div className="form-grid">
          <label>
            Subject world
            <select value={world} onChange={(e) => setWorld(e.target.value)}>
              {worlds.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Learning group
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
            >
              {[
                "Primary",
                "Middle school",
                "Secondary",
                "Higher secondary",
                "College",
              ].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Learning explanation
          <textarea
            required
            minLength={20}
            maxLength={3000}
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
          />
        </label>
        <label>
          Assessment question
          <input
            required
            maxLength={500}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </label>
        {options.map((o, i) => (
          <label key={i}>
            Answer choice {i + 1}
            <input
              required
              maxLength={200}
              value={o}
              onChange={(e) =>
                setOptions(
                  options.map((v, j) => (i === j ? e.target.value : v)),
                )
              }
            />
          </label>
        ))}
        <label>
          Correct answer
          <select value={correct} onChange={(e) => setCorrect(+e.target.value)}>
            {options.map((_, i) => (
              <option key={i} value={i}>
                Choice {i + 1}
              </option>
            ))}
          </select>
        </label>
        <label>
          Answer explanation
          <textarea
            required
            minLength={10}
            maxLength={1000}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Publish in the catalogue
        </label>
        <button className="primary" disabled={busy}>
          <Save size={16} />
          {busy ? "Saving lesson…" : "Save lesson"}
        </button>
      </form>
      {message && (
        <p className="hint" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
