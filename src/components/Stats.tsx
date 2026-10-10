import { accuracy, useEngine } from "../lib/engine";

export function Stats() {
  const s = useEngine();
  const acc = accuracy(s);
  const items = [
    { label: "Accuracy", value: acc === null ? "—" : `${acc}%` },
    { label: "Streak", value: s.streak },
    { label: "Best", value: s.best },
    { label: "Missed", value: s.misses + s.wrongs },
  ];
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      {items.map((i) => (
        <div key={i.label} className="text-center">
          <div className="text-sm font-bold tabular-nums leading-none">{i.value}</div>
          <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-white/40">{i.label}</div>
        </div>
      ))}
    </div>
  );
}
