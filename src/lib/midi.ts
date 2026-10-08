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
  detail: string;
  framed: boolean;
  lastNote: number | null;
}

const framed = typeof window !== "undefined" && window.parent !== window;

export const useMidi = create<MidiState>(() => ({
  supported: typeof navigator !== "undefined" && "requestMIDIAccess" in navigator,
  status: typeof navigator !== "undefined" && "requestMIDIAccess" in navigator ? "idle" : "unsupported",
  inputs: [],
  detail: "",
  framed,
  lastNote: null,
}));

type Access = Awaited<ReturnType<Navigator["requestMIDIAccess"]>>;
let access: Access | null = null;

function handle(e: Event) {
  const data = (e as MIDIMessageEvent).data;
  if (!data || data.length < 2) return;
  const s = data[0];
  const d1 = data[1];
  const d2 = data.length > 2 ? data[2] : 0;
  const cmd = s & 0xf0;
  const time = (e as MIDIMessageEvent).timeStamp || performance.now();
  if (cmd === 0x90 && d2 > 0) {
    emitNote(d1, d2 / 127, time, true);
    useMidi.setState({ lastNote: d1 });
  } else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) {
    emitNote(d1, 0, time, false);
  }
}

async function bindInputs(midi: Access) {
  const names: string[] = [];
  for (const input of midi.inputs.values()) {
    try {
      await input.open();
    } catch {
      /* some ports refuse open() but still send */
    }
    input.onmidimessage = handle;
    input.addEventListener("midimessage", handle);
    names.push(input.name || input.manufacturer || input.id || "MIDI keyboard");
  }
  useMidi.setState({
    status: "ready",
    inputs: names,
    detail: names.length
      ? `Listening on ${names.join(", ")}. Play a key.`
      : "MIDI is allowed. Plug in the keyboard, then click Connect MIDI again.",
  });
}

/** Call this first thing in a click/pointerdown handler. Do not await anything before it. */
export function connectMidi(): Promise<boolean> {
  if (!navigator.requestMIDIAccess) {
    useMidi.setState({
      status: "unsupported",
      detail: "This browser has no Web MIDI. Use Chrome or Edge on http://127.0.0.1:3000",
    });
    return Promise.resolve(false);
  }
  const pending = access ? Promise.resolve(access) : navigator.requestMIDIAccess();
  useMidi.setState({
    status: "prompt",
    detail: "Look at the top of Chrome, under the URL, next to the lock — Allow is there, not in Windows.",
  });
  return pending
    .then(async (midi) => {
      access = midi;
      midi.onstatechange = () => {
        void bindInputs(midi);
      };
      await bindInputs(midi);
      return true;
    })
    .catch((err: unknown) => {
      const name = err instanceof DOMException ? err.name : "";
      const message = err instanceof Error ? err.message : "MIDI permission was blocked";
      const framedNow = window.parent !== window;
      const hint = framedNow
        ? "Open http://127.0.0.1:3000 in a normal Chrome window, not the Cursor preview."
        : name === "SecurityError" || name === "NotAllowedError"
          ? "Chrome hid the popup. Click the lock beside the URL → Site settings → MIDI devices → Allow."
          : message;
      access = null;
      useMidi.setState({ status: "denied", inputs: [], detail: `${name || "Error"}: ${hint}`, framed: framedNow });
      return false;
    });
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
