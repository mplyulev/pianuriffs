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

function handle(e: Event) {
  const data = (e as MIDIMessageEvent).data;
  if (!data || data.length < 2) return;
  const s = data[0];
  const d1 = data[1];
  const d2 = data.length > 2 ? data[2] : 0;
  const cmd = s & 0xf0;
  const time = performance.now();
  if (cmd === 0x90 && d2 > 0) emitNote(d1, d2 / 127, time, true);
  else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) emitNote(d1, 0, time, false);
}

const AUDIO_IFACE = /focusrite|scarlett|clarett|realtek|voicemeeter|loopbe|loopmidi/i;

function isAudioInterface(input: MIDIInput) {
  return AUDIO_IFACE.test(`${input.name ?? ""} ${input.manufacturer ?? ""}`);
}

let access: MIDIAccess | null = null;
const openInputs: MIDIInput[] = [];
let connecting: Promise<void> | null = null;
let binding = false;
let bindAgain = false;

async function bindInputs(midi: MIDIAccess) {
  if (binding) {
    bindAgain = true;
    return;
  }
  binding = true;
  try {
    do {
      bindAgain = false;
      const live: MIDIInput[] = [];
      midi.inputs.forEach((input) => {
        if (input.state !== "disconnected") live.push(input);
      });
      const keys = live.filter((input) => !isAudioInterface(input));
      const chosen = keys.length ? keys : live;
      openInputs.length = 0;
      const names: string[] = [];
      for (const input of chosen) {
        openInputs.push(input);
        try {
          await input.open();
        } catch {
          /* port may already be open */
        }
        input.onmidimessage = handle;
        names.push(input.name ?? input.manufacturer ?? "MIDI keyboard");
      }
      useMidi.setState({ status: "ready", inputs: names });
    } while (bindAgain);
  } finally {
    binding = false;
  }
}

export function connectMidi(): Promise<void> {
  if (!useMidi.getState().supported) return Promise.resolve();
  if (connecting) return connecting;
  connecting = (async () => {
    try {
      if (!access) {
        access = await navigator.requestMIDIAccess({ sysex: false });
        access.onstatechange = () => {
          if (access) void bindInputs(access);
        };
      }
      await bindInputs(access);
    } catch {
      access = null;
      useMidi.setState({ status: "denied", inputs: [] });
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
