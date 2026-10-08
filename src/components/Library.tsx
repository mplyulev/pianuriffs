import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, barsOf, loadItem } from "../lib/library";
import { useEngine } from "../lib/engine";
import { setLibraryOpen, useUi } from "../lib/ui";

export function Library() {
  const open = useUi((s) => s.libraryOpen);
  const current = useEngine((s) => s.song);
  const [catId, setCatId] = useState(CATEGORIES[0].id);
  const cat = CATEGORIES.find((c) => c.id === catId)!;
  const songs = useMemo(() => cat.items.map((_, i) => loadItem(cat, i)), [cat]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setLibraryOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  const pick = (i: number) => {
    useEngine.setState({ song: songs[i], playing: false, loop: null });
  };

  return (
    <>
      <div
        onClick={() => setLibraryOpen(false)}
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        className={`glass absolute bottom-3 right-3 top-3 flex w-[min(94vw,420px)] flex-col rounded-3xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-[110%]"
        }`}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <div>
            <div className="text-lg font-bold tracking-tight">Library</div>
            <div className="text-xs text-white/45">
              {CATEGORIES.length} categories · {CATEGORIES.reduce((n, c) => n + c.items.length, 0)} pieces
            </div>
          </div>
          <button onClick={() => setLibraryOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-white/8 text-white/70 hover:bg-white/15" title="Close (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 px-5 pb-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCatId(c.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                c.id === catId ? `bg-gradient-to-r ${c.accent} text-slate-900` : "bg-white/7 text-white/60 hover:bg-white/14"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="px-5 pb-2 text-xs text-white/40">{cat.blurb}</div>

        <ul className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {songs.map((s, i) => {
            const active = s === current;
            return (
              <li key={`${cat.id}${i}`}>
                <button
                  onClick={() => pick(i)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    active ? "bg-white/14 ring-1 ring-white/25" : "hover:bg-white/8"
                  }`}
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${cat.accent} text-xs font-bold text-slate-900`}>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{s.title}</span>
                    <span className="block truncate text-xs text-white/45">
                      {s.composer} · {s.bpm} BPM · {barsOf(s)} bars
                    </span>
                  </span>
                  {active && <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}
