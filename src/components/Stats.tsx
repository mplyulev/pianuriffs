import { accuracy, useEngine } from "../lib/engine";

export function Stats() {
  const s = useEngine();
  const mode = s.mode;
  if (mode === "listen") return null;
  const acc = accuracy(s);
  const items = [
    { label: "Accuracy", value: acc === null ? "—" : `${acc}%` },
    { label: "Streak", value: s.streak },
    { label: "Best", value: s.best },
    { label: "Missed", value: s.misses + s.wrongs },
  ];
  return (
    <div className="glass flex gap-5 rounded-2xl px-5 py-3">
      {items.map((i) => (
        <div key={i.label} className="text-center">
          <div className="text-xl font-bold tabular-nums">{i.value}</div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{i.label}</div>
        </div>
      ))}
    </div>
  );
}
