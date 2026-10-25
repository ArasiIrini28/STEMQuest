"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Home,
  Compass,
  BookOpen,
  Code2,
  FlaskConical,
  Target,
  Trophy,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronDown,
  Search,
  Bell,
  Flame,
  Zap,
  Menu,
  X,
  Users,
  ArrowRight,
  Check,
} from "lucide-react";
import { MotionConfig } from "framer-motion";
import { Dashboard, WorldCatalogue, LessonCard } from "./dashboard";
import { LessonPlayer, GravityLab, PythonLab } from "./activities";
import { Auth, Onboarding, Settings as SettingsPage } from "./account";
import {
  Missions,
  Achievements,
  Analytics,
  Leaderboard,
  Tutor,
} from "./insights";
import { CircuitLab } from "./games";
import { Staff } from "./staff";
import { Landing } from "./landing";
import { lessons, worlds } from "@/lib/content";
import {
  initialState,
  award,
  validateAnswer,
  dayKey,
  streak,
} from "@/lib/engine";
import { loadAuthoredLessons } from "@/lib/custom-lessons";
import { readRoster } from "@/lib/demo";
import { supabase, configurationError } from "@/lib/supabase";
import type { LearningState, Lesson, Profile, Activity } from "@/lib/types";
const nav = [
  { id: "dashboard", label: "My dashboard", icon: Home },
  { id: "worlds", label: "Learning worlds", icon: Compass },
  { id: "catalogue", label: "Explore subjects", icon: BookOpen },
  { id: "coding", label: "Coding playground", icon: Code2 },
  { id: "simulations", label: "Science simulations", icon: FlaskConical },
  { id: "missions", label: "Daily missions", icon: Target },
  { id: "achievements", label: "Achievements", icon: Trophy },
  { id: "leaderboard", label: "Leaderboard", icon: Users },
  { id: "progress", label: "My progress", icon: BarChart3 },
];
export function StemQuest() {
  const [view, setView] = useState("dashboard"),
    [state, setState] = useState<LearningState>(initialState),
    [ready, setReady] = useState(false),
    [userId, setUserId] = useState<string | null>(null),
    [mobile, setMobile] = useState(false),
    [tutor, setTutor] = useState(false),
    [search, setSearch] = useState(""),
    [level, setLevel] = useState("All levels"),
    [subject, setSubject] = useState("All subjects"),
    [error, setError] = useState(""),
    [joinToken, setJoinToken] = useState(""),
    [demoId, setDemoId] = useState("explorer"),
    [authored, setAuthored] = useState<Lesson[]>([]);
  const demo = !userId;
  const navigate = useCallback((v: string) => {
    setView(v);
    setMobile(false);
    window.location.hash = v;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  const loadRemote = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.rpc("learning_snapshot");
    if (error) throw new Error(error.message);
    if (data)
      setState({
        ...initialState,
        ...data,
        profile: { ...initialState.profile, ...data.profile },
      });
  }, []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("stemquest-demo-v1");
      if (saved) {
        const p = JSON.parse(saved);
        setState({
          ...initialState,
          ...p,
          profile: { ...initialState.profile, ...p.profile },
        });
      }
    } catch {}
    setDemoId(localStorage.getItem("stemquest-active-demo") || "explorer");
    if (configurationError) setError(configurationError);
    setReady(true);
    const hash = window.location.hash.slice(1);
    if (hash && !hash.includes("access_token")) setView(hash);
    const handler = () => {
      const h = window.location.hash.slice(1);
      if (h && !h.includes("access_token")) setView(h);
    };
    window.addEventListener("hashchange", handler);
    const sub = supabase?.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user.id || null);
      if (session) {
        setTimeout(() => loadRemote().catch((e) => setError(e.message)), 0);
        if (event === "PASSWORD_RECOVERY") navigate("reset");
      } else if (event === "SIGNED_OUT") {
        setState(initialState);
        navigate("login");
      }
    });
    return () => {
      window.removeEventListener("hashchange", handler);
      sub?.data.subscription.unsubscribe();
    };
  }, [loadRemote, navigate]);
  useEffect(() => {
    if (ready && demo) {
      localStorage.setItem("stemquest-demo-v1", JSON.stringify(state));
      const roster = readRoster();
      roster[demoId] = state;
      localStorage.setItem("stemquest-demo-roster", JSON.stringify(roster));
    }
  }, [state, ready, demo, demoId]);
  function switchDemo(id: string) {
    const roster = readRoster();
    roster[demoId] = state;
    localStorage.setItem("stemquest-demo-roster", JSON.stringify(roster));
    const preset =
      id === "nova"
        ? { name: "Nova", level: "Primary" as const, grade: "Grade 4" }
        : id === "byte"
          ? { name: "Byte", level: "College" as const, grade: "College year 1" }
          : {
              name: "Explorer",
              level: "Middle school" as const,
              grade: "Grade 7",
            };
    setState(
      roster[id] || {
        ...initialState,
        profile: { ...initialState.profile, ...preset },
      },
    );
    setDemoId(id);
    localStorage.setItem("stemquest-active-demo", id);
  }

  useEffect(() => {
    let cancelled = false;
    const reload = () =>
      loadAuthoredLessons(demo)
        .then((rows) => {
          if (!cancelled) setAuthored(rows.map((r) => r.lesson));
        })
        .catch((e) => setError(e.message));
    reload();
    window.addEventListener("stemquest-content-updated", reload);
    return () => {
      cancelled = true;
      window.removeEventListener("stemquest-content-updated", reload);
    };
  }, [demo]);
  const catalogue = [...lessons, ...authored];
  async function saveProfile(p: Profile) {
    if (supabase && userId) {
      const { error } = await supabase.rpc("save_profile", { settings: p });
      if (error) throw new Error(error.message);
      await loadRemote();
    } else
      setState((s) => ({
        ...s,
        profile: { ...p, role: "student" },
        onboarded: true,
      }));
  }
  async function submit(lesson: Lesson, a: Activity, value: unknown) {
    if (demo) {
      const correct = validateAnswer(a, value),
        already = state.completed.includes(lesson.id + ":" + a.id);
      setState((s) => award(s, lesson.id, a, value));
      if (correct && state.profile.sound) playTone();
      return { correct, xp: correct && !already ? a.xp : 0 };
    }
    const { data, error } = await supabase!.rpc("submit_activity", {
      lesson_key: lesson.id,
      activity_key: a.id,
      answer: value,
    });
    if (error) throw new Error(error.message);
    await loadRemote();
    if (data.correct && state.profile.sound) playTone();
    return data;
  }
  function playTone() {
    try {
      const ctx = new AudioContext(),
        osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      osc.onended = () => ctx.close();
    } catch {}
  }
  function openLesson(l: Lesson) {
    navigate("lesson:" + l.id);
  }
  const currentLesson = view.startsWith("lesson:")
    ? catalogue.find((l) => l.id === view.split(":")[1])
    : null;
  const streakCount = streak(
    state.days,
    dayKey(new Date(), state.profile.timezone),
  ).current;
  const filtered = catalogue.filter(
    (l) =>
      (level === "All levels" || l.level === level) &&
      (subject === "All subjects" || l.world === subject) &&
      (!search ||
        (l.title + " " + l.subtitle + " " + l.level)
          .toLowerCase()
          .includes(search.toLowerCase())),
  );
  const auth = ["login", "signup", "forgot", "reset"].includes(view);
  let content: React.ReactNode;
  if (view === "dashboard")
    content = (
      <Dashboard
        state={state}
        navigate={navigate}
        openLesson={openLesson}
        demo={demo}
      />
    );
  else if (view === "worlds" || view.startsWith("world:"))
    content = (
      <WorldCatalogue
        catalogue={catalogue}
        state={state}
        openLesson={openLesson}
        navigate={navigate}
        worldId={view.split(":")[1]}
      />
    );
  else if (view === "catalogue")
    content = (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              THERE’S ALWAYS SOMETHING TO DISCOVER
            </span>
            <h1>Find your next “aha!”</h1>
            <p>Original starter lessons for every stage of your journey.</p>
          </div>
        </div>
        <div className="filter-bar">
          <label className="search-box">
            <Search size={18} />
            <input
              aria-label="Search lessons"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search adventures…"
            />
          </label>
          <select
            aria-label="Filter learning level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            {[
              "All levels",
              "Primary",
              "Middle school",
              "Secondary",
              "Higher secondary",
              "College",
            ].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <select
            aria-label="Filter subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option>All subjects</option>
            {worlds.map((w) => (
              <option key={w.id} value={w.id}>
                {w.subject}
              </option>
            ))}
          </select>
        </div>
        <p className="muted small">
          {filtered.length} adventures found · Starter curriculum, not complete
          grade coverage
        </p>
        <div className="lesson-grid">
          {filtered.map((l, i) => (
            <LessonCard
              key={l.id}
              lesson={l}
              index={i}
              state={state}
              openLesson={openLesson}
            />
          ))}
        </div>
        {!filtered.length && (
          <div className="panel empty-state">
            <Search />
            <h2>No adventures found</h2>
            <p>Try a different subject, level, or search term.</p>
            <button
              className="secondary"
              onClick={() => {
                setSearch("");
                setLevel("All levels");
                setSubject("All subjects");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </>
    );
  else if (currentLesson)
    content = (
      <LessonPlayer
        key={currentLesson.id}
        lesson={currentLesson}
        onSubmit={(a, v) => submit(currentLesson, a, v)}
        completed={state.completed}
        onExit={() => navigate("world:" + currentLesson.world)}
        reducedMotion={state.profile.reducedMotion}
      />
    );
  else if (view === "coding")
    content = (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">TURN IDEAS INTO INSTRUCTIONS</span>
            <h1>Welcome to Coding Kingdom</h1>
            <p>
              Try, test, tinker. Your next big idea starts with a small step.
            </p>
          </div>
        </div>
        <div className="coding-feature">
          <div>
            <span className="pill orange">PLAY YOUR FIRST ALGORITHM</span>
            <h2>A little robot needs a big thinker.</h2>
            <p>
              Help Byte find the star by building a sequence of directions.
              Every great programmer starts somewhere.
            </p>
            <button
              className="primary"
              onClick={() =>
                openLesson(lessons.find((l) => l.id === "robot-rescue")!)
              }
            >
              Play Robot Rescue <ArrowRight size={17} />
            </button>
          </div>
          <span>🤖</span>
        </div>
        <div className="section-title">
          <h2>Python practice studio</h2>
          <span className="pill lavender">Try a range loop</span>
        </div>
        <section className="panel">
          <PythonLab />
        </section>
        <div className="lesson-grid">
          {lessons
            .filter((l) => l.world === "coding")
            .map((l) => (
              <LessonCard
                key={l.id}
                lesson={l}
                state={state}
                openLesson={openLesson}
              />
            ))}
        </div>
      </>
    );
  else if (view === "simulations")
    content = (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">ASK. EXPERIMENT. DISCOVER.</span>
            <h1>Your science playground</h1>
            <p>One small experiment. A whole new way to see the world.</p>
          </div>
        </div>
        <section className="panel">
          <h2>The gravity playground</h2>
          <GravityLab />
        </section>
        <section className="panel">
          <h2>What did you notice?</h2>
          <p>
            Try the same height on Earth and the Moon. Then change the height.
            Which variable changes the time it takes to fall?
          </p>
          <button
            className="primary"
            onClick={() =>
              openLesson(lessons.find((l) => l.id === "gravity-lab")!)
            }
          >
            Take the gravity challenge <ArrowRight size={17} />
          </button>
        </section>
        <section className="panel">
          <h2>Circuit discovery lab</h2>
          <CircuitLab />
        </section>
      </>
    );
  else if (view === "missions")
    content = <Missions state={state} openLesson={openLesson} />;
  else if (view === "achievements") content = <Achievements state={state} />;
  else if (view === "progress" || view === "streak")
    content = <Analytics state={state} />;
  else if (view === "leaderboard")
    content = <Leaderboard state={state} demo={demo} />;
  else if (view === "settings")
    content = (
      <>
        {demo && (
          <section className="panel">
            <h2>Demo learners on this device</h2>
            <p>
              Each learner has separate local progress. These are demo profiles,
              not secure accounts.
            </p>
            <div className="demo-profile-buttons">
              {[
                ["explorer", "Explorer"],
                ["nova", "Nova · Primary"],
                ["byte", "Byte · College"],
              ].map(([id, label]) => (
                <button
                  className={id === demoId ? "primary" : "secondary"}
                  aria-pressed={id === demoId}
                  key={id}
                  onClick={() => switchDemo(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        )}
        <SettingsPage
          key={demoId}
          state={state}
          demo={demo}
          onSave={saveProfile}
          onReset={() => {
            setState(initialState);
            localStorage.removeItem("stemquest-demo-v1");
            navigate("dashboard");
          }}
        />
      </>
    );
  else if (view === "onboarding")
    content = (
      <Onboarding
        profile={state.profile}
        onSave={async (p) => {
          await saveProfile(p);
          navigate("dashboard");
        }}
      />
    );
  else if (["teacher", "guardian", "admin"].includes(view))
    content = <Staff role={view} demo={demo} state={state} />;
  else if (view === "notifications")
    content = (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">A NOTE FOR YOUR JOURNEY</span>
            <h1>Your notifications</h1>
            <p>A little encouragement, right when you need it.</p>
          </div>
        </div>
        {[
          {
            id: "welcome",
            title: "Welcome to your next adventure",
            text: "Your learning worlds are ready. Start with something that makes you curious.",
            action: "worlds",
          },
          {
            id: "profile",
            title: "Make this adventure yours",
            text: "Choose your learning level and daily goal to personalize your experience.",
            action: "onboarding",
          },
        ].map((n) => (
          <section
            className={
              "panel notification " +
              (state.readNotifications.includes(n.id) ? "read" : "")
            }
            key={n.id}
          >
            <span className="stat-icon lavender">
              <Bell size={20} />
            </span>
            <div>
              <h3>{n.title}</h3>
              <p>{n.text}</p>
              <button
                className="text-button"
                onClick={() => navigate(n.action)}
              >
                Take a look <ArrowRight size={15} />
              </button>
            </div>
            <button
              className="icon-button"
              aria-label={"Mark " + n.title + " as read"}
              disabled={state.readNotifications.includes(n.id)}
              onClick={() =>
                setState((s) => ({
                  ...s,
                  readNotifications: [...s.readNotifications, n.id],
                }))
              }
            >
              <Check size={18} />
            </button>
          </section>
        ))}
      </>
    );
  else if (view === "help")
    content = (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">WE ALL NEED A LITTLE HELP SOMETIMES</span>
            <h1>Your explorer’s handbook</h1>
          </div>
        </div>
        <section className="panel prose">
          {[
            [
              "How do I start?",
              "Choose a learning world or browse lessons. Read the concept, try the challenges, and use a hint whenever you need one.",
            ],
            [
              "How do XP and streaks work?",
              "XP is earned once for each newly mastered activity. A qualifying activity creates a learning day in your chosen timezone. Repeating a lesson is always welcome, but does not add more XP.",
            ],
            [
              "Where is my progress saved?",
              demo
                ? "You are in demo mode. Progress is stored in this browser, so clearing browser data removes it. Create a connected account when account services are enabled to save progress across devices."
                : "Your authenticated progress is stored privately in the connected database.",
            ],
            [
              "Is this a complete curriculum?",
              "This first release contains original starter lessons across five learning levels. It does not claim full curriculum or exam coverage.",
            ],
            [
              "Can I use Python?",
              "The practice studio supports a safe subset: range loops with print(i). Full Python execution is not enabled.",
            ],
            [
              "How do I join a class?",
              "Ask your verified teacher for a one-use invitation token, then enter it below.",
            ],
            [
              "Is the learning helper AI?",
              "Demo mode uses a small library of authored hints. Live AI requires an optional configured service.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
          <form
            className="inline-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (demo) {
                setError(
                  "Class enrolment requires a connected account. Demo invitations do not enrol real students.",
                );
                return;
              }
              const r = await supabase!.rpc("accept_class_invite", {
                invite_token: joinToken,
              });
              setError(r.error ? r.error.message : "You joined the class.");
            }}
          >
            <input
              aria-label="Class invitation token"
              value={joinToken}
              onChange={(e) => setJoinToken(e.target.value)}
              placeholder="Class invitation token"
              required
            />
            <button className="primary">Join class</button>
          </form>
        </section>
      </>
    );
  else if (view === "privacy")
    content = (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">THOUGHTFUL BY DESIGN</span>
            <h1>Privacy & terms</h1>
            <p>
              Starter policy · Requires operator and legal review before
              enrolling children.
            </p>
          </div>
        </div>
        <section className="panel prose">
          <h2>Your learning, your information</h2>
          <p>
            STEMQuest collects a nickname, learning preferences, and activity
            results. Connected accounts also use an email for authentication. Do
            not enter a child’s legal name, address, or other unnecessary
            personal information.
          </p>
          <h2>Demo mode</h2>
          <p>
            Demo progress stays in your browser’s local storage. Fictional
            classroom and leaderboard examples are labelled. Reset demo data in
            Settings.
          </p>
          <h2>Connected services</h2>
          <p>
            When enabled, Supabase handles authentication and learning records.
            Optional email and AI services process the information needed for
            those features. AI questions should not contain personal or
            sensitive information.
          </p>
          <h2>Children and guardians</h2>
          <p>
            Public self-registration is limited to learners who confirm they are
            at least 16. Younger learners can use the anonymous demo. School or
            guardian enrolment, verified consent, operator details, retention
            policies, and a jurisdiction-specific review must be completed
            before child accounts are launched.
          </p>
          <h2>Access and control</h2>
          <p>
            Progress is private by default. Class rankings are opt-in and use
            nicknames. Guardian access requires a verified, single-use
            invitation. Export learning data or request account deletion through
            Settings.
          </p>
          <h2>Learning and acceptable use</h2>
          <p>
            Use the platform respectfully. Automated hints and AI may make
            mistakes. Starter lessons do not constitute a full accredited
            curriculum. Do not upload other people’s personal information.
          </p>
          <h2>Operator information</h2>
          <p>
            The operator must supply a support contact, data retention schedule,
            jurisdiction, and finalized terms before production enrolment. This
            template is not a claim of legal compliance.
          </p>
        </section>
      </>
    );
  else
    content = (
      <section className="panel empty-state">
        <h1>This trail is still unexplored.</h1>
        <button className="primary" onClick={() => navigate("dashboard")}>
          Back to your dashboard
        </button>
      </section>
    );
  if (!ready)
    return (
      <div className="loading-screen">
        <span className="brand-mark">✦</span>
        <p>Preparing your next adventure…</p>
      </div>
    );
  return (
    <MotionConfig
      reducedMotion={state.profile.reducedMotion ? "always" : "user"}
    >
      {view === "welcome" ? (
        <Landing navigate={navigate} />
      ) : auth ? (
        <>
          <button
            className="auth-back text-button"
            onClick={() => navigate("dashboard")}
          >
            ← Back to STEMQuest
          </button>
          <Auth
            mode={view}
            onMode={navigate}
            onDemo={() => navigate("dashboard")}
            onSuccess={() =>
              navigate(state.onboarded ? "dashboard" : "onboarding")
            }
          />
        </>
      ) : (
        <div
          className={
            "app-shell " + (state.profile.reducedMotion ? "reduce-motion" : "")
          }
        >
          <a
            href="#main-content"
            className="skip-link"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("main-content")?.focus();
            }}
          >
            Skip to content
          </a>
          {mobile && (
            <button
              className="sidebar-backdrop"
              aria-label="Close navigation"
              onClick={() => setMobile(false)}
            />
          )}
          <aside className={"sidebar " + (mobile ? "open" : "")}>
            <button className="brand" onClick={() => navigate("welcome")}>
              <span className="brand-mark">✦</span>STEM<span>Quest</span>
            </button>
            <div className="sidebar-caption">
              A LITTLE CURIOUS. A LOT POSSIBLE.
            </div>
            <button
              className="learner-select"
              onClick={() => navigate("onboarding")}
            >
              <span className="avatar">🧑‍🚀</span>
              <span>
                <strong>{state.profile.name}</strong>
                <small>{state.profile.grade} · Explorer</small>
              </span>
              <ChevronDown size={16} />
            </button>
            <span className="nav-label">YOUR LEARNING SPACE</span>
            <nav>
              {nav.map((n, i) => (
                <button
                  key={n.id}
                  onClick={() => navigate(n.id)}
                  className={
                    (view === n.id ||
                    (n.id === "worlds" && view.startsWith("world:"))
                      ? "active "
                      : "") + (i === 5 ? "nav-gap" : "")
                  }
                  aria-current={view === n.id ? "page" : undefined}
                >
                  <n.icon size={19} />
                  <span>{n.label}</span>
                  {n.id === "missions" && (
                    <small className="nav-count">3</small>
                  )}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <button className="companion-card" onClick={() => setTutor(true)}>
                <span>✨</span>
                <strong>A little help, a big leap.</strong>
                <small>Meet your quest companion</small>
                <ArrowRight size={15} />
              </button>
              <button
                className="bottom-nav"
                onClick={() => navigate("settings")}
              >
                <Settings size={18} />
                Settings
              </button>
              <button className="bottom-nav" onClick={() => navigate("help")}>
                <HelpCircle size={18} />
                Help & support
              </button>
              <div className="role-links">
                {(demo
                  ? ["teacher", "guardian", "admin"]
                  : [state.profile.role]
                )
                  .filter((r) => r !== "student")
                  .map((r) => (
                    <button key={r} onClick={() => navigate(r)}>
                      {r === "guardian"
                        ? "Parent"
                        : r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
              </div>
            </div>
          </aside>
          <div className="app-main">
            <header className="topbar">
              <button
                className="icon-button mobile-menu"
                aria-label="Open navigation"
                onClick={() => setMobile(true)}
              >
                <Menu size={23} />
              </button>
              <form
                className="top-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate("catalogue");
                }}
              >
                <Search size={18} />
                <input
                  aria-label="Search STEMQuest"
                  placeholder="What are you curious about today?"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <kbd>↵</kbd>
              </form>
              <div className="topbar-actions">
                <button
                  className="top-stat streak"
                  onClick={() => navigate("streak")}
                  title="Learning streak"
                >
                  <Flame size={18} />
                  <strong>{streakCount}</strong>
                  <span>day streak</span>
                </button>
                <button
                  className="top-stat xp"
                  onClick={() => navigate("progress")}
                  title="Total XP"
                >
                  <Zap size={18} />
                  <strong>{state.xp}</strong>
                  <span>XP</span>
                </button>
                <button
                  className="notification-button icon-button"
                  aria-label="Notifications"
                  onClick={() => navigate("notifications")}
                >
                  <Bell size={20} />
                  {state.readNotifications.length < 2 && <i />}
                </button>
                <button
                  className="top-avatar"
                  aria-label="Open profile settings"
                  onClick={() => navigate("settings")}
                >
                  🧑‍🚀
                </button>
              </div>
            </header>
            <div className="demo-strip">
              <span>
                <span className="demo-dot" />
                {demo ? "DEMO EXPLORER" : "CONNECTED ACCOUNT"}
              </span>
              <p>
                {demo
                  ? "A little preview of a big adventure. Your progress stays on this device."
                  : "Your learning progress is saved to your private account."}
              </p>
              <button
                onClick={() =>
                  demo ? navigate("signup") : supabase?.auth.signOut()
                }
              >
                {demo ? "Make it yours" : "Sign out"}
                <ArrowRight size={13} />
              </button>
            </div>
            <main id="main-content" tabIndex={-1}>
              {error && (
                <div className="error-banner" role="alert">
                  {error}
                  <button
                    aria-label="Dismiss message"
                    onClick={() => setError("")}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              {content}
            </main>
          </div>
        </div>
      )}
      {tutor && (
        <Tutor
          level={state.profile.level}
          onClose={() => setTutor(false)}
          demo={demo}
        />
      )}
    </MotionConfig>
  );
}
