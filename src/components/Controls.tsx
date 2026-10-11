import { useCallback, useEffect, useRef, useState } from "react";
import { engine, useEngine, type Mode } from "../lib/engine";
import { synth } from "../lib/audio";
import { barAt, barsOf } from "../lib/library";
import { Group, Pill } from "./ui";
import { MixSliders } from "./MixSliders";

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
        label.current.textContent = `Bar ${barAt(engine.pos, song)} / ${barsOf(song)}`;
      }
    };
    raf = requestAnimationFrame(loopFn);
    return () => cancelAnimationFrame(raf);
  }, [song]);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span ref={label} className="hidden w-24 shrink-0 text-xs font-medium tabular-nums text-white/50 sm:block" />
      <div
        className="group relative h-6 min-w-0 flex-1 cursor-pointer"
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
  const modes: [Mode, string, string][] = [
    ["play", "Play along", "Play with the scrolling notes"],
    ["wait", "Wait", "Notes wait until you play them"],
    ["echo", "Call & response", "The app plays two bars, then you play them back. Space starts the next part"],
  ];
  const barBeats = s.song.beatsPerBar;
  const [hover, setHoverState] = useState(false);
  const closeTimer = useRef<number>(0);
  const setHover = useCallback((on: boolean, delay = 0) => {
    window.clearTimeout(closeTimer.current);
    if (on || delay === 0) setHoverState(on);
    else closeTimer.current = window.setTimeout(() => setHoverState(false), delay);
  }, []);
  const [minimized, setMinimized] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(orientation: landscape) and (max-height: 520px)").matches,
  );
  const [practice, setPractice] = useState(false);
  const collapsed = !hover && (s.playing || minimized);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape) and (max-height: 520px)");
    const apply = () => {
      if (mq.matches) setMinimized(true);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

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
    <div
      className="pointer-events-none absolute inset-x-0 bottom-[var(--keyh,150px)] flex justify-center px-3 pb-3 [@media(orientation:landscape)_and_(max-height:520px)]:pb-1 sm:px-4"
    >
      <div
        className={`pointer-events-auto w-full max-w-5xl ${collapsed ? "" : "pt-4"}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false, 350)}
      >
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
            collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
          }`}
        >
          <div className="overflow-hidden">
            <div className="glass relative flex flex-col gap-2.5 rounded-2xl px-3 py-3 sm:px-4">
      <button
        onClick={() => {
          setMinimized(true);
          setHover(false);
          setPractice(false);
        }}
        className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-white/40 transition hover:bg-white/12 hover:text-white"
        title="Minimize"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <div className="flex flex-wrap items-center gap-2 pr-6 sm:gap-3">
        <button
          onClick={() => {
            synth.unlock();
            if (!s.playing) setHover(false);
            set({ playing: !s.playing });
          }}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 text-white shadow-lg shadow-indigo-500/40 transition hover:scale-105 active:scale-95"
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
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/8 text-white/70 hover:bg-white/15"
          title="Stop and restart"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
        </button>
        <Progress />
      </div>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <Group label="Mode">
          {modes.map(([m, l, hint]) => (
            <Pill key={m} active={s.mode === m} title={hint} onClick={() => set({ mode: m })}>{l}</Pill>
          ))}
        </Group>
        <Group label="Hands">
          <Pill tone="pink" active={s.hands.L} title="Left hand. Off dims these notes and mutes them" onClick={() => toggleHand("L")}>Left</Pill>
          <Pill tone="cyan" active={s.hands.R} title="Right hand. Off dims these notes and mutes them" onClick={() => toggleHand("R")}>Right</Pill>
        </Group>
        <div className="flex flex-col gap-1">
          <span className="px-1 text-[10px] font-semibold uppercase tracking-widest text-white/35">
            Tempo · {Math.round(s.song.bpm * s.speed)} BPM
          </span>
          <div className="flex h-[34px] items-center gap-3 rounded-xl bg-black/25 px-3">
            <input
              type="range" min={0.25} max={1.25} step={0.05} value={s.speed}
              onChange={(e) => set({ speed: Number(e.target.value) })}
              className="w-28 sm:w-32"
            />
            <span className="w-9 text-xs font-semibold tabular-nums text-white/70">{Math.round(s.speed * 100)}%</span>
          </div>
        </div>
        <MixSliders />
        <div className="relative md:hidden">
          <Group label="More">
            <Pill tone="amber" active={practice || s.metronome || s.countIn || !!s.loop} title="Metronome, count-in, loop" onClick={() => setPractice((v) => !v)}>
              Practice
            </Pill>
          </Group>
        </div>
        <div className="hidden md:contents">
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
      {practice && (
        <div className="flex flex-wrap items-end gap-3 border-t border-white/8 pt-2 md:hidden">
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
      )}
            </div>
          </div>
        </div>
        {collapsed && (
          <button
            onClick={() => {
              setMinimized(false);
              setHover(true);
            }}
            className="mx-auto flex h-7 items-center gap-2 rounded-full border border-white/10 bg-black/45 px-4 text-[11px] font-semibold text-white/60 backdrop-blur transition hover:text-white"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15l6-6 6 6" /></svg>
            Controls
          </button>
        )}
      </div>
    </div>
  );
}
