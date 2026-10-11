import { useEffect, useMemo, useState } from "react";
import { selectSong } from "../lib/engine";
import { dailyPick } from "../lib/library";
import { useMidi } from "../lib/midi";
import { CoffeeButton } from "./CoffeeButton";
import { Logo } from "./Logo";
import { WelcomeField } from "./WelcomeField";

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

  const daily = useMemo(() => dailyPick(), []);
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
      <WelcomeField />

      <div className="relative z-10 flex h-full items-center justify-center p-4">
        <div className="welcome-card-shell rise w-full max-w-md">
          <div className="welcome-card-spin" aria-hidden />
          <div className="relative rounded-[2rem] bg-[#121226]/80 px-6 py-8 text-center shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:px-10 sm:py-10">
            <h1 className="flex justify-center">
              <Logo wordmark stacked size={72} />
            </h1>
          <p className="mt-4 text-base text-white/75">Free piano practice — falling notes, at your tempo.</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-white/45">Waterfall piano with MIDI or computer keys. Licks, riffs, and styles from classical to jazz and blues.</p>

            <div className="mt-5 flex items-center justify-center gap-2.5 text-sm text-white/80">
              <span className={`h-2 w-2 shrink-0 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-white/40"} ${midi.status === "idle" && midi.supported ? "animate-pulse" : ""}`} />
              <span>{status}</span>
            </div>

            <button
              type="button"
              disabled={!canEnter}
              onClick={() => {
                selectSong(daily.song);
                onEnter();
              }}
              className="mt-5 flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:bg-white/10 disabled:cursor-pointer disabled:opacity-50"
            >
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${daily.category.accent} text-[10px] font-bold text-slate-900`}>
                Today
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-widest text-white/40">Daily riff</span>
                <span className="block truncate text-sm font-semibold text-white">{daily.song.title}</span>
                <span className="block truncate text-xs text-white/45">{daily.category.name} · {daily.song.bpm} BPM</span>
              </span>
            </button>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={!canEnter}
                onClick={onEnter}
                className="welcome-cta relative inline-flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 bg-[length:180%_100%] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/35 transition enabled:hover:brightness-110 disabled:cursor-pointer disabled:opacity-50"
              >
                {canEnter && <span className="welcome-sheen pointer-events-none absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/55 to-transparent" />}
                <span className="relative">{canEnter ? "Start practicing" : "Connecting…"}</span>
              </button>
              <CoffeeButton prominent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
