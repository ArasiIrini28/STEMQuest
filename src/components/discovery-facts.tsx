"use client";
import { useEffect, useRef, useState } from "react";
import {
  facts,
  nextFact,
  factClock,
  FACT_INTERVAL,
  type Fact,
} from "@/lib/facts";
export function DiscoveryFacts({
  owner,
  level,
  blocked,
  initial,
}: {
  owner: string;
  level: string;
  blocked: boolean;
  initial: boolean;
}) {
  const [fact, setFact] = useState<Fact | null>(null),
    [recent, setRecent] = useState<string[]>([]);
  const due = useRef(initial),
    elapsed = useRef(0),
    lastActive = useRef(0),
    safe = useRef(!blocked),
    current = useRef<Fact | null>(null),
    history = useRef<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    safe.current = !blocked;
    current.current = fact;
    history.current = recent;
  }, [blocked, fact, recent]);
  function show() {
    const f = nextFact(history.current, level);
    const ids = [...history.current, f.id].slice(-(facts.length - 1));
    history.current = ids;
    setRecent(ids);
    try {
      localStorage.setItem("stemquest-facts:" + owner, JSON.stringify(ids));
      sessionStorage.setItem("stemquest-fact-welcome:" + owner, "shown");
    } catch {}
    setFact(f);
    due.current = false;
    elapsed.current = 0;
  }
  const showRef = useRef(show);
  useEffect(() => {
    showRef.current = show;
  });
  useEffect(() => {
    try {
      due.current =
        initial && !sessionStorage.getItem("stemquest-fact-welcome:" + owner);
      setRecent(
        JSON.parse(localStorage.getItem("stemquest-facts:" + owner) || "[]"),
      );
    } catch {}
    lastActive.current = Date.now();
    let last = Date.now();
    const active = () => {
      lastActive.current = Date.now();
    };
    window.addEventListener("pointerdown", active);
    window.addEventListener("keydown", active);
    window.addEventListener("scroll", active);
    const timer = setInterval(() => {
      const now = Date.now();
      elapsed.current = factClock(
        elapsed.current,
        now - last,
        now - lastActive.current < 60000,
        document.visibilityState === "visible",
      );
      last = now;
      if (elapsed.current >= FACT_INTERVAL) due.current = true;
      const input = document.activeElement?.tagName;
      const writing = ["INPUT", "TEXTAREA", "SELECT"].includes(input || "");
      if (
        due.current &&
        safe.current &&
        !current.current &&
        !writing &&
        !document.querySelector(
          'dialog[open], [role="dialog"], [data-report-open="true"]',
        ) &&
        document.visibilityState === "visible" &&
        now - lastActive.current < 60000
      )
        showRef.current();
    }, 1000);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pointerdown", active);
      window.removeEventListener("keydown", active);
      window.removeEventListener("scroll", active);
    };
  }, [owner, initial]);
  useEffect(() => {
    if (fact) dialog.current?.showModal();
  }, [fact]);
  return (
    <>
      <button className="text-button" onClick={show}>
        ✦ Discover a STEM fact
      </button>
      {fact && (
        <dialog
          ref={dialog}
          className="discovery-dialog"
          aria-labelledby="fact-title"
          onCancel={() => setFact(null)}
          onClose={() => setFact(null)}
        >
          <span className="pill lavender">
            {fact.category} ·{" "}
            {fact.advanced ? "Secondary and college" : "All learning levels"}
          </span>
          <h2 id="fact-title">Did You Know?</h2>
          <h3>{fact.fact}</h3>
          <p>{fact.why}</p>
          <p>
            <a href={fact.source} target="_blank" rel="noreferrer">
              Read the source
            </a>
          </p>
          <div className="button-row">
            <button className="secondary" onClick={show}>
              Another Fact
            </button>
            <button
              autoFocus
              className="primary"
              onClick={() => {
                dialog.current?.close();
                setFact(null);
              }}
            >
              Cool! Continue
            </button>
            {fact.lesson && (
              <a href={"#lesson:" + fact.lesson} onClick={() => setFact(null)}>
                Explore This Topic
              </a>
            )}
          </div>
        </dialog>
      )}
    </>
  );
}
