import {
  ArrowRight,
  Check,
  Sparkles,
  ShieldCheck,
  Heart,
  Code2,
} from "lucide-react";
import { HeroArt, WorldArt } from "./art";
import { worlds } from "@/lib/content";
export function Landing({ navigate }: { navigate: (v: string) => void }) {
  return (
    <div className="landing">
      <header>
        <button className="brand" onClick={() => navigate("welcome")}>
          <span className="brand-mark">✦</span>STEM<span>Quest</span>
        </button>
        <nav>
          <button
            className="text-button"
            onClick={() =>
              document
                .getElementById("learning-worlds")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Explore worlds
          </button>
          <button className="text-button" onClick={() => navigate("login")}>
            Sign in
          </button>
          <button className="primary" onClick={() => navigate("signup")}>
            Start your adventure <ArrowRight size={17} />
          </button>
        </nav>
      </header>
      <section className="landing-hero">
        <div>
          <span className="pill lavender">
            <Sparkles size={15} />
            FOR EVERY CURIOUS MIND
          </span>
          <h1>
            A little curiosity.
            <br />A <em>big adventure.</em>
          </h1>
          <p>
            Explore new worlds, solve playful challenges, and discover what you
            can do. STEM learning that grows with you, from Grade 3 to college.
          </p>
          <div className="button-row">
            <button className="primary" onClick={() => navigate("signup")}>
              Let’s start exploring <ArrowRight size={18} />
            </button>
            <button className="secondary" onClick={() => navigate("dashboard")}>
              Try the free demo
            </button>
          </div>
          <div className="landing-promises">
            <span>
              <Check size={15} />
              Learn by doing
            </span>
            <span>
              <Check size={15} />
              Grow at your pace
            </span>
            <span>
              <Check size={15} />
              Celebrate progress
            </span>
          </div>
        </div>
        <div className="landing-art">
          <HeroArt />
          <span className="floating-note note-one">
            💡 Your next “aha!” awaits
          </span>
          <span className="floating-note note-two">
            ✦ A universe of possibilities
          </span>
        </div>
      </section>
      <section className="landing-worlds" id="learning-worlds">
        <span className="eyebrow">WHERE WILL CURIOSITY TAKE YOU?</span>
        <h2>Six worlds. Endless possibilities.</h2>
        <p>
          Start with our original sample adventures, designed for different
          learning levels.
        </p>
        <div className="world-grid">
          {worlds.map((w) => (
            <button
              className="world-card"
              key={w.id}
              onClick={() => navigate("world:" + w.id)}
            >
              <WorldArt kind={w.icon} />
              <div className="world-card-body">
                <h3>
                  {w.title}
                  <ArrowRight size={18} />
                </h3>
                <p>{w.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="landing-values">
        {[
          {
            icon: Code2,
            title: "More doing. More discovering.",
            text: "Program a robot, experiment with gravity, and turn new ideas into real understanding.",
          },
          {
            icon: Heart,
            title: "Progress that feels good.",
            text: "Small goals, helpful hints, and rewards for learning. Every explorer moves at their own pace.",
          },
          {
            icon: ShieldCheck,
            title: "A thoughtful place to learn.",
            text: "Nicknames, private progress, and secure classroom connections. Built with learners in mind.",
          },
        ].map((v) => (
          <div key={v.title}>
            <v.icon size={29} />
            <h3>{v.title}</h3>
            <p>{v.text}</p>
          </div>
        ))}
      </section>
      <section className="landing-cta">
        <span>🚀</span>
        <h2>Your next discovery starts here.</h2>
        <p>You don’t need all the answers. Just a little curiosity.</p>
        <button className="primary" onClick={() => navigate("onboarding")}>
          Find your first adventure <ArrowRight size={18} />
        </button>
      </section>
      <footer>
        <span className="brand">✦ STEMQuest</span>
        <span>Keep wondering. Keep growing.</span>
        <button className="text-button" onClick={() => navigate("privacy")}>
          Privacy & terms
        </button>
        <button className="text-button" onClick={() => navigate("help")}>
          Help
        </button>
      </footer>
    </div>
  );
}
