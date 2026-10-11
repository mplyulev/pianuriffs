import { useEffect, useState } from "react";
import { useMidi } from "../lib/midi";
import { CoffeeButton } from "./CoffeeButton";
import { Logo } from "./Logo";

const LANES = [5, 12, 20, 28, 36, 64, 72, 80, 88, 95];

const BRICKS = [
  { left: "4.4%", delay: "-3s", dur: "17s", h: 96, w: 16, color: "#22d3ee" },
  { left: "11.2%", delay: "-11s", dur: "20s", h: 148, w: 14, color: "#818cf8" },
  { left: "19.1%", delay: "-6s", dur: "16s", h: 64, w: 18, color: "#f472b6" },
  { left: "27.2%", delay: "-14s", dur: "22s", h: 118, w: 13, color: "#38bdf8" },
  { left: "35.1%", delay: "-2s", dur: "18s", h: 82, w: 16, color: "#a78bfa" },
  { left: "63.4%", delay: "-8s", dur: "19s", h: 132, w: 15, color: "#22d3ee" },
  { left: "71.2%", delay: "-1.5s", dur: "16s", h: 70, w: 18, color: "#818cf8" },
  { left: "79.1%", delay: "-12s", dur: "21s", h: 108, w: 14, color: "#f472b6" },
  { left: "87.2%", delay: "-5s", dur: "17s", h: 56, w: 16, color: "#38bdf8" },
  { left: "94.4%", delay: "-15s", dur: "18s", h: 140, w: 14, color: "#a78bfa" },
];

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
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 70% 50% at 12% 18%, rgba(34,211,238,0.22), transparent 58%)",
            "radial-gradient(ellipse 65% 48% at 90% 82%, rgba(244,114,182,0.18), transparent 55%)",
            "radial-gradient(ellipse 45% 40% at 52% 48%, rgba(99,102,241,0.16), transparent 62%)",
          ].join(","),
        }}
      />
      <div className="welcome-glow pointer-events-none absolute -left-20 top-6 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="welcome-glow pointer-events-none absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-pink-500/16 blur-3xl [animation-delay:-7s]" />

      {LANES.map((left) => (
        <span
          key={left}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-px bg-white/10"
          style={{ left: `${left}%` }}
        />
      ))}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 h-px bg-cyan-300/40 shadow-[0_0_18px_#67e8f9]"
        style={{ top: "78%" }}
      />

      {BRICKS.map((b) => (
        <span
          key={b.left}
          aria-hidden
          className="welcome-brick pointer-events-none absolute rounded-[6px]"
          style={{
            left: b.left,
            width: b.w,
            height: b.h,
            background: `linear-gradient(180deg, ${b.color}, ${b.color}99)`,
            boxShadow: `0 0 18px ${b.color}55`,
            animationDelay: b.delay,
            animationDuration: b.dur,
          }}
        >
          <span className="absolute inset-x-1 top-1 h-[3px] rounded-full bg-white/70" />
        </span>
      ))}

      <div className="relative z-10 flex h-full items-center justify-center p-4">
        <div className="rise glass w-full max-w-md rounded-[2rem] px-6 py-8 text-center sm:px-10 sm:py-10">
          <h1 className="flex justify-center">
            <Logo wordmark stacked size={72} />
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
              className="relative inline-flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition enabled:hover:brightness-110 disabled:cursor-pointer disabled:opacity-50"
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
