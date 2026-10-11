import { create } from "zustand";
import { PROGRAMS, type SampleId, type SampleProgram, type SampleZone } from "./sampleBank";

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
  sample?: SampleId;
  oscs: Osc[];
  fm?: { ratio: number; index: number; decay: number };
  filter?: { start: number; end: number; time: number; q?: number; min?: number };
  env: { a: number; d: number; s: number; tail: number; r: number };
  tremolo?: { rate: number; depth: number };
  gain: number;
}

const saw = (detune: number, amp = 1): Osc => ({ type: "sawtooth", amp, detune });

const pianoOsc = {
  oscs: [
    { type: "triangle" as const, amp: 1 },
    { type: "sine" as const, mult: 2, amp: 0.45 },
    { type: "sine" as const, mult: 3, amp: 0.18 },
    { type: "sine" as const, mult: 4, amp: 0.08 },
  ],
  filter: { start: 7, end: 2, time: 1.2, min: 600 },
  env: { a: 0.008, d: 0.25, s: 0.35, tail: 4.5, r: 0.22 },
};

export const PATCHES: Patch[] = [
  { id: "piano", name: "Grand Piano", group: "keys", gain: 0.28, sample: "piano", ...pianoOsc },
  { id: "synthpiano", name: "Synth Piano", group: "keys", gain: 0.28, ...pianoOsc },
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
    id: "fingerbass", name: "Finger Bass", group: "bass", gain: 0.5, sample: "finger",
    oscs: [{ type: "triangle", amp: 1 }, { type: "sawtooth", amp: 0.3 }],
    filter: { start: 5, end: 1.5, time: 0.25, min: 150 },
    env: { a: 0.01, d: 0.35, s: 0.25, tail: 1.5, r: 0.14 },
  },
  {
    id: "pickbass", name: "Picked Bass", group: "bass", gain: 0.48, sample: "pick",
    oscs: [{ type: "triangle", amp: 1 }, { type: "sawtooth", amp: 0.45 }],
    filter: { start: 8, end: 2, time: 0.18, min: 180 },
    env: { a: 0.008, d: 0.22, s: 0.2, tail: 1.2, r: 0.12 },
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

export const useSamples = create<{ pending: Record<SampleId, number> }>(() => ({
  pending: { piano: 0, finger: 0, pick: 0 },
}));

function sampleUrl(file: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${base.endsWith("/") ? "" : "/"}${file}`;
}

function zoneFor(program: SampleProgram, midi: number): SampleZone {
  for (const zone of program.zones) {
    if (midi >= zone.lo && midi <= zone.hi) return zone;
  }
  if (midi < program.zones[0].lo) return program.zones[0];
  return program.zones[program.zones.length - 1];
}

async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  if (!items.length) return;
  let cursor = 0;
  const n = Math.min(limit, items.length);
  await Promise.all(
    Array.from({ length: n }, async () => {
      for (;;) {
        const i = cursor++;
        if (i >= items.length) return;
        await fn(items[i]);
      }
    }),
  );
}

/** Fetches compressed recordings up front and decodes them once an AudioContext exists. */
class SampleCache {
  ctx: AudioContext | null = null;
  private compressed = new Map<string, ArrayBuffer>();
  private decoded = new Map<string, AudioBuffer>();
  private failed = new Set<string>();
  private attempts = new Map<string, number>();
  private fetching = new Map<string, Promise<void>>();
  private queue: string[] = [];
  private queued = new Set<string>();
  private urgent = new Set<string>();
  private active = 0;
  private started = new Set<SampleId>();

  private noteUrls(id: SampleId): string[] {
    const urls: string[] = [];
    for (const zone of PROGRAMS[id].zones) {
      for (const layer of zone.layers) urls.push(sampleUrl(layer.file));
    }
    return urls;
  }

  private releaseUrls(id: SampleId): string[] {
    return PROGRAMS[id].releases.map(sampleUrl);
  }

  get(url: string): AudioBuffer | undefined {
    return this.decoded.get(url);
  }

  ensure(id: SampleId) {
    if (this.started.has(id)) {
      this.pump();
      return;
    }
    this.started.add(id);
    this.refresh();
    const notes = this.noteUrls(id);
    const rels = this.releaseUrls(id);
    void this.fetchMany(notes).then(() => this.fetchMany(rels));
  }

  /** Decode this layer before the rest of the queue when a note asks for it. */
  prioritize(url: string) {
    this.urgent.add(url);
    this.enqueue(url, true);
  }

  private async fetchMany(urls: string[]) {
    const pending = urls.filter((url) => !this.decoded.has(url) && !this.compressed.has(url) && !this.failed.has(url));
    await pool(pending, 6, (url) => this.fetchOne(url));
    this.pump();
  }

  private async fetchOne(url: string) {
    const existing = this.fetching.get(url);
    if (existing) return existing;
    const job = (async () => {
      for (let n = (this.attempts.get(url) ?? 0) + 1; n <= 4; n++) {
        this.attempts.set(url, n);
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(String(res.status));
          const buf = await res.arrayBuffer();
          if (buf.byteLength < 32) throw new Error("empty");
          this.failed.delete(url);
          this.compressed.set(url, buf);
          this.enqueue(url, false);
          return;
        } catch {
          if (n >= 4) this.failed.add(url);
          else await new Promise((r) => setTimeout(r, 200 * n));
        }
      }
      this.refresh();
    })();
    this.fetching.set(url, job);
    try {
      await job;
    } finally {
      this.fetching.delete(url);
    }
  }

  private enqueue(url: string, front: boolean) {
    if (this.decoded.has(url) || this.failed.has(url) || !this.compressed.has(url)) return;
    const goFront = front || this.urgent.has(url);
    if (this.queued.has(url)) {
      if (!goFront) return;
      const i = this.queue.indexOf(url);
      if (i > 0) {
        this.queue.splice(i, 1);
        this.queue.unshift(url);
      }
      this.pump();
      return;
    }
    this.queued.add(url);
    if (goFront) this.queue.unshift(url);
    else this.queue.push(url);
    this.pump();
  }

  pump() {
    const ctx = this.ctx;
    if (!ctx) return;
    while (this.active < 4 && this.queue.length) {
      const url = this.queue.shift()!;
      this.queued.delete(url);
      if (this.decoded.has(url) || this.failed.has(url)) continue;
      const raw = this.compressed.get(url);
      if (!raw) continue;
      this.active++;
      void ctx
        .decodeAudioData(raw.slice(0))
        .then((buf) => {
          this.decoded.set(url, buf);
          this.compressed.delete(url);
          this.urgent.delete(url);
        })
        .catch(() => {
          this.failed.add(url);
          this.compressed.delete(url);
          console.warn("[audio] sample decode failed", url);
        })
        .finally(() => {
          this.active--;
          this.refresh();
          this.pump();
        });
    }
  }

  private refresh() {
    const pending: Record<SampleId, number> = { piano: 0, finger: 0, pick: 0 };
    for (const id of this.started) {
      let n = 0;
      for (const url of this.noteUrls(id)) {
        if (!this.decoded.has(url) && !this.failed.has(url)) n++;
      }
      pending[id] = n;
    }
    useSamples.setState({ pending });
  }
}

const cache = new SampleCache();

interface Voice {
  id: number;
  midi: number;
  live: boolean;
  start: number;
  end: number;
  amp: GainNode;
  oscs: AudioScheduledSourceNode[];
  release: number;
  velocity: number;
  /** Piano recordings play a quiet hammer-release sample when the player lets go. */
  hammerOnRelease: boolean;
}

const CLIP = (() => {
  const n = 2048;
  const curve = new Float32Array(n);
  const drive = 1.5;
  const norm = Math.tanh(drive);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(drive * x) / norm;
  }
  return curve;
})();

class Synth {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private voices: Voice[] = [];
  private nextId = 1;

  private ensure(): AudioContext {
    if (!this.ctx) {
      const ctx = new AudioContext({ latencyHint: "interactive" });
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -10;
      comp.knee.value = 12;
      comp.ratio.value = 6;
      comp.attack.value = 0.003;
      comp.release.value = 0.2;
      const shaper = ctx.createWaveShaper();
      shaper.curve = CLIP;
      shaper.oversample = "2x";
      this.master = ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(comp).connect(shaper).connect(ctx.destination);
      this.ctx = ctx;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    cache.ctx = this.ctx;
    return this.ctx;
  }

  unlock() {
    this.ensure();
    this.warm();
  }

  /** Fetch and decode the recordings for the instruments the player currently has selected. */
  warm() {
    cache.ctx = this.ctx;
    const s = useSound.getState();
    const ids = new Set<SampleId>();
    const key = byId(s.keys);
    const bass = byId(s.bass);
    if (key.sample) ids.add(key.sample);
    if (s.splitOn && bass.sample) ids.add(bass.sample);
    for (const id of ids) cache.ensure(id);
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
      const i = this.voices.indexOf(oldest);
      if (i >= 0) this.voices.splice(i, 1);
    }
  }

  /** Exponential when the change is real; a flat exponential ramp throws and clicks. */
  private glide(param: AudioParam, from: number, to: number, time: number) {
    const a = Math.max(from, SILENT);
    const b = Math.max(to, SILENT);
    if (b > a * 0.98 && b < a * 1.02) param.linearRampToValueAtTime(b, time);
    else param.exponentialRampToValueAtTime(b, time);
  }

  private stopOscs(v: Voice, when: number) {
    const t = Math.max(when, v.start);
    for (const o of v.oscs) {
      try {
        o.stop(t);
      } catch {
        /* stop() can only be scheduled once */
      }
    }
  }

  private kill(v: Voice, time: number) {
    v.live = false;
    v.end = time;
    try {
      v.amp.gain.cancelScheduledValues(time);
      v.amp.gain.setValueAtTime(SILENT, time);
    } catch {
      /* node already closed */
    }
    this.stopOscs(v, time);
  }

  private fadeNow(v: Voice, rel: number) {
    if (!this.ctx) return;
    const time = this.ctx.currentTime;
    if (v.start > time + 0.002) {
      this.kill(v, time);
      return;
    }
    v.live = false;
    const g = v.amp.gain;
    let held = SILENT;
    try {
      g.cancelAndHoldAtTime(time);
      held = Math.max(g.value, SILENT);
    } catch {
      g.cancelScheduledValues(time);
      held = Math.max(g.value, SILENT);
      g.setValueAtTime(held, time);
    }
    const stopAt = time + Math.max(rel, 0.02);
    try {
      if (held <= SILENT * 2) g.linearRampToValueAtTime(SILENT, stopAt);
      else g.exponentialRampToValueAtTime(SILENT, stopAt);
    } catch {
      try {
        g.setValueAtTime(Math.max(held, SILENT), time);
        g.linearRampToValueAtTime(SILENT, stopAt);
      } catch {
        /* gain is already silent */
      }
    }
    v.end = stopAt + 0.03;
    this.stopOscs(v, v.end);
  }

  /** A second voice on the same key beats against the first and crackles. Crossfade it out. */
  private chokeSame(midi: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const time = ctx.currentTime;
    for (const v of this.voices) {
      if (v.midi !== midi) continue;
      if (!v.live && v.end <= time) continue;
      if (v.start > time + 0.002) this.kill(v, time);
      else this.fadeNow(v, 0.018);
    }
  }

  /**
   * Play a recorded note. Returns false when that layer is not decoded yet so the
   * oscillator patch can cover the gap. A decoded sibling layer is used first.
   */
  private playSample(id: SampleId, midi: number, velocity: number, sustainSec?: number): boolean {
    const ctx = this.ctx;
    if (!ctx) return false;
    const program = PROGRAMS[id];
    const zone = zoneFor(program, midi);
    const vel = Math.max(1, Math.min(127, Math.round(velocity * 127)));
    const layers = [...zone.layers].sort((a, b) => {
      const exact = (layer: { lo: number; hi: number }) => (vel >= layer.lo && vel <= layer.hi ? 0 : 1);
      const byExact = exact(a) - exact(b);
      if (byExact) return byExact;
      const center = (layer: { lo: number; hi: number }) => (layer.lo + layer.hi) / 2;
      return Math.abs(center(a) - vel) - Math.abs(center(b) - vel);
    });
    let buffer: AudioBuffer | undefined;
    let offset = 0;
    let missing: string | null = null;
    for (const layer of layers) {
      const url = sampleUrl(layer.file);
      const decoded = cache.get(url);
      if (decoded) {
        buffer = decoded;
        offset = layer.offset;
        break;
      }
      if (!missing) missing = url;
    }
    if (missing) cache.prioritize(missing);
    if (!buffer) {
      cache.ensure(id);
      return false;
    }
    const rate = 2 ** ((midi - zone.root) / 12);
    const startAt = Math.min(Math.max(0, offset), Math.max(0, buffer.duration - 0.01));
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const amp = ctx.createGain();
    const peak = Math.max(program.gain * ((1 - program.velTrack) + program.velTrack * velocity), SILENT * 8);
    amp.gain.value = SILENT;
    src.connect(amp).connect(this.master);
    const now = ctx.currentTime + 0.01;
    amp.gain.setValueAtTime(SILENT, now);
    amp.gain.linearRampToValueAtTime(peak, now + 0.004);
    let stopAt = now + (buffer.duration - startAt) / rate + 0.05;
    let live = true;
    if (sustainSec !== undefined) {
      const short = Math.min(zone.release, 0.22);
      const relAt = now + Math.max(sustainSec, 0.03);
      amp.gain.setValueAtTime(peak, relAt);
      amp.gain.exponentialRampToValueAtTime(SILENT, relAt + short);
      stopAt = relAt + short + 0.03;
      live = false;
    }
    try {
      src.start(now, startAt);
      if (!live) src.stop(stopAt);
    } catch (err) {
      try {
        src.disconnect();
        amp.disconnect();
      } catch {
        /* node already detached */
      }
      console.warn("[audio] sample playback failed", err);
      return false;
    }
    this.voices.push({
      id: this.nextId++,
      midi,
      live,
      start: now,
      end: stopAt,
      amp,
      oscs: [src],
      release: zone.release,
      velocity,
      hammerOnRelease: id === "piano",
    });
    return true;
  }

  private playHammer(midi: number, velocity: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const files = PROGRAMS.piano.releases;
    const idx = midi - 21;
    if (idx < 0 || idx >= files.length) return;
    const buf = cache.get(sampleUrl(files[idx]));
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const amp = ctx.createGain();
    const peak = Math.max(0.05 * velocity, SILENT * 4);
    amp.gain.value = SILENT;
    src.connect(amp).connect(this.master);
    const now = ctx.currentTime + 0.005;
    const stopAt = now + buf.duration + 0.02;
    amp.gain.setValueAtTime(SILENT, now);
    amp.gain.linearRampToValueAtTime(peak, now + 0.003);
    try {
      src.start(now);
    } catch {
      return;
    }
    this.voices.push({
      id: this.nextId++,
      midi,
      live: false,
      start: now,
      end: stopAt,
      amp,
      oscs: [src],
      release: 0.05,
      velocity,
      hammerOnRelease: false,
    });
  }

  noteOn(midi: number, velocity = 0.8, sustainSec?: number) {
    const ctx = this.ensure();
    if (ctx.state !== "running") console.warn("[midi] audio context", ctx.state);
    this.chokeSame(midi);
    this.prune();
    const patch = this.patchFor(midi);
    if (patch.sample && this.playSample(patch.sample, midi, velocity, sustainSec)) return;
    const freq = 440 * 2 ** ((midi - 69) / 12);
    const { env } = patch;
    const attack = Math.max(env.a, 0.008);
    const decay = Math.max(env.d, 0.02);
    const release = Math.max(env.r, 0.05);
    const peak = Math.max(patch.gain * (0.3 + 0.7 * velocity) * (patch.group === "keys" ? 1.15 - midi / 140 : 1), SILENT * 8);
    const sus = Math.max(peak * env.s, SILENT);

    const amp = ctx.createGain();
    amp.gain.value = SILENT;
    let out: AudioNode = amp;
    const oscs: AudioScheduledSourceNode[] = [];
    if (patch.tremolo) {
      const trem = ctx.createGain();
      trem.gain.value = 1 - patch.tremolo.depth / 2;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = patch.tremolo.rate;
      lfoGain.gain.value = patch.tremolo.depth / 2;
      lfo.connect(lfoGain).connect(trem.gain);
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
      lp.frequency.value = start;
      if (Math.abs(end - start) > 1) {
        const sweep = Math.max(f.time, 0.02);
        lp.frequency.exponentialRampToValueAtTime(Math.max(end, 1), ctx.currentTime + sweep);
      }
      lp.connect(amp);
      input = lp;
    }

    let modGain: GainNode | null = null;
    if (patch.fm) {
      const mod = ctx.createOscillator();
      modGain = ctx.createGain();
      const depth = freq * patch.fm.index;
      mod.frequency.value = freq * patch.fm.ratio;
      modGain.gain.value = depth;
      modGain.gain.exponentialRampToValueAtTime(Math.max(depth * 0.04, SILENT), ctx.currentTime + Math.max(patch.fm.decay, 0.02));
      mod.connect(modGain);
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
      oscs.push(o);
    }

    const now = ctx.currentTime + 0.01;
    amp.gain.setValueAtTime(SILENT, now);
    amp.gain.linearRampToValueAtTime(peak, now + attack);
    const decayEnd = now + attack + decay;
    let stopAt = now + 30;
    let live = true;
    if (sustainSec !== undefined) {
      const want = now + Math.max(sustainSec, attack + 0.03);
      if (want < decayEnd - 0.004) {
        const u = Math.min(1, Math.max(0.001, (want - (now + attack)) / decay));
        const mid = Math.max(peak * (sus / peak) ** u, SILENT);
        const rel = Math.max(want, now + attack + 0.004);
        this.glide(amp.gain, peak, mid, rel);
        this.glide(amp.gain, mid, SILENT, rel + release);
        stopAt = rel + release + 0.05;
      } else {
        this.glide(amp.gain, peak, sus, decayEnd);
        const relAt = Math.max(want, decayEnd + 0.004);
        amp.gain.linearRampToValueAtTime(sus, relAt);
        this.glide(amp.gain, sus, SILENT, relAt + release);
        stopAt = relAt + release + 0.05;
      }
      live = false;
    } else if (env.tail > 0) {
      this.glide(amp.gain, peak, sus, decayEnd);
      this.glide(amp.gain, sus, SILENT, decayEnd + env.tail);
      stopAt = decayEnd + env.tail + 0.05;
      live = false;
    } else {
      this.glide(amp.gain, peak, sus, decayEnd);
    }

    for (const o of oscs) o.start(now);
    const v: Voice = { id: this.nextId++, midi, live, start: now, end: stopAt, amp, oscs, release, velocity, hammerOnRelease: false };
    if (!live) this.stopOscs(v, stopAt);
    this.voices.push(v);
  }

  noteOff(midi: number) {
    if (!this.ctx) return;
    for (let i = this.voices.length - 1; i >= 0; i--) {
      const v = this.voices[i];
      if (v.midi === midi && v.live) {
        const held = this.ctx.currentTime - v.start;
        const hammer = v.hammerOnRelease;
        const velocity = v.velocity;
        this.fadeNow(v, v.release);
        if (hammer && held >= 0.05) this.playHammer(midi, velocity);
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
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = accent ? 1568 : 1046;
    g.gain.value = SILENT;
    o.connect(g).connect(this.master);
    const now = ctx.currentTime + 0.005;
    g.gain.setValueAtTime(SILENT, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.003);
    g.gain.exponentialRampToValueAtTime(SILENT, now + 0.05);
    o.start(now);
    o.stop(now + 0.07);
  }
}

export const synth = new Synth();

useSound.subscribe((s) => {
  localStorage.setItem("keystream.sound", JSON.stringify(s));
  synth.warm();
});

if (typeof window !== "undefined") synth.warm();
