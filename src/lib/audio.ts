import { create } from "zustand";

interface Osc {
  type: OscillatorType;
  mult?: number;
  amp: number;
  detune?: number;
}

export interface Patch {
  id: string;
  name: string;
  group: "keys" | "bass";
  oscs: Osc[];
  fm?: { ratio: number; index: number; decay: number };
  filter?: { start: number; end: number; time: number; q?: number; min?: number };
  env: { a: number; d: number; s: number; tail: number; r: number };
  tremolo?: { rate: number; depth: number };
  gain: number;
}

const saw = (detune: number, amp = 1): Osc => ({ type: "sawtooth", amp, detune });

export const PATCHES: Patch[] = [
  {
    id: "piano", name: "Grand Piano", group: "keys", gain: 0.28,
    oscs: [{ type: "triangle", amp: 1 }, { type: "sine", mult: 2, amp: 0.45 }, { type: "sine", mult: 3, amp: 0.18 }, { type: "sine", mult: 4, amp: 0.08 }],
    filter: { start: 7, end: 2, time: 1.2, min: 600 },
    env: { a: 0.006, d: 0.25, s: 0.35, tail: 4.5, r: 0.18 },
  },
  {
    id: "epiano", name: "Electric Piano", group: "keys", gain: 0.3,
    oscs: [{ type: "sine", amp: 1 }, { type: "sine", mult: 2, amp: 0.12 }],
    fm: { ratio: 1, index: 1.6, decay: 0.7 },
    env: { a: 0.004, d: 0.4, s: 0.4, tail: 3, r: 0.25 },
    tremolo: { rate: 4.6, depth: 0.18 },
  },
  {
    id: "organ", name: "Drawbar Organ", group: "keys", gain: 0.15,
    oscs: [{ type: "sine", amp: 0.8 }, { type: "sine", mult: 2, amp: 0.6 }, { type: "sine", mult: 3, amp: 0.35 }, { type: "sine", mult: 4, amp: 0.25 }, { type: "sine", mult: 6, amp: 0.15 }],
    env: { a: 0.012, d: 0.02, s: 1, tail: 0, r: 0.08 },
    tremolo: { rate: 6.2, depth: 0.12 },
  },
  {
    id: "clav", name: "Clavinet", group: "keys", gain: 0.24,
    oscs: [saw(0), { type: "square", mult: 2, amp: 0.25 }],
    filter: { start: 10, end: 3, time: 0.15, q: 3, min: 800 },
    env: { a: 0.002, d: 0.12, s: 0.15, tail: 0.6, r: 0.06 },
  },
  {
    id: "pad", name: "Warm Pad", group: "keys", gain: 0.11,
    oscs: [saw(-9), saw(0), saw(9)],
    filter: { start: 2, end: 5, time: 1.6, q: 1, min: 300 },
    env: { a: 0.6, d: 0.5, s: 0.8, tail: 0, r: 1.2 },
  },
  {
    id: "strings", name: "Strings", group: "keys", gain: 0.09,
    oscs: [saw(-12), saw(-4), saw(4), saw(12)],
    filter: { start: 5, end: 5, time: 0.1, min: 400 },
    env: { a: 0.35, d: 0.3, s: 0.85, tail: 0, r: 0.6 },
    tremolo: { rate: 5.2, depth: 0.08 },
  },
  {
    id: "lead", name: "Synth Lead", group: "keys", gain: 0.15,
    oscs: [saw(-6), saw(6), { type: "square", amp: 0.4 }],
    filter: { start: 8, end: 4, time: 0.3, q: 3, min: 900 },
    env: { a: 0.01, d: 0.15, s: 0.8, tail: 0, r: 0.15 },
  },
  {
    id: "pluck", name: "Pluck Synth", group: "keys", gain: 0.2,
    oscs: [saw(-5), saw(5)],
    filter: { start: 12, end: 1.5, time: 0.35, q: 2, min: 500 },
    env: { a: 0.002, d: 0.3, s: 0.15, tail: 0.5, r: 0.08 },
  },
  {
    id: "marimba", name: "Marimba", group: "keys", gain: 0.4,
    oscs: [{ type: "sine", amp: 1 }, { type: "sine", mult: 4, amp: 0.35 }],
    env: { a: 0.002, d: 0.4, s: 0.001, tail: 0, r: 0.1 },
  },
  {
    id: "bell", name: "Glass Bells", group: "keys", gain: 0.22,
    oscs: [{ type: "sine", amp: 1 }, { type: "sine", mult: 2.76, amp: 0.5 }, { type: "sine", mult: 5.4, amp: 0.3 }],
    env: { a: 0.001, d: 1.4, s: 0.001, tail: 0, r: 0.2 },
  },
  {
    id: "sub", name: "Sub Bass", group: "bass", gain: 0.5,
    oscs: [{ type: "sine", amp: 1 }, { type: "sine", mult: 2, amp: 0.15 }],
    env: { a: 0.01, d: 0.3, s: 0.8, tail: 0, r: 0.12 },
  },
  {
    id: "synthbass", name: "Synth Bass", group: "bass", gain: 0.3,
    oscs: [saw(0), { type: "sine", mult: 0.5, amp: 0.8 }],
    filter: { start: 6, end: 1.5, time: 0.25, q: 5, min: 120 },
    env: { a: 0.004, d: 0.2, s: 0.5, tail: 0, r: 0.08 },
  },
  {
    id: "fingerbass", name: "Finger Bass", group: "bass", gain: 0.5,
    oscs: [{ type: "triangle", amp: 1 }, { type: "sawtooth", amp: 0.3 }],
    filter: { start: 5, end: 1.5, time: 0.25, min: 150 },
    env: { a: 0.006, d: 0.35, s: 0.25, tail: 1.5, r: 0.1 },
  },
  {
    id: "upright", name: "Upright Bass", group: "bass", gain: 0.55,
    oscs: [{ type: "triangle", amp: 1 }, { type: "sine", mult: 2, amp: 0.3 }],
    filter: { start: 3, end: 1.2, time: 0.2, min: 120 },
    env: { a: 0.008, d: 0.25, s: 0.1, tail: 0.8, r: 0.08 },
  },
];

const byId = (id: string) => PATCHES.find((p) => p.id === id) ?? PATCHES[0];

interface SoundState {
  keys: string;
  bass: string;
  splitOn: boolean;
  split: number;
}

const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem("keystream.sound") ?? "{}") as Partial<SoundState>;
  } catch {
    return {};
  }
})();

export const useSound = create<SoundState>(() => ({
  keys: "piano",
  bass: "fingerbass",
  splitOn: false,
  split: 48,
  ...saved,
}));
useSound.subscribe((s) => localStorage.setItem("keystream.sound", JSON.stringify(s)));

interface Voice {
  amp: GainNode;
  stop: () => void;
  release: number;
}

class Synth {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private voices = new Map<number, Voice>();

  private ensure(): AudioContext {
    if (!this.ctx) {
      const ctx = new AudioContext({ latencyHint: "interactive" });
      const comp = ctx.createDynamicsCompressor();
      this.master = ctx.createGain();
      this.master.gain.value = 0.7;
      this.master.connect(comp).connect(ctx.destination);
      this.ctx = ctx;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  unlock() {
    this.ensure();
  }

  private patchFor(midi: number): Patch {
    const s = useSound.getState();
    return s.splitOn && midi < s.split ? byId(s.bass) : byId(s.keys);
  }

  noteOn(midi: number, velocity = 0.8, sustainSec?: number) {
    const ctx = this.ensure();
    this.noteOff(midi, true);
    const patch = this.patchFor(midi);
    const now = ctx.currentTime;
    const freq = 440 * 2 ** ((midi - 69) / 12);
    const { env } = patch;
    const peak = patch.gain * (0.3 + 0.7 * velocity) * (patch.group === "keys" ? 1.15 - midi / 140 : 1);

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.linearRampToValueAtTime(peak, now + env.a);
    const sus = Math.max(peak * env.s, 0.0008);
    amp.gain.exponentialRampToValueAtTime(sus, now + env.a + env.d);
    if (env.tail > 0) amp.gain.exponentialRampToValueAtTime(0.0008, now + env.a + env.d + env.tail);

    let node: AudioNode = amp;
    const nodes: AudioNode[] = [];
    if (patch.tremolo) {
      const trem = ctx.createGain();
      trem.gain.value = 1 - patch.tremolo.depth / 2;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = patch.tremolo.rate;
      lfoGain.gain.value = patch.tremolo.depth / 2;
      lfo.connect(lfoGain).connect(trem.gain);
      lfo.start(now);
      nodes.push(lfo);
      amp.connect(trem);
      node = trem;
    }
    node.connect(this.master);

    let input: AudioNode = amp;
    if (patch.filter) {
      const f = patch.filter;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.Q.value = f.q ?? 0.7;
      const min = f.min ?? 200;
      lp.frequency.setValueAtTime(Math.min(12000, Math.max(min, freq * f.start)), now);
      lp.frequency.exponentialRampToValueAtTime(Math.min(12000, Math.max(min, freq * f.end)), now + f.time);
      lp.connect(amp);
      input = lp;
    }

    const oscs: OscillatorNode[] = [];
    let modGain: GainNode | null = null;
    if (patch.fm) {
      const mod = ctx.createOscillator();
      modGain = ctx.createGain();
      mod.frequency.value = freq * patch.fm.ratio;
      modGain.gain.setValueAtTime(freq * patch.fm.index, now);
      modGain.gain.exponentialRampToValueAtTime(freq * patch.fm.index * 0.04, now + patch.fm.decay);
      mod.connect(modGain);
      mod.start(now);
      oscs.push(mod);
    }
    for (const spec of patch.oscs) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = spec.type;
      o.frequency.value = freq * (spec.mult ?? 1);
      if (spec.detune) o.detune.value = spec.detune;
      g.gain.value = spec.amp;
      if (modGain) modGain.connect(o.frequency);
      o.connect(g).connect(input);
      o.start(now);
      oscs.push(o);
    }
    const stop = () => {
      for (const o of [...oscs, ...nodes]) {
        try {
          (o as OscillatorNode).stop();
        } catch {
          /* already stopped */
        }
      }
    };
    this.voices.set(midi, { amp, stop, release: env.r });
    if (sustainSec !== undefined) setTimeout(() => this.noteOff(midi), sustainSec * 1000);
  }

  noteOff(midi: number, immediate = false) {
    const v = this.voices.get(midi);
    if (!v || !this.ctx) return;
    this.voices.delete(midi);
    const now = this.ctx.currentTime;
    const rel = immediate ? 0.02 : v.release;
    v.amp.gain.cancelScheduledValues(now);
    v.amp.gain.setValueAtTime(Math.max(v.amp.gain.value, 0.0009), now);
    v.amp.gain.exponentialRampToValueAtTime(0.0008, now + rel);
    setTimeout(v.stop, rel * 1000 + 60);
  }

  allOff() {
    [...this.voices.keys()].forEach((m) => this.noteOff(m));
  }

  preview() {
    const s = useSound.getState();
    const notes = s.splitOn ? [s.split - 12, 60, 64, 67] : [60, 64, 67];
    notes.forEach((m, i) => setTimeout(() => this.noteOn(m, 0.7, 0.7), i * 90));
  }

  click(accent: boolean) {
    const ctx = this.ensure();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = accent ? 1568 : 1046;
    g.gain.setValueAtTime(0.25, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    o.connect(g).connect(this.master);
    o.start(now);
    o.stop(now + 0.08);
  }
}

export const synth = new Synth();
