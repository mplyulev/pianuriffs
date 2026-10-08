import { useRef, useState } from "react";
import { connectMidi, useMidi, useKeyboardOctave } from "../lib/midi";
import { synth } from "../lib/audio";
import { useEngine } from "../lib/engine";
import { DEMO_SONG, parseMidiFile } from "../lib/song";
import { setLibraryOpen } from "../lib/ui";
import { SoundPanel } from "./SoundPanel";

export function TopBar() {
  const midi = useMidi();
  const octave = useKeyboardOctave((s) => s.octave);
  const song = useEngine((s) => s.song);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

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
    ? midi.lastNote !== null
      ? `${midi.inputs[0]} · note ${midi.lastNote}`
      : midi.inputs[0]
    : midi.status === "unsupported"
      ? "No Web MIDI — use computer keys"
      : midi.status === "denied"
        ? "MIDI blocked — click Connect MIDI"
        : midi.status === "prompt"
          ? "Use the browser Allow button"
          : midi.status === "ready"
            ? "MIDI on — plug in a keyboard"
            : "Connect MIDI";

  return (
    <header className="glass pointer-events-auto flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-pink-500 text-lg font-extrabold text-white shadow-lg shadow-indigo-500/30">
          K
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight">{song.title}</div>
          <div className="text-xs text-white/45">
            {song.composer} · {song.bpm} BPM
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {error && <span className="text-xs text-rose-300">{error}</span>}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            synth.unlock();
            void connectMidi();
          }}
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            connected ? "bg-emerald-400/15 text-emerald-200" : "bg-indigo-500/80 text-white hover:bg-indigo-400"
          }`}
          title="Click once, then press Allow in the Chrome dialog. Computer keys: A S D F G H J K L ;  black: W E T Y U O P. Z/X change octave."
        >
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-white/70"}`} />
          {connected ? label : midi.status === "prompt" ? "Waiting for Allow…" : "Connect MIDI"}
          <span className="text-white/40">· keys C{octave}</span>
        </button>
        {(midi.detail || midi.status === "denied") && (
          <span className="max-w-[24rem] text-[11px] leading-snug text-white/55">{midi.detail}</span>
        )}
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
