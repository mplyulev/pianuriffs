import { useEffect, useRef, useState } from "react";
import { useMidi, useKeyboardOctave } from "../lib/midi";
import { selectSong, useEngine } from "../lib/engine";
import { DEMO_SONG, parseMidiFile } from "../lib/song";
import { setLibraryOpen } from "../lib/ui";
import { SoundPanel } from "./SoundPanel";
import { LookPanel } from "./LookPanel";
import { CoffeeButton } from "./CoffeeButton";
import { Logo } from "./Logo";
import { Stats } from "./Stats";

export function TopBar() {
  const midi = useMidi();
  const octave = useKeyboardOctave((s) => s.octave);
  const song = useEngine((s) => s.song);
  const playing = useEngine((s) => s.playing);
  const fileRef = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  const collapsed = playing && !hover;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const inside = barRef.current?.contains(e.target as Node) ?? false;
      const panelOpen = document.body.dataset.sounds === "open" || document.body.dataset.look === "open";
      setHover(inside || e.clientY < 28 || panelOpen);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const load = async (f?: File) => {
    if (!f) return;
    try {
      const parsed = await parseMidiFile(f);
      selectSong(parsed);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file");
    }
  };

  const connected = midi.inputs.length > 0;
  const label = connected
    ? midi.inputs[0]
    : !midi.supported
      ? "No Web MIDI — use computer keys"
      : midi.status === "denied"
        ? "MIDI access denied"
        : "No keyboard detected";

  return (
    <div ref={barRef} className="pointer-events-auto">
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        }`}
      >
        <div className="overflow-hidden">
          <header className="glass pointer-events-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5 rounded-2xl px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3">
      <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-3">
        <Logo size={36} />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-bold tracking-tight">{song.title}</div>
          <div className="truncate text-xs text-white/45">
            {song.composer} · {song.bpm} BPM
          </div>
        </div>
      </div>

      <div
        className={`col-span-2 row-start-2 justify-self-center overflow-hidden sm:col-span-1 sm:col-start-2 sm:row-start-1 max-h-10 max-w-[24rem]`}
      >
        <Stats />
      </div>

      <div className="col-start-2 row-start-1 flex max-w-full flex-nowrap items-center justify-end gap-2 overflow-x-auto sm:col-start-3 sm:max-w-none sm:flex-wrap sm:overflow-visible">
        {error && <span className="text-xs text-rose-300">{error}</span>}
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
            connected ? "bg-emerald-400/15 text-emerald-200" : "bg-white/6 text-white/50"
          }`}
          title="Computer keys: A–; (white/black via W E T Y U O P). Z/X shift octave."
        >
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-white/30"}`} />
          {label}
          {!connected && <span className="text-white/30">· oct {octave}</span>}
        </div>
        <CoffeeButton />
        <SoundPanel />
        <LookPanel />
        <button
          onClick={() => setLibraryOpen(true)}
          className="cursor-pointer rounded-lg bg-gradient-to-r from-cyan-400/90 to-indigo-500/90 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110"
        >
          Library
        </button>
        <input ref={fileRef} type="file" accept=".mid,.midi" hidden onChange={(e) => load(e.target.files?.[0])} />
        <button
          onClick={() => fileRef.current?.click()}
          className="cursor-pointer rounded-lg bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/15"
        >
          Import MIDI
        </button>
        {song !== DEMO_SONG && (
          <button
            onClick={() => selectSong(DEMO_SONG)}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white"
          >
            Demo song
          </button>
        )}
      </div>
          </header>
        </div>
      </div>
    </div>
  );
}
