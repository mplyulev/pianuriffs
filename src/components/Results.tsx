import { accuracy, engine, useEngine } from "../lib/engine";

export function Results() {
  const s = useEngine();
  if (!s.finished) return null;
  const acc = accuracy(s) ?? 0;
  return (
    <div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-sm">
      <div className="glass w-[min(92vw,380px)] rounded-3xl p-8 text-center">
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
        <button
          onClick={() => {
            engine.restart();
            useEngine.setState({ playing: true });
          }}
          className="mt-7 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30"
        >
          Play again
        </button>
      </div>
    </div>
  );
}
