import { useEffect, useState } from "react";
import { useMidi } from "../lib/midi";
import { CoffeeButton } from "./CoffeeButton";
import { Logo } from "./Logo";

const NOTES = [
  { left: "7%", delay: "0s", dur: "8.5s", h: 86, w: 16, color: "bg-cyan-300/80" },
  { left: "16%", delay: "2.2s", dur: "10s", h: 120, w: 12, color: "bg-pink-400/75" },
  { left: "28%", delay: "0.8s", dur: "9.2s", h: 64, w: 14, color: "bg-indigo-300/80" },
  { left: "63%", delay: "1.5s", dur: "11s", h: 140, w: 16, color: "bg-fuchsia-400/70" },
  { left: "74%", delay: "3.1s", dur: "8.8s", h: 78, w: 12, color: "bg-cyan-200/80" },
  { left: "84%", delay: "0.4s", dur: "10.4s", h: 108, w: 15, color: "bg-indigo-400/75" },
  { left: "92%", delay: "2.6s", dur: "9.6s", h: 56, w: 11, color: "bg-pink-300/70" },
];

const WHITES = 16;

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
      <div className="welcome-glow pointer-events-none absolute -left-24 top-8 h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl" />
      <div className="welcome-glow pointer-events-none absolute -right-20 bottom-16 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl [animation-delay:-4s]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2">
        <div className="welcome-glow h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl [animation-delay:-2s]" />
      </div>

      {NOTES.map((n) => (
        <span
          key={n.left}
          aria-hidden
          className={`welcome-note pointer-events-none absolute top-0 rounded-md ${n.color} shadow-[0_0_18px_rgba(255,255,255,0.18)]`}
          style={{
            left: n.left,
            width: n.w,
            height: n.h,
            animationDelay: n.delay,
            animationDuration: n.dur,
          }}
        />
      ))}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/90 to-transparent shadow-[0_0_16px_#67e8f9]" />
        <div className="flex h-full items-end gap-0.5 px-2 pb-0 opacity-90">
          {Array.from({ length: WHITES }, (_, i) => {
            const black = [0, 1, 3, 4, 5].includes(i % 7);
            return (
              <div key={i} className="relative h-[82%] min-w-0 flex-1 rounded-t-md bg-gradient-to-b from-white to-zinc-300">
                {black && i < WHITES - 1 && (
                  <div className="absolute -right-1.5 top-0 z-10 h-[58%] w-3 rounded-b-sm bg-zinc-950 shadow-md sm:w-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>

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
