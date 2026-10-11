import { useEffect, useState } from "react";
import { useMidi } from "../lib/midi";
import { CoffeeButton } from "./CoffeeButton";
import { Logo } from "./Logo";

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
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#07070f]/88 p-4 backdrop-blur-md">
      <div className="rise glass w-full max-w-md rounded-3xl px-6 py-7 sm:px-8">
        <h1>
          <Logo wordmark size={52} />
        </h1>
        <p className="mt-3 text-sm text-white/50">Falling notes, at your tempo.</p>

        <div className="mt-5 flex items-center gap-2.5 text-sm text-white/80">
          <span className={`h-2 w-2 shrink-0 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-white/40"} ${midi.status === "idle" && midi.supported ? "animate-pulse" : ""}`} />
          <span>{status}</span>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={!canEnter}
            onClick={onEnter}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition enabled:hover:brightness-110 disabled:opacity-40"
          >
            {canEnter ? "Start practicing" : "Connecting…"}
          </button>
          <CoffeeButton prominent />
        </div>
      </div>
    </div>
  );
}
