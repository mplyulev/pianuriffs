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
  debug: string[];
}

export const useMidi = create<MidiState>(() => ({
  supported: typeof navigator !== "undefined" && "requestMIDIAccess" in navigator,
  status: "idle",
  inputs: [],
  debug: [],
}));

const debugLines: string[] = [];

function log(message: string, extra?: unknown) {
  const line = extra === undefined ? message : `${message} ${typeof extra === "string" ? extra : JSON.stringify(extra)}`;
  console.log("[midi]", message, extra ?? "");
  debugLines.push(line);
  if (debugLines.length > 80) debugLines.shift();
  useMidi.setState({ debug: debugLines.slice(-14) });
}

function handle(port: string, e: Event) {
  const data = (e as MIDIMessageEvent).data;
  if (!data || data.length < 1) {
    log(`empty message from ${port}`);
    return;
  }
  messages += 1;
  const s = data[0];
  const d1 = data.length > 1 ? data[1] : 0;
  const d2 = data.length > 2 ? data[2] : 0;
  const cmd = s & 0xf0;
  const time = performance.now();
  if (cmd === 0x90 && d2 > 0) {
    log(`NOTE ON ${d1} vel ${d2} ← ${port}`);
    emitNote(d1, d2 / 127, time, true);
  } else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) {
    log(`note off ${d1} ← ${port}`);
    emitNote(d1, 0, time, false);
  } else {
    const key = `${port}:${s}`;
    const n = (otherCount.get(key) ?? 0) + 1;
    otherCount.set(key, n);
    if (n <= 2) log(`non-note 0x${s.toString(16)} ${d1} ${d2} ← ${port}`);
  }
}

const otherCount = new Map<string, number>();

const AUDIO_IFACE = /focusrite|scarlett|clarett|realtek|voicemeeter|loopbe|loopmidi/i;

function isAudioInterface(input: MIDIInput) {
  return AUDIO_IFACE.test(`${input.name ?? ""} ${input.manufacturer ?? ""}`);
}

let access: MIDIAccess | null = null;
const openInputs: MIDIInput[] = [];
let connecting: Promise<void> | null = null;
let arming = false;
let messages = 0;
const resetDone = new WeakSet<MIDIInput>();

function isDawPort(input: MIDIInput) {
  return /MIDIIN\d|\bDAW\b|MCU|HUI/i.test(`${input.name ?? ""} ${input.manufacturer ?? ""}`);
}

function describe(input: MIDIInput) {
  return {
    name: input.name,
    manufacturer: input.manufacturer,
    state: input.state,
    connection: input.connection,
    id: input.id,
    audioInterface: isAudioInterface(input),
    dawPort: isDawPort(input),
  };
}

async function arm(input: MIDIInput) {
  const label = input.name ?? input.manufacturer ?? "MIDI keyboard";
  const fn = (event: Event) => handle(label, event);
  input.onmidimessage = fn;
  if (resetDone.has(input)) return;
  resetDone.add(input);
  try {
    await input.close();
    input.onmidimessage = fn;
    await input.open();
    input.onmidimessage = fn;
    log(`listening ${label}`, { connection: input.connection });
  } catch (err) {
    input.onmidimessage = fn;
    log(`could not reset ${label}`, err instanceof Error ? err.message : String(err));
  }
}

async function bindInputs(midi: MIDIAccess) {
  if (arming) return;
  arming = true;
  try {
    const live: MIDIInput[] = [];
    midi.inputs.forEach((input) => {
      if (input.state !== "disconnected") live.push(input);
    });
    log(`inputs seen: ${live.length}`, live.map(describe));
    const playable = live.filter((input) => !isAudioInterface(input) && !isDawPort(input));
    const chosen = playable.length ? playable : live.filter((input) => !isAudioInterface(input));
    for (const input of live) {
      if (chosen.includes(input)) continue;
      input.onmidimessage = null;
      try {
        await input.close();
        log(`closed ${input.name ?? "port"} (${isDawPort(input) ? "DAW port" : "audio interface"})`);
      } catch (err) {
        log(`close failed ${input.name ?? "port"}`, err instanceof Error ? err.message : String(err));
      }
    }
    openInputs.length = 0;
    const names: string[] = [];
    for (const input of chosen) {
      openInputs.push(input);
      await arm(input);
      names.push(input.name ?? input.manufacturer ?? "MIDI keyboard");
    }
    useMidi.setState({ status: "ready", inputs: names });
  } finally {
    arming = false;
  }
}

export function connectMidi(): Promise<void> {
  if (!useMidi.getState().supported) {
    log("requestMIDIAccess missing", { secure: window.isSecureContext, framed: window.parent !== window, origin: location.origin });
    return Promise.resolve();
  }
  if (connecting) return connecting;
  connecting = (async () => {
    if (!access) {
      log("connectMidi()", {
        secure: window.isSecureContext,
        framed: window.parent !== window,
        origin: location.origin,
      });
    }
    try {
      if (!access) {
        const perm = await navigator.permissions.query({ name: "midi" as PermissionName }).catch((err: unknown) => {
          log("permission query failed", err instanceof Error ? err.message : String(err));
          return null;
        });
        if (perm) log(`permission: ${perm.state}`);
      }
      if (!access) {
        log("calling requestMIDIAccess");
        access = await navigator.requestMIDIAccess({ sysex: false });
        log("requestMIDIAccess ok", { inputs: access.inputs.size, outputs: access.outputs.size });
        access.onstatechange = (event) => {
          const port = event.port;
          if (arming) return;
          log("statechange", port ? { name: port.name, type: port.type, state: port.state, connection: port.connection } : "no port");
          if (!access || !port || port.type !== "input" || port.state !== "connected") return;
          if (isAudioInterface(port as MIDIInput) || isDawPort(port as MIDIInput)) return;
          if ((port as MIDIInput).onmidimessage) return;
          void bindInputs(access);
        };
        let heartbeats = 0;
        window.setInterval(() => {
          if (!access || messages > 0 || heartbeats >= 5) return;
          heartbeats += 1;
          const attached = openInputs.map((input) => `${input.name ?? "input"}:${input.onmidimessage ? "handler" : "NO HANDLER"}:${input.connection}`);
          log(`still no MIDI bytes. ${attached.join(" | ") || "no inputs kept"}`);
        }, 4000);
      }
      bindInputs(access);
    } catch (err) {
      access = null;
      log("requestMIDIAccess FAILED", err instanceof Error ? `${err.name}: ${err.message}` : String(err));
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
