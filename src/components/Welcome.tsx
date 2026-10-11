import { useEffect, useState } from "react";
import { useMidi } from "../lib/midi";
import { CoffeeButton } from "./CoffeeButton";
import { Logo } from "./Logo";

const BRICKS = [
  { left: "4%", rest: "8%", delay: "-3s", dur: "17s", h: 96, w: 22, color: "#22d3ee" },
  { left: "10%", rest: "46%", delay: "-11s", dur: "20s", h: 154, w: 18, color: "#818cf8" },
  { left: "16%", rest: "22%", delay: "-6s", dur: "16s", h: 68, w: 24, color: "#f472b6" },
  { left: "23%", rest: "62%", delay: "-14s", dur: "22s", h: 124, w: 16, color: "#38bdf8" },
  { left: "30%", rest: "14%", delay: "-2s", dur: "18s", h: 88, w: 20, color: "#a78bfa" },
  { left: "37%", rest: "70%", delay: "-9s", dur: "15s", h: 52, w: 18, color: "#fb7185" },
  { left: "64%", rest: "38%", delay: "-8s", dur: "19s", h: 136, w: 18, color: "#22d3ee" },
  { left: "71%", rest: "10%", delay: "-1.5s", dur: "16s", h: 74, w: 22, color: "#818cf8" },
  { left: "77%", rest: "58%", delay: "-12s", dur: "21s", h: 112, w: 16, color: "#f472b6" },
  { left: "83%", rest: "26%", delay: "-5s", dur: "17s", h: 60, w: 24, color: "#38bdf8" },
  { left: "89%", rest: "74%", delay: "-15s", dur: "18s", h: 148, w: 18, color: "#a78bfa" },
  { left: "95%", rest: "42%", delay: "-7s", dur: "20s", h: 84, w: 16, color: "#fb7185" },
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
    <div className="absolute inset-0 z-40 overflow-hidden bg-[linear-gradient(165deg,#f7fbff_0%,#eef2ff_42%,#fff1f7_100%)]">
      <div className="welcome-glow pointer-events-none absolute -left-16 top-8 h-72 w-72 rounded-full bg-cyan-300/50 blur-3xl" />
      <div className="welcome-glow pointer-events-none absolute -right-10 bottom-0 h-80 w-80 rounded-full bg-pink-300/45 blur-3xl [animation-delay:-7s]" />

      {BRICKS.map((b) => (
        <span
          key={b.left}
          aria-hidden
          className="welcome-brick pointer-events-none absolute rounded-md shadow-[0_10px_24px_-12px_rgba(79,70,229,0.45)]"
          style={{
            left: b.left,
            ["--rest" as string]: b.rest,
            width: b.w,
            height: b.h,
            background: `linear-gradient(${b.color}, ${b.color}cc)`,
            animationDelay: b.delay,
            animationDuration: b.dur,
          }}
        >
          <span className="absolute inset-x-1 top-1 h-[3px] rounded-full bg-white/75" />
        </span>
      ))}

      <div className="relative z-10 flex h-full items-center justify-center p-4">
        <div className="rise w-full max-w-md rounded-[2rem] border border-white/80 bg-white/80 px-6 py-8 text-center shadow-[0_24px_60px_-28px_rgba(79,70,229,0.45)] backdrop-blur-md sm:px-10 sm:py-10">
          <h1 className="flex justify-center">
            <Logo wordmark stacked light size={72} />
          </h1>
          <p className="mt-4 text-base text-slate-700">Falling notes, at your tempo.</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">Plug in a MIDI keyboard, or play from the keys on your computer.</p>

          <div className="mt-5 flex items-center justify-center gap-2.5 text-sm text-slate-600">
            <span className={`h-2 w-2 shrink-0 rounded-full ${connected ? "bg-emerald-500 shadow-[0_0_8px_#34d399]" : "bg-slate-300"} ${midi.status === "idle" && midi.supported ? "animate-pulse" : ""}`} />
            <span>{status}</span>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              disabled={!canEnter}
              onClick={onEnter}
              className="relative inline-flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-400/40 transition enabled:hover:brightness-110 disabled:cursor-pointer disabled:opacity-50"
            >
              {canEnter && <span className="welcome-sheen pointer-events-none absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/50 to-transparent" />}
              <span className="relative">{canEnter ? "Start practicing" : "Connecting…"}</span>
            </button>
            <CoffeeButton prominent light />
          </div>
        </div>
      </div>
    </div>
  );
}
