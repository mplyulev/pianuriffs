import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, barsOf, difficultyOf, loadItem } from "../lib/library";
import { selectSong, useEngine } from "../lib/engine";
import { bestForKey } from "../lib/session";
import { setLibraryCategory, setLibraryOpen, useUi } from "../lib/ui";
import type { Song } from "../lib/song";

function coverHue(title: string) {
  let h = 2166136261;
  for (let i = 0; i < title.length; i++) h = Math.imul(h ^ title.charCodeAt(i), 16777619);
  return (h >>> 0) % 360;
}

function RiffPreview({ song }: { song: Song }) {
  const until = song.beatsPerBar * 2;
  const notes = song.notes.filter((n) => n.start < until);
  const minM = notes.reduce((a, n) => Math.min(a, n.midi), 60);
  const maxM = notes.reduce((a, n) => Math.max(a, n.midi), 72);
  const span = Math.max(8, maxM - minM);
  return (
    <svg viewBox="0 0 120 36" className="h-9 w-full" aria-hidden>
      {notes.slice(0, 48).map((n, i) => {
        const x = 4 + (n.start / until) * 112;
        const y = 32 - ((n.midi - minM) / span) * 28;
        const w = Math.max(3, (n.dur / until) * 112);
        const hue = n.hand === "L" ? 320 : 190;
        return <rect key={i} x={x} y={y} width={w} height="4" rx="1.2" fill={`hsl(${hue} 80% 70%)`} opacity="0.9" />;
      })}
    </svg>
  );
}

function Dots({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5" title={`Difficulty ${n} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < n ? "bg-cyan-300" : "bg-white/20"}`} />
      ))}
    </span>
  );
}

export function Library() {
  const open = useUi((s) => s.libraryOpen);
  const current = useEngine((s) => s.song);
  const catId = useUi((s) => s.libraryCategory);
  const setCatId = setLibraryCategory;
  const cat = CATEGORIES.find((c) => c.id === catId) ?? CATEGORIES[0];
  const songs = useMemo(() => cat.items.map((_, i) => loadItem(cat, i)), [cat]);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setLibraryOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  const pick = (i: number) => {
    selectSong(songs[i]);
  };

  return (
    <>
      <div
        onClick={() => setLibraryOpen(false)}
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        className={`glass absolute bottom-3 right-3 top-3 flex w-[min(94vw,460px)] flex-col rounded-3xl transition-transform duration-300 ${
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
            const hue = coverHue(s.title);
            const mem = bestForKey(`${cat.id}:${i}`);
            const diff = difficultyOf(s);
            return (
              <li key={`${cat.id}${i}`}>
                <button
                  onClick={() => pick(i)}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    active ? "bg-white/14 ring-1 ring-white/25" : "hover:bg-white/8"
                  }`}
                >
                  <span
                    className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl text-xs font-bold text-white"
                    style={{ background: `linear-gradient(145deg, hsl(${hue} 80% 58%), hsl(${(hue + 48) % 360} 70% 42%))` }}
                  >
                    {hover === i ? (
                      <span className="absolute inset-0 bg-black/35 p-0.5">
                        <RiffPreview song={s} />
                      </span>
                    ) : (
                      <span className="drop-shadow">{i + 1}</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{s.title}</span>
                      <Dots n={diff} />
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-white/45">
                      {s.composer} · {s.bpm} BPM · {barsOf(s)} bars
                    </span>
                    <span className="mt-0.5 block text-[11px] text-cyan-200/70">
                      {mem.plays > 0
                        ? `Played ${mem.plays} · best ${mem.bestAcc === null ? "—" : `${Math.round(mem.bestAcc)}%`}`
                        : "Not played yet"}
                    </span>
                  </span>
                  {active && <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}
