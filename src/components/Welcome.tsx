import { useEffect, useState } from "react";
import { useMidi } from "../lib/midi";
import { CoffeeButton } from "./CoffeeButton";
import { Logo } from "./Logo";

type Tone = { x: number; step: number; eighth?: boolean; dot?: boolean };

const PHRASE_W = 480;
const COPIES = 6;
const STAFF_H = 112;
const STAFF = [38, 46, 54, 62, 70];

const UPPER: Tone[] = [
  { x: 28, step: 0 },
  { x: 78, step: 2, eighth: true },
  { x: 118, step: 4, eighth: true },
  { x: 176, step: 7 },
  { x: 232, step: 5, eighth: true, dot: true },
  { x: 278, step: 4, eighth: true },
  { x: 336, step: 2 },
  { x: 392, step: 1, eighth: true },
  { x: 436, step: 0, eighth: true },
];

const LOWER: Tone[] = [
  { x: 36, step: 5 },
  { x: 96, step: 3, eighth: true },
  { x: 140, step: 2, eighth: true },
  { x: 196, step: 0 },
  { x: 256, step: 2, eighth: true },
  { x: 304, step: 4, eighth: true },
  { x: 364, step: 3 },
  { x: 424, step: 5, eighth: true },
];

function headY(step: number) {
  return 70 - step * 4;
}

function Phrase({ notes, color, stemDown }: { notes: Tone[]; color: string; stemDown?: boolean }) {
  const beamed = new Set<number>();
  const beams: [Tone, Tone][] = [];
  for (let i = 0; i < notes.length - 1; i++) {
    const a = notes[i];
    const b = notes[i + 1];
    if (a.eighth && b.eighth && b.x - a.x < 58) {
      beams.push([a, b]);
      beamed.add(i);
      beamed.add(i + 1);
      i++;
    }
  }
  return (
    <svg width={PHRASE_W} height="100%" viewBox={`0 0 ${PHRASE_W} ${STAFF_H}`} preserveAspectRatio="none" className="h-full shrink-0" fill={color}>
      {notes.map((n, i) => {
        const y = headY(n.step);
        const stemX = stemDown ? n.x - 4.6 : n.x + 4.4;
        const stemY = stemDown ? y : y - 26;
        return (
          <g key={i}>
            <ellipse cx={n.x} cy={y} rx="5.4" ry="3.6" transform={`rotate(-18 ${n.x} ${y})`} />
            <rect x={stemX} y={stemY} width="1.15" height="26" rx="0.3" />
            {n.eighth && !beamed.has(i) && (
              <path
                d={stemDown
                  ? `M${stemX} ${y + 26} c 7 -2 11 -8 6 -15`
                  : `M${stemX + 1.1} ${y - 26} c 7 3 10 10 5 16`}
                fill="none"
                stroke={color}
                strokeWidth="1.25"
              />
            )}
            {n.dot && <circle cx={n.x + 10} cy={y - 2} r="1.35" />}
          </g>
        );
      })}
      {beams.map(([a, b], i) => {
        const y1 = headY(a.step) + (stemDown ? 26 : -26);
        const y2 = headY(b.step) + (stemDown ? 26 : -26);
        const x1 = stemDown ? a.x - 4.6 : a.x + 4.4;
        const x2 = stemDown ? b.x - 4.6 : b.x + 5.5;
        const thick = stemDown ? 2.2 : -2.2;
        return <polygon key={i} points={`${x1},${y1} ${x2},${y2} ${x2},${y2 + thick} ${x1},${y1 + thick}`} />;
      })}
    </svg>
  );
}

function Score({ notes, color, duration, reverse, className, stemDown }: {
  notes: Tone[];
  color: string;
  duration: string;
  reverse?: boolean;
  className: string;
  stemDown?: boolean;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 h-[112px] ${className}`}
      style={{ maskImage: "linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)" }}
      aria-hidden
    >
      {STAFF.map((y) => (
        <div key={y} className="absolute right-0 left-0 h-px bg-white/14" style={{ top: `${(y / STAFF_H) * 100}%` }} />
      ))}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`welcome-score flex h-full ${reverse ? "[animation-direction:reverse]" : ""}`}
          style={{ width: PHRASE_W * COPIES, animationDuration: duration }}
        >
          {Array.from({ length: COPIES }, (_, i) => (
            <Phrase key={i} notes={notes} color={color} stemDown={stemDown} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Welcome({ onEnter }: { onEnter: () => void }) {
  const midi = useMidi();
  const [minTime, setMinTime] = useState(false);
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const a = window.setTimeout(() => setMinTime(true), 900);
    const b = window.setTimeout(() => setForced(true), 4000);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  const settled = !midi.supported || midi.status !== "idle";
  const canEnter = forced || (minTime && settled);
  const connected = midi.inputs.length > 0;
  const status = !midi.supported
    ? "This browser has no MIDI. Computer keys are ready."
    : midi.status === "denied"
      ? "MIDI is blocked here. Computer keys still work."
      : connected
        ? `${midi.inputs[0]} is connected.`
        : midi.status === "ready"
          ? "No keyboard found. Computer keys still work."
          : "Listening for a keyboard…";

  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-[#07070f]">
      <div className="welcome-glow pointer-events-none absolute -left-28 top-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="welcome-glow pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-cyan-400/8 blur-3xl [animation-delay:-8s]" />

      <Score notes={UPPER} color="rgba(236, 232, 222, 0.78)" duration="42s" className="top-[8%] sm:top-[12%]" />
      <Score notes={LOWER} color="rgba(176, 186, 230, 0.42)" duration="58s" reverse stemDown className="bottom-[6%] sm:bottom-[9%]" />

      <div className="relative z-10 flex h-full items-center justify-center p-4">
        <div className="rise glass w-full max-w-md rounded-[2rem] px-6 py-8 text-center sm:px-10 sm:py-10">
          <h1 className="flex justify-center">
            <span className="relative">
              <span className="welcome-halo absolute inset-0 -z-10 rounded-full bg-indigo-400/70 blur-2xl" />
              <Logo wordmark stacked size={72} />
            </span>
          </h1>
          <p className="mt-4 text-base text-white/75">Falling notes, at your tempo.</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-white/45">Plug in a MIDI keyboard, or play from the keys on your computer.</p>

          <div className="mt-5 flex items-center justify-center gap-2.5 text-sm text-white/80">
            <span className={`h-2 w-2 shrink-0 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-white/40"} ${midi.status === "idle" && midi.supported ? "animate-pulse" : ""}`} />
            <span>{status}</span>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              disabled={!canEnter}
              onClick={onEnter}
              className="relative inline-flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/40 transition enabled:hover:brightness-110 disabled:cursor-pointer disabled:opacity-50"
            >
              {canEnter && <span className="welcome-sheen pointer-events-none absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/50 to-transparent" />}
              <span className="relative">{canEnter ? "Start practicing" : "Connecting…"}</span>
            </button>
            <CoffeeButton prominent />
          </div>
        </div>
      </div>
    </div>
  );
}
