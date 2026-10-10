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
    env: { a: 0.008, d: 0.25, s: 0.35, tail: 4.5, r: 0.22 },
  },
  {
    id: "epiano", name: "Electric Piano", group: "keys", gain: 0.3,
    oscs: [{ type: "sine", amp: 1 }, { type: "sine", mult: 2, amp: 0.12 }],
    fm: { ratio: 1, index: 1.6, decay: 0.7 },
    env: { a: 0.008, d: 0.4, s: 0.4, tail: 3, r: 0.28 },
    tremolo: { rate: 4.6, depth: 0.18 },
  },
  {
    id: "organ", name: "Drawbar Organ", group: "keys", gain: 0.15,
    oscs: [{ type: "sine", amp: 0.8 }, { type: "sine", mult: 2, amp: 0.6 }, { type: "sine", mult: 3, amp: 0.35 }, { type: "sine", mult: 4, amp: 0.25 }, { type: "sine", mult: 6, amp: 0.15 }],
    env: { a: 0.012, d: 0.02, s: 1, tail: 0, r: 0.12 },
    tremolo: { rate: 6.2, depth: 0.12 },
  },
  {
    id: "clav", name: "Clavinet", group: "keys", gain: 0.22,
    oscs: [saw(0), { type: "square", mult: 2, amp: 0.25 }],
    filter: { start: 10, end: 3, time: 0.15, q: 2.2, min: 800 },
    env: { a: 0.008, d: 0.12, s: 0.15, tail: 0.6, r: 0.1 },
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
    env: { a: 0.012, d: 0.15, s: 0.8, tail: 0, r: 0.18 },
  },
  {
    id: "pluck", name: "Pluck Synth", group: "keys", gain: 0.2,
    oscs: [saw(-5), saw(5)],
    filter: { start: 12, end: 1.5, time: 0.35, q: 2, min: 500 },
    env: { a: 0.008, d: 0.3, s: 0.15, tail: 0.5, r: 0.12 },
  },
  {
    id: "marimba", name: "Marimba", group: "keys", gain: 0.4,
    oscs: [{ type: "sine", amp: 1 }, { type: "sine", mult: 4, amp: 0.35 }],
    env: { a: 0.006, d: 0.4, s: 0.001, tail: 0, r: 0.12 },
  },
  {
    id: "bell", name: "Glass Bells", group: "keys", gain: 0.22,
    oscs: [{ type: "sine", amp: 1 }, { type: "sine", mult: 2.76, amp: 0.5 }, { type: "sine", mult: 5.4, amp: 0.3 }],
    env: { a: 0.006, d: 1.4, s: 0.001, tail: 0, r: 0.25 },
  },
  {
    id: "sub", name: "Sub Bass", group: "bass", gain: 0.5,
    oscs: [{ type: "sine", amp: 1 }, { type: "sine", mult: 2, amp: 0.15 }],
    env: { a: 0.012, d: 0.3, s: 0.8, tail: 0, r: 0.16 },
  },
  {
    id: "synthbass", name: "Synth Bass", group: "bass", gain: 0.3,
    oscs: [saw(0), { type: "sine", mult: 0.5, amp: 0.8 }],
    filter: { start: 6, end: 1.5, time: 0.25, q: 5, min: 120 },
    env: { a: 0.01, d: 0.2, s: 0.5, tail: 0, r: 0.12 },
  },
  {
    id: "fingerbass", name: "Finger Bass", group: "bass", gain: 0.5,
    oscs: [{ type: "triangle", amp: 1 }, { type: "sawtooth", amp: 0.3 }],
    filter: { start: 5, end: 1.5, time: 0.25, min: 150 },
    env: { a: 0.01, d: 0.35, s: 0.25, tail: 1.5, r: 0.14 },
  },
  {
    id: "upright", name: "Upright Bass", group: "bass", gain: 0.55,
    oscs: [{ type: "triangle", amp: 1 }, { type: "sine", mult: 2, amp: 0.3 }],
    filter: { start: 3, end: 1.2, time: 0.2, min: 120 },
    env: { a: 0.01, d: 0.25, s: 0.1, tail: 0.8, r: 0.12 },
  },
];

const byId = (id: string) => PATCHES.find((p) => p.id === id) ?? PATCHES[0];
const SILENT = 0.0001;
const MAX_VOICES = 48;

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
  id: number;
  midi: number;
  live: boolean;
  end: number;
  amp: GainNode;
  oscs: OscillatorNode[];
  release: number;
}

class Synth {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private voices: Voice[] = [];
  private nextId = 1;

  private ensure(): AudioContext {
    if (!this.ctx) {
      const ctx = new AudioContext({ latencyHint: "interactive" });
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 12;
      comp.ratio.value = 4;
      comp.attack.value = 0.008;
      comp.release.value = 0.12;
      this.master = ctx.createGain();
      this.master.gain.value = 0.65;
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

  private prune() {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    this.voices = this.voices.filter((v) => v.live || v.end > now);
    while (this.voices.length > MAX_VOICES) {
      const oldest = this.voices.find((v) => !v.live) ?? this.voices[0];
      this.fadeNow(oldest, 0.04);
    }
  }

  private fadeNow(v: Voice, rel: number) {
    if (!this.ctx) return;
    const time = this.ctx.currentTime;
    v.live = false;
    const g = v.amp.gain;
    try {
      g.cancelAndHoldAtTime(time);
    } catch {
      g.cancelScheduledValues(time);
      g.setValueAtTime(Math.max(g.value, SILENT), time);
    }
    g.exponentialRampToValueAtTime(SILENT, time + Math.max(rel, 0.03));
    const stopAt = time + Math.max(rel, 0.03) + 0.04;
    v.end = stopAt;
    for (const o of v.oscs) {
      try {
        o.stop(stopAt);
      } catch {
        /* already stopped */
      }
    }
  }

  noteOn(midi: number, velocity = 0.8, sustainSec?: number) {
    const ctx = this.ensure();
    if (ctx.state !== "running") console.warn("[midi] audio context", ctx.state);
    this.prune();
    const patch = this.patchFor(midi);
    const now = ctx.currentTime;
    const freq = 440 * 2 ** ((midi - 69) / 12);
    const { env } = patch;
    const attack = Math.max(env.a, 0.008);
    const peak = patch.gain * (0.3 + 0.7 * velocity) * (patch.group === "keys" ? 1.15 - midi / 140 : 1);
    const sus = Math.max(peak * env.s, SILENT);

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(SILENT, now);
    amp.gain.linearRampToValueAtTime(Math.max(peak, SILENT), now + attack);
    amp.gain.exponentialRampToValueAtTime(sus, now + attack + Math.max(env.d, 0.02));

    let out: AudioNode = amp;
    const oscs: OscillatorNode[] = [];
    if (patch.tremolo) {
      const trem = ctx.createGain();
      trem.gain.value = 1 - patch.tremolo.depth / 2;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = patch.tremolo.rate;
      lfoGain.gain.value = patch.tremolo.depth / 2;
      lfo.connect(lfoGain).connect(trem.gain);
      lfo.start(now);
      oscs.push(lfo);
      amp.connect(trem);
      out = trem;
    }
    out.connect(this.master);

    let input: AudioNode = amp;
    if (patch.filter) {
      const f = patch.filter;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.Q.value = f.q ?? 0.7;
      const min = f.min ?? 200;
      const start = Math.min(12000, Math.max(min, freq * f.start));
      const end = Math.min(12000, Math.max(min, freq * f.end));
      lp.frequency.setValueAtTime(start, now);
      if (Math.abs(end - start) > 1) lp.frequency.exponentialRampToValueAtTime(end, now + Math.max(f.time, 0.02));
      lp.connect(amp);
      input = lp;
    }

    let modGain: GainNode | null = null;
    if (patch.fm) {
      const mod = ctx.createOscillator();
      modGain = ctx.createGain();
      mod.frequency.value = freq * patch.fm.ratio;
      modGain.gain.setValueAtTime(freq * patch.fm.index, now);
      modGain.gain.exponentialRampToValueAtTime(Math.max(freq * patch.fm.index * 0.04, SILENT), now + patch.fm.decay);
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

    const release = Math.max(env.r, 0.05);
    const v: Voice = { id: this.nextId++, midi, live: true, end: now + 30, amp, oscs, release };
    this.voices.push(v);

    if (sustainSec !== undefined) {
      const relAt = now + Math.max(sustainSec, attack + 0.03);
      amp.gain.setValueAtTime(sus, relAt);
      amp.gain.exponentialRampToValueAtTime(SILENT, relAt + release);
      const stopAt = relAt + release + 0.05;
      v.live = false;
      v.end = stopAt;
      for (const o of oscs) o.stop(stopAt);
    } else if (env.tail > 0) {
      amp.gain.exponentialRampToValueAtTime(SILENT, now + attack + env.d + env.tail);
      const stopAt = now + attack + env.d + env.tail + 0.05;
      v.live = false;
      v.end = stopAt;
      for (const o of oscs) o.stop(stopAt);
    }
  }

  noteOff(midi: number) {
    for (let i = this.voices.length - 1; i >= 0; i--) {
      const v = this.voices[i];
      if (v.midi === midi && v.live) {
        this.fadeNow(v, v.release);
        break;
      }
    }
  }

  allOff() {
    for (const v of [...this.voices]) this.fadeNow(v, 0.05);
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
    g.gain.setValueAtTime(SILENT, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.004);
    g.gain.exponentialRampToValueAtTime(SILENT, now + 0.06);
    o.connect(g).connect(this.master);
    o.start(now);
    o.stop(now + 0.08);
  }
}

export const synth = new Synth();
