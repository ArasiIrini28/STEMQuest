"use client";
import { ContentStudio } from "./content-studio";
import { useState, useEffect } from "react";
import {
  Plus,
  BookOpen,
  Users,
  Download,
  ShieldCheck,
  ArrowRight,
  Link as LinkIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { lessons, worlds } from "@/lib/content";
import type { LearningState } from "@/lib/types";
interface ClassRow {
  id: string;
  name: string;
  code?: string;
}
interface Assignment {
  id: string;
  title: string;
  lesson_id: string;
  due_at: string;
  class_id: string;
}
export function Staff({
  role,
  demo,
  state,
}: {
  role: string;
  demo: boolean;
  state: LearningState;
}) {
  const [classes, setClasses] = useState<ClassRow[]>([]),
    [assignments, setAssignments] = useState<Assignment[]>([]),
    [name, setName] = useState(""),
    [selected, setSelected] = useState(""),
    [lesson, setLesson] = useState(lessons[0].id),
    [due, setDue] = useState(""),
    [message, setMessage] = useState(""),
    [token, setToken] = useState(""),
    [linked, setLinked] = useState<
      { display_name: string; xp: number; completed: number }[]
    >([]),
    [performance, setPerformance] = useState<
      {
        class_name: string;
        display_name: string;
        xp: number;
        completed: number;
        last_activity: string | null;
      }[]
    >([]);
  useEffect(() => {
    if (demo) {
      setClasses(
        JSON.parse(
          localStorage.getItem("stemquest-demo-classes") ||
            '[{"id":"demo-class","name":"Curiosity Club · Grade 7","code":"DEMO-ONLY"}]',
        ),
      );
      setAssignments(
        JSON.parse(localStorage.getItem("stemquest-demo-assignments") || "[]"),
      );
      return;
    }
    supabase
      ?.from("classes")
      .select("id,name")
      .then(({ data, error }) => {
        if (error) setMessage(error.message);
        else setClasses(data || []);
      });
    supabase
      ?.from("assignments")
      .select("*")
      .then(({ data }) => setAssignments(data || []));
    if (role === "teacher")
      supabase?.rpc("class_performance").then(({ data, error }) => {
        if (error) setMessage(error.message);
        else setPerformance(data || []);
      });
    if (role === "guardian")
      supabase?.rpc("guardian_summary").then(({ data, error }) => {
        if (error) setMessage(error.message);
        else setLinked(data || []);
      });
  }, [demo, role]);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (demo) {
      const next = [
        ...classes,
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          code: "DEMO-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
        },
      ];
      setClasses(next);
      localStorage.setItem("stemquest-demo-classes", JSON.stringify(next));
      setMessage("Demo class created on this device.");
    } else {
      const r = await supabase!.rpc("create_class", {
        class_name: name.trim(),
      });
      if (r.error) {
        setMessage(r.error.message);
        return;
      }
      setClasses([...classes, r.data]);
      setMessage("Class created.");
    }
    setName("");
  }
  async function assign(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !due) return;
    const item = {
      id: crypto.randomUUID(),
      class_id: selected,
      lesson_id: lesson,
      title: lessons.find((l) => l.id === lesson)!.title,
      due_at: due,
    };
    if (demo) {
      const next = [...assignments, item];
      setAssignments(next);
      localStorage.setItem("stemquest-demo-assignments", JSON.stringify(next));
      setMessage("Demo assignment saved.");
    } else {
      const { error } = await supabase!.from("assignments").insert({
        ...item,
        created_by: (await supabase!.auth.getUser()).data.user?.id,
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setAssignments([...assignments, item]);
      setMessage("Assignment published to the class.");
    }
  }
  function exportReport() {
    const rows = [
      ["Class", "Assignment", "Due"],
      ...assignments.map((a) => [
        classes.find((c) => c.id === a.class_id)?.name || "",
        a.title,
        a.due_at,
      ]),
    ];
    const csv = rows
      .map((r) =>
        r
          .map(
            (v) =>
              '"' +
              (/^[=+@-]/.test(v) ? "'" : "") +
              v.replace(/"/g, '""') +
              '"',
          )
          .join(","),
      )
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "stemquest-assignments.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  const allowed = demo || state.profile.role === role;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            A LITTLE SUPPORT MAKES A BIG DIFFERENCE
          </span>
          <h1>
            {role === "teacher"
              ? "Your classroom, connected"
              : role === "guardian"
                ? "Growing together"
                : "Content & platform studio"}
          </h1>
          <p>
            {role === "teacher"
              ? "Create opportunities for every curious mind."
              : role === "guardian"
                ? "Encouragement for their learning journey."
                : "A thoughtful place to build new learning adventures."}
          </p>
        </div>
      </div>
      {demo && (
        <div className="service-note">
          <ShieldCheck size={19} />
          <span>
            Demo workspace · Sample data and device-only changes. No real
            students, invitations, or messages.
          </span>
        </div>
      )}
      {!allowed ? (
        <div className="panel empty-state">
          <ShieldCheck size={40} />
          <h2>This space needs an authorized role</h2>
          <p>
            Your account is a student account. Role changes require an
            administrator.
          </p>
        </div>
      ) : role === "teacher" ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <Users />
              <div>
                <strong>{classes.length}</strong>
                <span>Classes</span>
              </div>
            </div>
            <div className="stat-card">
              <BookOpen />
              <div>
                <strong>{assignments.length}</strong>
                <span>Assignments</span>
              </div>
            </div>
            <div className="stat-card">
              <ShieldCheck />
              <div>
                <strong>{demo ? "Demo" : "Verified"}</strong>
                <span>Workspace access</span>
              </div>
            </div>
          </div>
          <div className="analytics-grid">
            <section className="panel">
              <h2>Your classes</h2>
              {classes.map((c) => (
                <div className="class-row" key={c.id}>
                  <span className="stat-icon lavender">
                    <Users size={20} />
                  </span>
                  <div>
                    <strong>{c.name}</strong>
                    <small>
                      {c.code ? "Invitation: " + c.code : "Private classroom"}
                    </small>
                  </div>
                  <button
                    className="text-button"
                    onClick={async () => {
                      if (demo) {
                        setMessage(
                          "Demo invitation: " +
                            c.code +
                            ". This code cannot enrol real students.",
                        );
                        return;
                      }
                      const r = await supabase!.rpc("create_class_invite", {
                        target_class: c.id,
                      });
                      setMessage(
                        r.error
                          ? r.error.message
                          : "One-use invitation token (expires in 48 hours): " +
                              r.data,
                      );
                    }}
                  >
                    Invite
                  </button>
                </div>
              ))}
              <form className="inline-form" onSubmit={create}>
                <input
                  aria-label="New class name"
                  maxLength={80}
                  required
                  placeholder="A name for your new class"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <button className="primary">
                  <Plus size={17} />
                  Create
                </button>
              </form>
            </section>
            <section className="panel">
              <h2>Give curiosity a direction</h2>
              <form onSubmit={assign}>
                <label>
                  Class
                  <select
                    required
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    <option value="">Choose a class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Learning adventure
                  <select
                    value={lesson}
                    onChange={(e) => setLesson(e.target.value)}
                  >
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Due date
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                  />
                </label>
                <button className="primary">
                  Assign lesson <ArrowRight size={17} />
                </button>
              </form>
            </section>
          </div>
          <section className="panel">
            <div className="between">
              <h2>Assignments</h2>
              <button className="secondary" onClick={exportReport}>
                <Download size={16} />
                Export CSV
              </button>
            </div>
            {assignments.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Adventure</th>
                      <th>Class</th>
                      <th>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a.id}>
                        <td>{a.title}</td>
                        <td>
                          {classes.find((c) => c.id === a.class_id)?.name}
                        </td>
                        <td>{a.due_at.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <BookOpen />
                <p>Assign your first learning adventure to get started.</p>
              </div>
            )}
          </section>
          <section className="panel">
            <h2>Class learning progress</h2>
            <p className="muted small">
              {demo
                ? "Current demo learner activity on this device. No fictional scores are added."
                : "Only learners enrolled in your own classes are shown."}
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Learner</th>
                    <th>XP</th>
                    <th>Mastered</th>
                    <th>Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {(demo
                    ? [
                        {
                          class_name: "Device demo",
                          display_name: state.profile.name,
                          xp: state.xp,
                          completed: state.completed.length,
                          last_activity: state.attempts.at(-1)?.at || null,
                        },
                      ]
                    : performance
                  ).map((r, i) => (
                    <tr key={i}>
                      <td>{r.class_name}</td>
                      <td>{r.display_name}</td>
                      <td>{r.xp}</td>
                      <td>{r.completed}</td>
                      <td>
                        {r.last_activity
                          ? new Date(r.last_activity).toLocaleDateString()
                          : "No activity yet"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!demo && !performance.length && (
              <p className="muted">
                No enrolled learners yet. Create a class and share a one-use
                invitation.
              </p>
            )}
          </section>
        </>
      ) : role === "guardian" ? (
        <>
          <section className="panel">
            <h2>A secure connection comes first</h2>
            <p>
              Use a one-time invitation created by an authorized school
              administrator after consent is verified. A child’s email alone
              cannot grant access.
            </p>
            <form
              className="inline-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (demo) {
                  setMessage(
                    "This is a demo. Real linking requires a verified invitation in a connected project.",
                  );
                  return;
                }
                const r = await supabase!.rpc("accept_guardian_invite", {
                  invite_token: token,
                });
                setMessage(
                  r.error
                    ? r.error.message
                    : "Invitation accepted. Reload to view authorized progress.",
                );
              }}
            >
              <input
                aria-label="Guardian invitation token"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Secure invitation token"
              />
              <button className="primary">
                <LinkIcon size={17} />
                Link account
              </button>
            </form>
          </section>
          {demo ? (
            <section className="panel guardian-demo">
              <span className="pill lavender">SAMPLE FAMILY VIEW</span>
              <h2>Cosmic Owl’s learning week</h2>
              <p>
                A fictional example of the summary a verified guardian can see.
              </p>
              <div className="stats-grid">
                <div>
                  <strong>4</strong>
                  <span>Learning days</span>
                </div>
                <div>
                  <strong>185</strong>
                  <span>XP this week</span>
                </div>
                <div>
                  <strong>6</strong>
                  <span>Challenges mastered</span>
                </div>
              </div>
              <div className="hint">
                Try asking: “What surprised you in your learning today?”
              </div>
            </section>
          ) : (
            linked.map((s) => (
              <section className="panel" key={s.display_name}>
                <h2>{s.display_name}</h2>
                <p>
                  {s.xp} XP · {s.completed} challenges mastered
                </p>
              </section>
            ))
          )}
        </>
      ) : (
        <>
          <section className="panel">
            <h2>Curriculum library</h2>
            <p>
              {worlds.length} worlds · {lessons.length} original lessons ·{" "}
              {lessons.reduce((n, l) => n + l.activities.length, 0)} activities
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Lesson</th>
                    <th>Level</th>
                    <th>Activities</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((l) => (
                    <tr key={l.id}>
                      <td>{l.title}</td>
                      <td>{l.level}</td>
                      <td>{l.activities.length}</td>
                      <td>
                        <span className="pill mint">Published starter</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <ContentStudio demo={demo} />
          <section className="panel">
            <h2>Service health</h2>
            <p>Authentication: {demo ? "Not connected" : "Connected"}</p>
            <p>
              Email delivery and AI usage: require deployed Edge Functions and
              service credentials.
            </p>
            <p>
              Role grants and verified guardian invitations are restricted to
              administrators in the database.
            </p>
          </section>
        </>
      )}
      {message && (
        <div className="toast-message" role="status">
          <p>{message}</p>
          <button className="text-button" onClick={() => setMessage("")}>
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}
