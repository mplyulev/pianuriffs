import { useEffect, useRef, useState } from "react";
import { PATCHES, synth, useSound } from "../lib/audio";

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteName = (m: number) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;

const select =
  "w-full rounded-lg bg-white/8 px-2.5 py-2 text-sm font-medium text-white outline-none ring-1 ring-white/10 focus:ring-indigo-400/60 [&>option]:bg-slate-900";

export function SoundPanel() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef(0);
  const s = useSound();
  const set = (patch: Partial<typeof s>) => {
    useSound.setState(patch);
    synth.unlock();
    setTimeout(() => synth.preview(), 0);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const scheduleClose = () => {
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => {
      const el = document.activeElement;
      if (el && root.current?.contains(el) && el.tagName === "SELECT") return;
      setOpen(false);
    }, 220);
  };

  return (
    <div
      ref={root}
      className="relative"
      onMouseEnter={() => window.clearTimeout(leaveTimer.current)}
      onMouseLeave={scheduleClose}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          open ? "bg-white/18 text-white" : "bg-white/8 text-white/80 hover:bg-white/15"
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M4 8v8M9 4v16M14 7v10M19 10v4" /></svg>
        Sounds
      </button>
      {open && (
        <div className="glass absolute right-0 top-[calc(100%+10px)] z-30 w-72 space-y-4 rounded-2xl p-4">
          <label className="block space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Keys instrument</span>
            <select className={select} value={s.keys} onChange={(e) => set({ keys: e.target.value })}>
              {PATCHES.filter((p) => p.group === "keys").map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>

          <div className="space-y-2.5 rounded-xl bg-black/20 p-3">
            <label className="flex cursor-pointer items-center justify-between text-sm font-semibold">
              Keyboard split
              <input type="checkbox" checked={s.splitOn} onChange={(e) => set({ splitOn: e.target.checked })} className="h-4 w-4 accent-indigo-400" />
            </label>
            <div className={s.splitOn ? "space-y-3" : "pointer-events-none space-y-3 opacity-40"}>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Bass below split</span>
                <select className={select} value={s.bass} onChange={(e) => set({ bass: e.target.value })}>
                  {PATCHES.filter((p) => p.group === "bass").map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="flex justify-between text-[10px] font-semibold uppercase tracking-widest text-white/40">
                  Split point <span className="text-white/70">{noteName(s.split)}</span>
                </span>
                <input type="range" min={36} max={72} step={1} value={s.split} onChange={(e) => set({ split: Number(e.target.value) })} className="w-full" />
              </label>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-white/40">
            Applies to your playing and the app's backing. Notes below the split use the bass sound.
          </p>
        </div>
      )}
    </div>
  );
}
