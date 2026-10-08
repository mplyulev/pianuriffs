import { create } from "zustand";

export interface NoteEvent {
  midi: number;
  velocity: number;
  time: number;
}

type Listener = (e: NoteEvent, on: boolean) => void;

const listeners = new Set<Listener>();
export const onNote = (fn: Listener) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const emitNote = (midi: number, velocity: number, time: number, on: boolean) =>
  listeners.forEach((l) => l({ midi, velocity, time }, on));

interface MidiState {
  supported: boolean;
  status: "idle" | "ready" | "denied";
  inputs: string[];
}

export const useMidi = create<MidiState>(() => ({
  supported: typeof navigator !== "undefined" && "requestMIDIAccess" in navigator,
  status: "idle",
  inputs: [],
}));

function handle(e: WebMidi.MIDIMessageEvent) {
  const [s, d1, d2] = e.data;
  const cmd = s & 0xf0;
  if (cmd === 0x90 && d2 > 0) emitNote(d1, d2 / 127, e.timeStamp, true);
  else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) emitNote(d1, 0, e.timeStamp, false);
}

export async function connectMidi() {
  if (!useMidi.getState().supported) return;
  try {
    const access = await navigator.requestMIDIAccess();
    const refresh = () => {
      const names: string[] = [];
      access.inputs.forEach((input) => {
        names.push(input.name ?? "MIDI device");
        input.onmidimessage = handle;
      });
      useMidi.setState({ status: "ready", inputs: names });
    };
    access.onstatechange = refresh;
    refresh();
  } catch {
    useMidi.setState({ status: "denied" });
  }
}

const KEYMAP: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
  k: 12, o: 13, l: 14, p: 15, ";": 16,
};

export const useKeyboardOctave = create<{ octave: number }>(() => ({ octave: 4 }));

export function installComputerKeyboard() {
  const down = new Map<string, number>();
  const kd = (e: KeyboardEvent) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement;
    if (t.tagName === "INPUT" || t.tagName === "SELECT") return;
    const k = e.key.toLowerCase();
    if (k === "z" || k === "x") {
      useKeyboardOctave.setState((s) => ({
        octave: Math.min(7, Math.max(1, s.octave + (k === "x" ? 1 : -1))),
      }));
      return;
    }
    const off = KEYMAP[k];
    if (off === undefined) return;
    const midi = 12 * (useKeyboardOctave.getState().octave + 1) + off;
    down.set(k, midi);
    emitNote(midi, 0.75, e.timeStamp, true);
  };
  const ku = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    const midi = down.get(k);
    if (midi === undefined) return;
    down.delete(k);
    emitNote(midi, 0, e.timeStamp, false);
  };
  window.addEventListener("keydown", kd);
  window.addEventListener("keyup", ku);
  return () => {
    window.removeEventListener("keydown", kd);
    window.removeEventListener("keyup", ku);
  };
}
