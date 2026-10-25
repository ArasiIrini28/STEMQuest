"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  answerHelp,
  validHelpRoute,
  type HelpContext,
  type HelpMessage,
  type HelpProvider,
} from "@/lib/study-helper";
const greeting: HelpMessage = {
  role: "assistant",
  mode: "local",
  text: "Hi, explorer! Ask me for a STEM fact, an explanation, a practice question, or help finding a page. I use this conversation and your current lesson when available.",
};
export function QuestCompanion({
  owner,
  demo,
  context,
  navigate,
  onClose,
}: {
  owner: string;
  demo: boolean;
  context: HelpContext;
  navigate: (route: string) => void;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<HelpMessage[]>([greeting]);
  const [question, setQuestion] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [useAI, setUseAI] = useState(!demo);
  const pending = useRef(false),
    alive = useRef(true),
    input = useRef<HTMLInputElement>(null),
    end = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const retry = useRef<{ question: string; history: HelpMessage[] } | null>(
    null,
  );
  const key = "stemquest-chat:" + owner;
  useEffect(() => {
    alive.current = true;
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || "null");
      if (
        Array.isArray(saved) &&
        saved.every(
          (m) =>
            ["user", "assistant"].includes(m.role) &&
            typeof m.text === "string",
        )
      )
        setMessages(saved.slice(-40));
    } catch {}
    dialog.current?.showModal();
    input.current?.focus();
    return () => {
      alive.current = false;
    };
  }, [key]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy]);
  function persist(next: HelpMessage[]) {
    setMessages(next);
    try {
      sessionStorage.setItem(key, JSON.stringify(next.slice(-40)));
    } catch {
      setError(
        "This browser cannot save chat history. You can continue in this window.",
      );
    }
  }
  const provider: HelpProvider | undefined =
    !demo && useAI && supabase
      ? async (body, signal) => {
          if (signal.aborted) throw new Error("Request cancelled");
          const { data, error } = await supabase!.functions.invoke("tutor", {
            body,
            signal,
            timeout: 30000,
          });
          if (error || signal.aborted) throw new Error("AI unavailable");
          return data;
        }
      : undefined;
  async function ask(text: string, again = false) {
    const q = text.trim();
    if (!q || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setQuestion("");
    const history = again && retry.current ? retry.current.history : messages;
    const withUser = [...history, { role: "user" as const, text: q }];
    if (!again) persist(withUser);
    retry.current = { question: q, history };
    try {
      const result = await answerHelp(q, history, context, provider);
      if (!alive.current) return;
      persist([...withUser, result.message]);
      setError(result.error);
    } finally {
      pending.current = false;
      if (alive.current) {
        setBusy(false);
        input.current?.focus();
      }
    }
  }
  const mode =
    messages.filter((m) => m.role === "assistant").at(-1)?.mode === "ai"
      ? "AI assistant"
      : "Built-in study helper";
  return (
    <dialog
      ref={dialog}
      className="tutor-drawer companion-dialog"
      aria-labelledby="companion-title"
      onCancel={onClose}
      onClose={onClose}
    >
      <div className="between">
        <div>
          <span className="eyebrow">A LITTLE HELP ALONG THE WAY</span>
          <h2 id="companion-title">
            <Sparkles size={20} /> Quest companion
          </h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close learning helper"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <p className="service-note">
        {mode} ·{" "}
        {mode === "AI assistant"
          ? "AI-generated guidance; check important claims."
          : "Local curriculum, sourced facts and real page links."}
      </p>
      {demo ? (
        <p className="small muted">
          Live AI needs a connected account and server configuration. Built-in
          help works now.
        </p>
      ) : (
        <label className="small">
          <input
            type="checkbox"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
            disabled={busy}
          />{" "}
          Use AI for explanations when available
        </label>
      )}
      <div
        className="chat-messages"
        role="log"
        aria-label="Conversation"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={"chat " + (m.role === "user" ? "you" : "tutor")}
          >
            <strong>
              {m.role === "user"
                ? "You"
                : m.mode === "ai"
                  ? "AI assistant"
                  : "Built-in study helper"}
            </strong>
            <p>{m.text}</p>
            {m.source && /^https:\/\//.test(m.source) && (
              <a href={m.source} target="_blank" rel="noreferrer">
                Fact source
              </a>
            )}
            {m.links
              ?.filter((l) => validHelpRoute(l.route, context.catalogue))
              .map((l) => (
                <button
                  key={l.route}
                  className="text-button"
                  onClick={() => {
                    navigate(l.route);
                    onClose();
                  }}
                >
                  {l.label}
                </button>
              ))}
          </div>
        ))}
        {busy && <p role="status">Thinking…</p>}
        <div ref={end} />
      </div>
      {error && (
        <div className="helper-error" role="alert">
          {error}
          {provider && (
            <button
              className="text-button"
              disabled={busy}
              onClick={() => {
                if (retry.current) void ask(retry.current.question, true);
              }}
            >
              Retry AI
            </button>
          )}
        </div>
      )}
      <div className="helper-prompts">
        {[
          "Tell me a STEM fact",
          "Explain this topic",
          "Help me find a lesson",
          "Give me a practice question",
          "Help me with coding",
        ].map((p) => (
          <button
            className="secondary"
            key={p}
            disabled={busy}
            onClick={() => ask(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <input
          ref={input}
          aria-label="Ask a learning question"
          placeholder="What are you curious about?"
          value={question}
          maxLength={500}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          className="primary"
          disabled={busy || !question.trim()}
          aria-label="Send question"
        >
          <Send size={17} />
        </button>
      </form>
      <button
        className="text-button"
        disabled={busy}
        onClick={() => {
          retry.current = null;
          setError("");
          persist([greeting]);
          input.current?.focus();
        }}
      >
        Clear conversation
      </button>
    </dialog>
  );
}
