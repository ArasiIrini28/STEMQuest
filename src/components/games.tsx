"use client";
import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw, Lightbulb, Zap } from "lucide-react";
export function FractionFuel({
  submit,
  busy,
}: {
  submit: (v: unknown) => void;
  busy: boolean;
}) {
  const [filled, setFilled] = useState<number[]>([]);
  return (
    <div className="fraction-game">
      <div className="fuel-ship">
        🚀<span>MISSION: FILL 3/4 OF THE TANK</span>
      </div>
      <p>
        The tank has eight equal fuel cells. Switch on the right number to power
        your ship.
      </p>
      <div className="fuel-cells">
        {Array.from({ length: 8 }, (_, i) => (
          <button
            key={i}
            aria-label={`Fuel cell ${i + 1}`}
            aria-pressed={filled.includes(i)}
            className={filled.includes(i) ? "filled" : ""}
            onClick={() =>
              setFilled(
                filled.includes(i)
                  ? filled.filter((n) => n !== i)
                  : [...filled, i],
              )
            }
          >
            <Zap size={28} />
            <span>{i + 1}</span>
          </button>
        ))}
      </div>
      <p aria-live="polite">
        <strong>{filled.length}/8</strong> of the tank is full
      </p>
      <div className="button-row">
        <button
          className="primary"
          disabled={busy}
          onClick={() => submit(String(filled.length))}
        >
          Launch spaceship
        </button>
        <button className="secondary" onClick={() => setFilled([])}>
          <RotateCcw size={16} />
          Reset fuel
        </button>
      </div>
    </div>
  );
}
const cards = [
  { text: "1/2", pair: "half" },
  { text: "3/4", pair: "threequarters" },
  { text: "2/6", pair: "third" },
  { text: "2/4", pair: "half" },
  { text: "1/3", pair: "third" },
  { text: "6/8", pair: "threequarters" },
];
export function FractionMemory({
  submit,
  busy,
}: {
  submit: (v: unknown) => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState<number[]>([]),
    [matched, setMatched] = useState<string[]>([]),
    [turns, setTurns] = useState(0),
    [message, setMessage] = useState(
      "Turn over two cards. Find fractions with the same value.",
    ),
    [locked, setLocked] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function flip(i: number) {
    if (locked || open.includes(i) || matched.includes(cards[i].pair)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === 2) {
      setTurns(turns + 1);
      if (cards[next[0]].pair === cards[i].pair) {
        const found = [...matched, cards[i].pair];
        setMatched(found);
        setOpen([]);
        setMessage("A match! These fractions represent the same amount.");
        if (found.length === 3) submit([...found].sort());
      } else {
        setLocked(true);
        setMessage(
          "Different values. Remember their places and try another pair.",
        );
        timer.current = setTimeout(() => {
          setOpen([]);
          setLocked(false);
        }, 1100);
      }
    }
  }
  return (
    <div className="memory-game">
      <div className="between">
        <span className="pill lavender">{matched.length}/3 pairs found</span>
        <span>{turns} turns</span>
      </div>
      <div className="memory-grid">
        {cards.map((c, i) => {
          const visible = open.includes(i) || matched.includes(c.pair);
          return (
            <button
              key={i}
              className={visible ? "revealed" : ""}
              aria-label={
                visible ? `Card ${i + 1}: ${c.text}` : `Turn card ${i + 1}`
              }
              aria-pressed={visible}
              disabled={locked || busy || matched.includes(c.pair)}
              onClick={() => flip(i)}
            >
              <span>{visible ? c.text : "✦"}</span>
              {matched.includes(c.pair) && <Check size={18} />}
            </button>
          );
        })}
      </div>
      <p role="status">{message}</p>
      <button
        className="secondary"
        onClick={() => {
          if (timer.current) clearTimeout(timer.current);
          setOpen([]);
          setMatched([]);
          setTurns(0);
          setLocked(false);
          setMessage("Fresh cards. Find the matching fractions.");
        }}
      >
        <RotateCcw size={16} />
        Start again
      </button>
    </div>
  );
}
export function circuitValues(
  voltage: number,
  resistance: number,
  closed: boolean,
) {
  const current = closed ? voltage / resistance : 0;
  return { current, power: voltage * current };
}
export function CircuitLab() {
  const [voltage, setVoltage] = useState(6),
    [resistance, setResistance] = useState(20),
    [closed, setClosed] = useState(false);
  const { current, power } = circuitValues(voltage, resistance, closed);
  return (
    <div className="circuit-lab">
      <div className="circuit-diagram">
        <svg
          viewBox="0 0 400 250"
          role="img"
          aria-label={
            closed
              ? "Closed circuit with a glowing lamp"
              : "Open circuit with an unlit lamp"
          }
        >
          <path
            d="M85 180H45V55H145M205 55H350V180H275M215 180H85"
            fill="none"
            stroke={closed ? "#aa83d3" : "#aca3bc"}
            strokeWidth="5"
          />
          <path
            d={closed ? "M145 55H205" : "M145 55L197 20"}
            stroke="#795b96"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="145" cy="55" r="6" fill="#795b96" />
          <circle cx="205" cy="55" r="6" fill="#795b96" />
          <circle
            cx="245"
            cy="180"
            r="30"
            fill={
              closed
                ? `rgba(246,193,75,${Math.min(1, 0.25 + power / 12)})`
                : "#eee9f4"
            }
            stroke="#9d8baa"
            strokeWidth="3"
          />
          <path
            d="M230 165l30 30m0-30-30 30"
            stroke="#9d8baa"
            strokeWidth="3"
          />
          <rect x="38" y="105" width="15" height="40" fill="white" />
          <path d="M26 120h38m-30 12h22" stroke="#795b96" strokeWidth="4" />
          <text x="70" y="128" fontSize="16" fill="#685578">
            {voltage} V
          </text>
          <text x="217" y="232" fontSize="14" fill="#685578">
            {resistance} Ω
          </text>
          {closed && (
            <>
              <circle cx="100" cy="55" r="5" fill="#e5b557" />
              <circle cx="350" cy="130" r="5" fill="#e5b557" />
              <circle cx="145" cy="180" r="5" fill="#e5b557" />
            </>
          )}
        </svg>
        <button
          className="secondary"
          aria-pressed={closed}
          onClick={() => setClosed(!closed)}
        >
          {closed ? "Open switch" : "Close switch"}
        </button>
      </div>
      <div className="simulation-controls">
        <h3>Light up your ideas</h3>
        <p>
          Close the switch, then change voltage and resistance. How does the
          lamp respond?
        </p>
        <label>
          Battery voltage: {voltage} V
          <input
            aria-label="Battery voltage"
            type="range"
            min="1"
            max="12"
            value={voltage}
            onChange={(e) => setVoltage(+e.target.value)}
          />
        </label>
        <label>
          Lamp resistance: {resistance} Ω
          <input
            aria-label="Lamp resistance"
            type="range"
            min="10"
            max="100"
            step="10"
            value={resistance}
            onChange={(e) => setResistance(+e.target.value)}
          />
        </label>
        <div className="circuit-readings" aria-live="polite">
          <strong>{current.toFixed(2)} A</strong>
          <span>Current · I = V ÷ R</span>
          <strong>{power.toFixed(2)} W</strong>
          <span>Power · P = V × I</span>
        </div>
        <p className="small muted">
          <Lightbulb size={14} /> Ideal DC model with constant resistance. Real
          incandescent lamps heat up and change resistance.
        </p>
        <button
          className="text-button"
          onClick={() => {
            setVoltage(6);
            setResistance(20);
            setClosed(false);
          }}
        >
          Reset experiment
        </button>
      </div>
    </div>
  );
}
