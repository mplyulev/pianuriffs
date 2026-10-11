import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PATCHES, synth, useSamples, useSound } from "../lib/audio";
import { PROGRAMS } from "../lib/sampleBank";
import { MixSliders } from "./MixSliders";

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteName = (m: number) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;

const select =
  "w-full rounded-lg bg-white/8 px-2.5 py-2 text-sm font-medium text-white outline-none ring-1 ring-white/10 focus:ring-indigo-400/60 [&>option]:bg-slate-900";

export function SoundPanel() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef(0);
  const [box, setBox] = useState<{ top: number; right: number } | null>(null);
  const s = useSound();
  const pending = useSamples((st) => st.pending);
  const keyPatch = PATCHES.find((p) => p.id === s.keys) ?? PATCHES[0];
  const bassPatch = PATCHES.find((p) => p.id === s.bass) ?? PATCHES.find((p) => p.group === "bass") ?? PATCHES[0];
  const loadingKeys = (pending[keyPatch.sample] ?? 0) > 0;
  const loadingBass = s.splitOn && bassPatch.sample !== keyPatch.sample && (pending[bassPatch.sample] ?? 0) > 0;
  const credits = [PROGRAMS[keyPatch.sample].credit];
  if (s.splitOn && bassPatch.sample !== keyPatch.sample) credits.push(PROGRAMS[bassPatch.sample].credit);
  const set = (patch: Partial<typeof s>) => {
    useSound.setState(patch);
    synth.unlock();
    setTimeout(() => synth.preview(), 0);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (root.current?.contains(t) || panel.current?.contains(t)) return;
      setOpen(false);
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

  useEffect(() => {
    document.body.dataset.sounds = open ? "open" : "";
    return () => {
      document.body.dataset.sounds = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = root.current?.getBoundingClientRect();
      if (!r || r.height < 2) return;
      const next = { top: r.bottom + 10, right: Math.max(12, window.innerWidth - r.right) };
      setBox((prev) => (prev && Math.abs(prev.top - next.top) < 0.5 && Math.abs(prev.right - next.right) < 0.5 ? prev : next));
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("pointermove", place);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("pointermove", place);
    };
  }, [open]);

  const scheduleClose = () => {
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => {
      const el = document.activeElement;
      if (el && panel.current?.contains(el) && (el.tagName === "SELECT" || el.tagName === "INPUT")) return;
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
        className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          open ? "bg-white/18 text-white" : "bg-white/8 text-white/80 hover:bg-white/15"
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M4 8v8M9 4v16M14 7v10M19 10v4" /></svg>
        Sounds
      </button>
      {open && box && createPortal(
        <div
          ref={panel}
          className="glass fixed z-[80] w-72 space-y-4 rounded-2xl p-4 [@media(orientation:landscape)_and_(max-height:520px)]:max-h-[min(420px,calc(100dvh-16px))] [@media(orientation:landscape)_and_(max-height:520px)]:overflow-y-auto"
          style={{ top: box.top, right: box.right }}
          onMouseEnter={() => window.clearTimeout(leaveTimer.current)}
          onMouseLeave={scheduleClose}
        >
          <MixSliders />
          <label className="block space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Instrument</span>
            <select className={select} value={s.keys} onChange={(e) => set({ keys: e.target.value })}>
              {PATCHES.map((p) => (
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
          {loadingKeys || loadingBass ? (
            <p className="text-[11px] font-medium text-indigo-200/80">
              {loadingKeys && loadingBass ? "Loading recordings…" : loadingKeys ? `Loading ${keyPatch.name}…` : `Loading ${bassPatch.name}…`}
            </p>
          ) : null}
          <p className="text-[10px] leading-relaxed text-white/35">{credits.join(" ")}</p>
        </div>,
        document.body,
      )}
    </div>
  );
}
