"use client";
import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  Sparkles,
  Download,
  Trash2,
} from "lucide-react";
import { supabase, connected } from "@/lib/supabase";
import type { Profile, LearningState, Level } from "@/lib/types";
import { worlds } from "@/lib/content";
export function Auth({
  mode,
  onMode,
  onDemo,
  onSuccess,
}: {
  mode: string;
  onMode: (m: string) => void;
  onDemo: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setMessage(
        "Account services are not connected yet. You can explore every sample lesson in demo mode.",
      );
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const base = window.location.origin;
      const result =
        mode === "signup"
          ? await supabase.auth.signUp({
              email,
              password,
              options: { emailRedirectTo: base + "/#onboarding" },
            })
          : mode === "forgot"
            ? await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: base + "/#reset",
              })
            : mode === "reset"
              ? await supabase.auth.updateUser({ password })
              : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (mode === "signup")
        setMessage("Check your inbox to verify your email before signing in.");
      else if (mode === "forgot")
        setMessage(
          "If the address has an account, a reset message has been requested. Check your inbox.",
        );
      else if (mode === "reset")
        setMessage(
          "Your password has been updated. You can continue to your dashboard.",
        );
      else onSuccess();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <div className="auth-story">
        <span className="eyebrow">WELCOME TO STEMQUEST</span>
        <h1>
          A little curiosity.
          <br />A big adventure.
        </h1>
        <p>Your next discovery starts with you.</p>
        <div className="auth-orbit">
          🪐<span>✦</span>
          <i>🚀</i>
        </div>
        <p className="small">
          Learn something new. Try something brave.
          <br />
          Make a little progress, every day.
        </p>
      </div>
      <div className="auth-form panel">
        <span className="brand-mark">✦</span>
        <h2>
          {mode === "signup"
            ? "Let’s start your story"
            : mode === "forgot"
              ? "Find your way back"
              : mode === "reset"
                ? "Choose a new password"
                : "Welcome back, explorer"}
        </h2>
        <p>
          {mode === "signup"
            ? "Create an account for your learning journey."
            : "Your next “aha!” moment is waiting."}
        </p>
        {!connected && (
          <div className="service-note">
            <ShieldCheck size={20} />
            <span>
              Demo is ready to explore. Live accounts need the project’s
              Supabase connection.
            </span>
          </div>
        )}
        <form onSubmit={handle}>
          {mode !== "reset" && (
            <label>
              Email address
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
          )}
          {mode !== "forgot" && (
            <label>
              Password
              <input
                type="password"
                required
                minLength={10}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 10 characters"
              />
            </label>
          )}
          {mode === "signup" && (
            <label className="checkbox-label">
              <input type="checkbox" required />I am 16 or older. Younger
              learners can explore the anonymous demo; account enrolment
              requires a school or guardian workflow.
            </label>
          )}
          <button className="primary" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "signup"
                ? "Create account"
                : mode === "forgot"
                  ? "Request reset link"
                  : mode === "reset"
                    ? "Update password"
                    : "Sign in"}
            <ArrowRight size={17} />
          </button>
        </form>
        {message && (
          <p className="hint" role="status">
            {message}
          </p>
        )}
        <div className="auth-links">
          <button
            className="text-button"
            onClick={() => onMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login"
              ? "New here? Create an account"
              : "Already exploring? Sign in"}
          </button>
          {mode === "login" && (
            <button className="text-button" onClick={() => onMode("forgot")}>
              Forgot password?
            </button>
          )}
        </div>
        <div className="divider-label">OR TAKE A LOOK AROUND</div>
        <button className="secondary full" onClick={onDemo}>
          Explore the demo <Sparkles size={16} />
        </button>
      </div>
    </div>
  );
}
export function Onboarding({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (p: Profile) => Promise<void>;
}) {
  const [p, setP] = useState(profile),
    [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setP({ ...p, [key]: value });
  return (
    <section className="onboarding panel">
      <div className="onboarding-steps">
        {[0, 1, 2].map((i) => (
          <span className={i <= step ? "active" : ""} key={i}>
            {i < step ? <Check size={16} /> : i + 1}
          </span>
        ))}
      </div>
      <span className="eyebrow">YOUR ADVENTURE, YOUR WAY</span>
      <h1>
        {step === 0
          ? "Nice to meet you, explorer."
          : step === 1
            ? "What sparks your curiosity?"
            : "A little learning, every day."}
      </h1>
      <p>
        {step === 0
          ? "Choose a nickname and a learning level."
          : step === 1
            ? "Pick the worlds you’d love to explore."
            : "Set a comfortable goal. You can change it anytime."}
      </p>
      {step === 0 ? (
        <div className="form-grid">
          <label>
            Explorer nickname
            <input
              maxLength={30}
              value={p.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Cosmic Owl"
            />
          </label>
          <label>
            Age band
            <select
              value={p.ageBand}
              onChange={(e) => set("ageBand", e.target.value)}
            >
              {["8–10", "11–12", "13–15", "16–17", "18+"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Learning level
            <select
              value={p.level}
              onChange={(e) => {
                const level = e.target.value as Level;
                setP({
                  ...p,
                  level,
                  grade:
                    level === "Primary"
                      ? "Grade 4"
                      : level === "Middle school"
                        ? "Grade 7"
                        : level === "Secondary"
                          ? "Grade 9"
                          : level === "Higher secondary"
                            ? "Grade 11"
                            : "College year 1",
                });
              }}
            >
              {[
                "Primary",
                "Middle school",
                "Secondary",
                "Higher secondary",
                "College",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Grade or year
            <input
              maxLength={30}
              value={p.grade}
              onChange={(e) => set("grade", e.target.value)}
            />
          </label>
          <label>
            Country (optional)
            <input
              maxLength={60}
              value={p.country}
              onChange={(e) => set("country", e.target.value)}
            />
          </label>
          <label>
            Curriculum
            <select
              value={p.curriculum}
              onChange={(e) => set("curriculum", e.target.value)}
            >
              <option>General STEM</option>
              <option>CBSE (starter topics)</option>
              <option>International (starter topics)</option>
            </select>
          </label>
        </div>
      ) : step === 1 ? (
        <div className="interest-grid">
          {worlds.map((w) => (
            <button
              key={w.id}
              className={p.interests.includes(w.id) ? "selected" : ""}
              onClick={() =>
                set(
                  "interests",
                  p.interests.includes(w.id)
                    ? p.interests.filter((i) => i !== w.id)
                    : [...p.interests, w.id],
                )
              }
            >
              <span>
                {w.icon === "planet"
                  ? "🪐"
                  : w.icon === "flask"
                    ? "🧪"
                    : w.icon === "robot"
                      ? "🤖"
                      : w.icon === "city"
                        ? "🏙️"
                        : w.icon === "brain"
                          ? "🧠"
                          : "📊"}
              </span>
              {w.subject}
              {p.interests.includes(w.id) && <Check size={18} />}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="goal-options">
            {[5, 15, 30].map((v) => (
              <button
                key={v}
                className={p.goal === v ? "selected" : ""}
                onClick={() => set("goal", v)}
              >
                <strong>{v}</strong>
                <span>minutes a day</span>
                <small>
                  {v === 5
                    ? "A little spark"
                    : v === 15
                      ? "Steady explorer"
                      : "Deep discovery"}
                </small>
              </button>
            ))}
          </div>
          <label>
            Learning timezone
            <select
              value={p.timezone}
              onChange={(e) => set("timezone", e.target.value)}
            >
              {[
                "Asia/Kolkata",
                "Europe/London",
                "America/New_York",
                "America/Los_Angeles",
                "Asia/Singapore",
                "Australia/Sydney",
                "UTC",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <p className="muted small">
            Streaks follow the timezone saved at the time of each activity.
            Existing learning days stay unchanged.
          </p>
        </>
      )}
      <div className="between onboarding-actions">
        <button
          className="text-button"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          className="primary"
          disabled={!p.name.trim() || busy}
          onClick={async () => {
            if (step < 2) {
              setStep(step + 1);
              return;
            }
            setBusy(true);
            try {
              await onSave(p);
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Could not save your profile.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {step === 2 ? (busy ? "Saving…" : "Start my adventure") : "Continue"}
          <ArrowRight size={17} />
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
export function Settings({
  state,
  onSave,
  demo,
  onReset,
}: {
  state: LearningState;
  onSave: (p: Profile) => Promise<void>;
  demo: boolean;
  onReset: () => void;
}) {
  const [p, setP] = useState(state.profile),
    [message, setMessage] = useState(""),
    [confirm, setConfirm] = useState(false);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setP({ ...p, [k]: v });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await onSave(p);
      setMessage("Your preferences are saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save.");
    }
  }
  function download() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "stemquest-learning-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h1>Profile & settings</h1>
          <p>Your learning journey should feel like you.</p>
        </div>
      </div>
      <form className="panel settings-form" onSubmit={save}>
        <h2>Your explorer profile</h2>
        <div className="form-grid">
          <label>
            Display name
            <input
              value={p.name}
              required
              maxLength={30}
              onChange={(e) => set("name", e.target.value)}
            />
          </label>
          <label>
            Learning level
            <select
              value={p.level}
              onChange={(e) => set("level", e.target.value as Level)}
            >
              {[
                "Primary",
                "Middle school",
                "Secondary",
                "Higher secondary",
                "College",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Grade or year
            <input
              value={p.grade}
              maxLength={30}
              onChange={(e) => set("grade", e.target.value)}
            />
          </label>
          <label>
            Daily learning goal
            <select
              value={p.goal}
              onChange={(e) => set("goal", +e.target.value)}
            >
              {[5, 15, 30].map((v) => (
                <option key={v} value={v}>
                  {v} minutes
                </option>
              ))}
            </select>
          </label>
          <label>
            Timezone
            <select
              value={p.timezone}
              onChange={(e) => set("timezone", e.target.value)}
            >
              {[
                "Asia/Kolkata",
                "Europe/London",
                "America/New_York",
                "America/Los_Angeles",
                "Asia/Singapore",
                "Australia/Sydney",
                "UTC",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Language
            <select
              value={p.language}
              onChange={(e) => set("language", e.target.value)}
            >
              <option>English</option>
            </select>
          </label>
        </div>
        <h2>Learning preferences</h2>
        <label className="switch-row">
          <div>
            <strong>Reduced motion</strong>
            <small>Keep animations gentle and minimal.</small>
          </div>
          <input
            type="checkbox"
            checked={p.reducedMotion}
            onChange={(e) => set("reducedMotion", e.target.checked)}
          />
        </label>
        <label className="switch-row">
          <div>
            <strong>Learning sounds</strong>
            <small>A short tone after a correct answer.</small>
          </div>
          <input
            type="checkbox"
            checked={p.sound}
            onChange={(e) => set("sound", e.target.checked)}
          />
        </label>
        <label className="switch-row">
          <div>
            <strong>Class leaderboard</strong>
            <small>Opt in to nickname-only ranking in your class.</small>
          </div>
          <input
            type="checkbox"
            checked={p.leaderboard}
            onChange={(e) => set("leaderboard", e.target.checked)}
          />
        </label>
        <h2>Email preferences</h2>
        <p className="muted">
          {demo
            ? "Email delivery is unavailable in demo mode."
            : "Reminders require a configured email provider and confirmed consent. Child accounts remain ineligible until consent is verified."}
        </p>
        <label className="switch-row">
          <div>
            <strong>Daily learning reminders</strong>
            <small>Optional reminders when you haven’t learned today.</small>
          </div>
          <input
            type="checkbox"
            checked={p.reminders}
            onChange={(e) => set("reminders", e.target.checked)}
          />
        </label>
        <div className="form-grid">
          <label>
            Quiet hours start
            <select
              value={p.quietStart}
              onChange={(e) => set("quietStart", +e.target.value)}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {String(i).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </label>
          <label>
            Quiet hours end
            <select
              value={p.quietEnd}
              onChange={(e) => set("quietEnd", +e.target.value)}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {String(i).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="primary">
          Save preferences <Check size={17} />
        </button>
        {message && (
          <p className="hint" role="status">
            {message}
          </p>
        )}
      </form>
      <section className="panel data-settings">
        <h2>Your data belongs to you</h2>
        <p>Export your profile, recorded attempts, and learning progress.</p>
        <div className="button-row">
          <button className="secondary" onClick={download}>
            <Download size={17} />
            Export learning data
          </button>
          <button
            className="text-button danger"
            onClick={() => setConfirm(!confirm)}
          >
            <Trash2 size={17} />
            {demo ? "Reset demo progress" : "Delete account"}
          </button>
        </div>
        {confirm && (
          <div className="hint">
            <p>
              {demo
                ? "This clears demo progress on this device."
                : "This permanently removes your account and personal learning records."}
            </p>
            <button
              className="danger-button"
              onClick={async () => {
                if (demo) {
                  onReset();
                  return;
                }
                const r = await supabase?.functions.invoke("account", {
                  body: { action: "delete" },
                });
                if (r?.error) {
                  setMessage(r.error.message);
                  return;
                }
                await supabase?.auth.signOut();
                onReset();
              }}
            >
              Confirm {demo ? "reset" : "deletion"}
            </button>
            <button className="text-button" onClick={() => setConfirm(false)}>
              Cancel
            </button>
          </div>
        )}
      </section>
    </>
  );
}
