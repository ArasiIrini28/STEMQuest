"use client";
import { facts } from "@/lib/facts";
import type { Lesson } from "@/lib/types";
export function FactLibrary({
  level,
  catalogue,
  navigate,
}: {
  level: string;
  catalogue: Lesson[];
  navigate: (route: string) => void;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A LITTLE CURIOSITY, EVERY DAY</span>
          <h1>STEM facts</h1>
          <p>
            Curated explanations and reference sources. Discover a fact
            automatically after five minutes of active use, whenever it is safe
            to pause.
          </p>
        </div>
      </div>
      <div className="learning-columns">
        {facts
          .filter((f) => level !== "Primary" || !f.advanced)
          .map((f) => (
            <article className="panel" key={f.id}>
              <span className="pill lavender">
                {f.category} · {f.gradeRange}
              </span>
              <h2>{f.fact}</h2>
              <p>{f.why}</p>
              <a href={f.source} target="_blank" rel="noreferrer">
                Read source
              </a>
              {f.lesson && catalogue.some((l) => l.id === f.lesson) && (
                <button
                  className="text-button"
                  onClick={() => navigate("lesson:" + f.lesson)}
                >
                  Explore related lesson
                </button>
              )}
            </article>
          ))}
      </div>
    </>
  );
}
