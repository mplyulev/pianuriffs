import { useEffect, useRef, useState } from "react";
import { useMidi, useKeyboardOctave } from "../lib/midi";
import { useEngine } from "../lib/engine";
import { DEMO_SONG, parseMidiFile } from "../lib/song";
import { setLibraryOpen } from "../lib/ui";
import { SoundPanel } from "./SoundPanel";
import { CoffeeButton } from "./CoffeeButton";
import { Stats } from "./Stats";

export function TopBar() {
  const midi = useMidi();
  const octave = useKeyboardOctave((s) => s.octave);
  const song = useEngine((s) => s.song);
  const playing = useEngine((s) => s.playing);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  const [idle, setIdle] = useState(false);
  const hideStats = playing && idle && !hover;

  useEffect(() => {
    if (!playing) {
      setIdle(false);
      return;
    }
    let timer = window.setTimeout(() => setIdle(true), 1000);
    const poke = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), 1000);
    };
    window.addEventListener("pointermove", poke);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", poke);
    };
  }, [playing]);

  const load = async (f?: File) => {
    if (!f) return;
    try {
      const parsed = await parseMidiFile(f);
      useEngine.setState({ song: parsed, playing: false, loop: null });
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
    <header
      className="glass pointer-events-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5 rounded-2xl px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-pink-500 text-lg font-extrabold text-white shadow-lg shadow-indigo-500/30">
          K
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-bold tracking-tight">{song.title}</div>
          <div className="truncate text-xs text-white/45">
            {song.composer} · {song.bpm} BPM
          </div>
        </div>
      </div>

      <div
        className={`col-span-2 row-start-2 justify-self-center overflow-hidden transition-all duration-300 sm:col-span-1 sm:col-start-2 sm:row-start-1 ${
          hideStats ? "max-h-0 max-w-0 opacity-0" : "max-h-10 max-w-[24rem] opacity-100"
        }`}
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
        <button
          onClick={() => setLibraryOpen(true)}
          className="rounded-lg bg-gradient-to-r from-cyan-400/90 to-indigo-500/90 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110"
        >
          Library
        </button>
        <input ref={fileRef} type="file" accept=".mid,.midi" hidden onChange={(e) => load(e.target.files?.[0])} />
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-lg bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/15"
        >
          Import MIDI
        </button>
        {song !== DEMO_SONG && (
          <button
            onClick={() => useEngine.setState({ song: DEMO_SONG, playing: false, loop: null })}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white"
          >
            Demo song
          </button>
        )}
      </div>
    </header>
  );
}
