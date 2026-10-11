import { useEffect, useMemo, useState } from "react";
import { accuracy, engine, gradeFor, selectSong, useEngine } from "../lib/engine";
import { locateSong, nextAfter } from "../lib/library";
import { bestForKey } from "../lib/session";
import { setLibraryCategory } from "../lib/ui";

const BINS = 11;
const BIN_MS = 40;

function histogram(times: number[]) {
  const counts = Array.from({ length: BINS }, () => 0);
  for (const sec of times) {
    const ms = -sec * 1000;
    const i = Math.min(BINS - 1, Math.max(0, Math.round(ms / BIN_MS) + Math.floor(BINS / 2)));
    counts[i]++;
  }
  return counts;
}

export function Results() {
  const s = useEngine();
  const next = useMemo(() => (s.finished ? nextAfter(s.song) : null), [s.finished, s.song]);
  const acc = accuracy(s);
  const grade = gradeFor(acc);
  const [shown, setShown] = useState(0);

  const found = s.finished ? locateSong(s.song) : null;
  const memKey = found ? `${found.category.id}:${found.index}` : null;
  const mem = memKey ? bestForKey(memKey) : { bestAcc: acc, plays: 1 };
  const counts = useMemo(() => (s.finished ? histogram(engine.timing) : []), [s.finished, s.hits, s.perfects]);
  const peak = Math.max(1, ...counts);

  useEffect(() => {
    if (!s.finished) {
      setShown(0);
      return;
    }
    const target = acc ?? 0;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 700);
      setShown(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [s.finished, acc]);

  if (!s.finished || !next) return null;
  const close = () => engine.dismissResults();
  const playNext = () => {
    setLibraryCategory(next.category.id);
    selectSong(next.song, { playing: true, loop: null });
  };

  return (
    <div
      className="absolute inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <div className="welcome-card-shell rise relative w-[min(92vw,400px)]" onClick={(e) => e.stopPropagation()}>
        <div className="welcome-card-spin" aria-hidden />
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="result-spark" style={{ animationDelay: `${i * 0.05}s`, ["--dx" as string]: `${(i - 4.5) * 18}px` }} />
        ))}
        <div className="relative overflow-hidden rounded-[2rem] bg-[#121226]/88 px-7 py-8 text-center shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/8 text-white/70 hover:bg-white/15"
            aria-label="Close"
            title="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>

          <div className="text-xs font-semibold uppercase tracking-widest text-white/40">Finished</div>
          <div className="mt-3 bg-gradient-to-r from-cyan-300 via-indigo-300 to-pink-300 bg-clip-text text-7xl font-extrabold leading-none text-transparent">
            {grade}
          </div>
          <div className="mt-2 bg-gradient-to-r from-cyan-300 via-indigo-300 to-pink-300 bg-clip-text text-4xl font-extrabold text-transparent">
            {shown}%
          </div>
          <div className="mt-1 text-sm text-white/45">accuracy</div>
          <div className="mt-2 text-xs font-medium text-cyan-200/80">
            {mem.bestAcc !== null ? `Best on this piece · ${Math.round(mem.bestAcc)}%` : "First run on this piece"}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
            <div><div className="text-lg font-bold text-cyan-200">{s.perfects}</div><div className="text-white/40">perfect</div></div>
            <div><div className="text-lg font-bold text-indigo-200">{s.earlies}</div><div className="text-white/40">early</div></div>
            <div><div className="text-lg font-bold text-pink-200">{s.lates}</div><div className="text-white/40">late</div></div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div><div className="text-base font-bold">{s.hits}</div><div className="text-white/40">hit</div></div>
            <div><div className="text-base font-bold">{s.misses}</div><div className="text-white/40">missed</div></div>
            <div><div className="text-base font-bold">{s.best}</div><div className="text-white/40">streak</div></div>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-white/35">
              <span>Early</span><span>Timing</span><span>Late</span>
            </div>
            <div className="flex h-12 items-end gap-0.5">
              {counts.map((n, i) => (
                <div
                  key={i}
                  className={`min-h-[3px] flex-1 rounded-t ${i === Math.floor(BINS / 2) ? "bg-cyan-300" : "bg-indigo-400/70"}`}
                  style={{ height: `${Math.max(8, (n / peak) * 100)}%` }}
                />
              ))}
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                engine.restart();
                useEngine.setState({ playing: true });
              }}
              className="welcome-cta relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 bg-[length:180%_100%] py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30"
            >
              Play again
            </button>
            <button
              type="button"
              onClick={playNext}
              className="w-full rounded-xl bg-white/10 py-2.5 text-sm font-bold text-white hover:bg-white/15"
            >
              Next song
              <span className="mt-0.5 block truncate text-[11px] font-medium text-white/55">
                {next.category.name} · {next.song.title}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
