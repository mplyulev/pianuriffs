import { useMemo } from "react";
import { accuracy, engine, useEngine } from "../lib/engine";
import { nextAfter } from "../lib/library";
import { setLibraryCategory } from "../lib/ui";

export function Results() {
  const s = useEngine();
  const next = useMemo(() => (s.finished ? nextAfter(s.song) : null), [s.finished, s.song]);
  if (!s.finished || !next) return null;
  const acc = accuracy(s) ?? 0;
  const close = () => engine.dismissResults();
  const playNext = () => {
    setLibraryCategory(next.category.id);
    useEngine.setState({ song: next.song, playing: true, loop: null });
  };

  return (
    <div
      className="absolute inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="glass relative w-[min(92vw,380px)] rounded-3xl p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
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
        <div className="mt-2 bg-gradient-to-r from-cyan-300 via-indigo-300 to-pink-300 bg-clip-text text-6xl font-extrabold text-transparent">
          {acc}%
        </div>
        <div className="mt-1 text-sm text-white/50">accuracy</div>
        <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
          <div><div className="text-lg font-bold">{s.hits}</div><div className="text-white/40">hit</div></div>
          <div><div className="text-lg font-bold">{s.misses}</div><div className="text-white/40">missed</div></div>
          <div><div className="text-lg font-bold">{s.best}</div><div className="text-white/40">streak</div></div>
        </div>
        <div className="mt-7 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              engine.restart();
              useEngine.setState({ playing: true });
            }}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30"
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
  );
}
