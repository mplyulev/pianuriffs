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

export type MidiStatus = "idle" | "prompt" | "ready" | "denied" | "unsupported";

interface MidiState {
  supported: boolean;
  status: MidiStatus;
  inputs: string[];
}

export const useMidi = create<MidiState>(() => ({
  supported: typeof navigator !== "undefined" && "requestMIDIAccess" in navigator,
  status: typeof navigator !== "undefined" && "requestMIDIAccess" in navigator ? "idle" : "unsupported",
  inputs: [],
}));

let access: MIDIAccess | null = null;
let connecting: Promise<boolean> | null = null;

function handle(e: Event) {
  const data = (e as MIDIMessageEvent).data;
  if (!data || data.length < 2) return;
  const s = data[0];
  const d1 = data[1];
  const d2 = data.length > 2 ? data[2] : 0;
  const cmd = s & 0xf0;
  const time = (e as MIDIMessageEvent).timeStamp || performance.now();
  if (cmd === 0x90 && d2 > 0) emitNote(d1, d2 / 127, time, true);
  else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) emitNote(d1, 0, time, false);
}

function bindInputs(midi: MIDIAccess) {
  const names: string[] = [];
  midi.inputs.forEach((input) => {
    names.push(input.name || input.manufacturer || "MIDI keyboard");
    input.onmidimessage = handle;
  });
  useMidi.setState({ status: "ready", inputs: names });
}

export async function connectMidi(): Promise<boolean> {
  if (!useMidi.getState().supported) {
    useMidi.setState({ status: "unsupported" });
    return false;
  }
  if (access) {
    bindInputs(access);
    return true;
  }
  if (connecting) return connecting;
  useMidi.setState({ status: "prompt" });
  connecting = (async () => {
    try {
      const midi = await navigator.requestMIDIAccess({ sysex: false });
      access = midi;
      midi.onstatechange = () => bindInputs(midi);
      bindInputs(midi);
      return true;
    } catch {
      useMidi.setState({ status: "denied", inputs: [] });
      return false;
    } finally {
      connecting = null;
    }
  })();
  return connecting;
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
