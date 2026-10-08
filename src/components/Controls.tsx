import { useEffect, useRef } from "react";
import { engine, useEngine, type Mode } from "../lib/engine";
import { synth } from "../lib/audio";
import { Group, Pill } from "./ui";

function Progress() {
  const fill = useRef<HTMLDivElement>(null);
  const loopEl = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const song = useEngine((s) => s.song);
  const loop = useEngine((s) => s.loop);

  useEffect(() => {
    let raf = 0;
    const loopFn = () => {
      raf = requestAnimationFrame(loopFn);
      const p = Math.max(0, engine.pos) / song.length;
      if (fill.current) fill.current.style.transform = `scaleX(${Math.min(1, p)})`;
      if (label.current) {
        const bar = Math.max(0, Math.floor(engine.pos / song.beatsPerBar)) + 1;
        label.current.textContent = `Bar ${bar} / ${Math.ceil(song.length / song.beatsPerBar)}`;
      }
    };
    raf = requestAnimationFrame(loopFn);
    return () => cancelAnimationFrame(raf);
  }, [song]);

  return (
    <div className="flex items-center gap-3">
      <span ref={label} className="w-24 text-xs font-medium tabular-nums text-white/50" />
      <div
        className="group relative h-6 flex-1 cursor-pointer"
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          engine.seek(((e.clientX - r.left) / r.width) * song.length);
        }}
      >
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/12">
          <div ref={fill} className="h-full origin-left rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400" style={{ transform: "scaleX(0)" }} />
        </div>
        {loop && (
          <div
            ref={loopEl}
            className="absolute top-1/2 h-3 -translate-y-1/2 rounded bg-amber-300/35 ring-1 ring-amber-300/70"
            style={{ left: `${(loop.a / song.length) * 100}%`, width: `${((loop.b - loop.a) / song.length) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}

export function Controls() {
  const s = useEngine();
  const set = useEngine.setState;
  const modes: [Mode, string][] = [["listen", "Listen"], ["wait", "Wait"], ["play", "Play along"]];
  const barBeats = s.song.beatsPerBar;

  const toggleHand = (h: "L" | "R") => {
    const next = { ...s.hands, [h]: !s.hands[h] };
    if (!next.L && !next.R) return;
    set({ hands: next });
  };

  const setLoopEdge = (edge: "a" | "b") => {
    const snap = Math.round(engine.pos / barBeats) * barBeats;
    const cur = s.loop ?? { a: 0, b: s.song.length };
    const next = { ...cur, [edge]: Math.max(0, Math.min(s.song.length, snap)) };
    if (next.b - next.a < barBeats) {
      if (edge === "a") next.b = Math.min(s.song.length, next.a + barBeats);
      else next.a = Math.max(0, next.b - barBeats);
    }
    set({ loop: next });
  };

  return (
    <div className="glass pointer-events-auto mx-auto flex max-w-5xl flex-col gap-3 rounded-2xl p-4">
      <Progress />
      <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              synth.unlock();
              set({ playing: !s.playing });
            }}
            className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 text-white shadow-lg shadow-indigo-500/40 transition hover:scale-105 active:scale-95"
            title="Play / pause (Space)"
          >
            {s.playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" /></svg>
            )}
          </button>
          <button
            onClick={() => {
              set({ playing: false });
              engine.restart();
            }}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/8 text-white/70 hover:bg-white/15"
            title="Restart"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
          </button>
        </div>

        <Group label="Mode">
          {modes.map(([m, l]) => (
            <Pill key={m} active={s.mode === m} onClick={() => set({ mode: m })}>{l}</Pill>
          ))}
        </Group>

        <Group label="Hands you play">
          <Pill tone="pink" active={s.hands.L} onClick={() => toggleHand("L")}>Left</Pill>
          <Pill tone="cyan" active={s.hands.R} onClick={() => toggleHand("R")}>Right</Pill>
        </Group>

        <div className="flex flex-col gap-1">
          <span className="px-1 text-[10px] font-semibold uppercase tracking-widest text-white/35">
            Tempo · {Math.round(s.song.bpm * s.speed)} BPM
          </span>
          <div className="flex h-[34px] items-center gap-3 rounded-xl bg-black/25 px-3">
            <input
              type="range" min={0.25} max={1.25} step={0.05} value={s.speed}
              onChange={(e) => set({ speed: Number(e.target.value) })}
              className="w-32"
            />
            <span className="w-9 text-xs font-semibold tabular-nums text-white/70">{Math.round(s.speed * 100)}%</span>
          </div>
        </div>

        <Group label="Practice">
          <Pill tone="amber" active={s.metronome} onClick={() => set({ metronome: !s.metronome })}>Metronome</Pill>
          <Pill tone="amber" active={s.countIn} onClick={() => set({ countIn: !s.countIn })}>Count-in</Pill>
        </Group>

        <Group label="Loop">
          <Pill onClick={() => setLoopEdge("a")} title="Set loop start to current bar">A</Pill>
          <Pill onClick={() => setLoopEdge("b")} title="Set loop end to current bar">B</Pill>
          <Pill tone="amber" active={!!s.loop} onClick={() => set({ loop: null })} title="Clear loop">
            {s.loop ? "Clear" : "Off"}
          </Pill>
        </Group>
      </div>
    </div>
  );
}
