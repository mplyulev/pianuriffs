import { create } from "zustand";
import { PROGRAMS, type SampleId, type SampleLayer, type SampleProgram, type SampleZone } from "./sampleBank";

export interface Patch {
  id: string;
  name: string;
  group: "keys" | "bass";
  sample: SampleId;
}

export const PATCHES: Patch[] = [
  { id: "piano", name: "Grand Piano", group: "keys", sample: "piano" },
  { id: "fingerbass", name: "Finger Bass", group: "bass", sample: "finger" },
  { id: "pickbass", name: "Picked Bass", group: "bass", sample: "pick" },
  { id: "strings", name: "Strings", group: "keys", sample: "strings" },
  { id: "fmpiano", name: "FM Piano", group: "keys", sample: "fmpiano" },
  { id: "synthstrings", name: "Synth Strings", group: "keys", sample: "synthstrings" },
  { id: "pad", name: "Synth Pad", group: "keys", sample: "pad" },
  { id: "brass", name: "Synth Brass", group: "keys", sample: "brass" },
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

const PATCH_IDS = new Set(PATCHES.map((p) => p.id));

const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem("keystream.sound") ?? "{}") as Partial<SoundState>;
  } catch {
    return {};
  }
})();

const initialSound: SoundState = {
  keys: typeof saved.keys === "string" && PATCH_IDS.has(saved.keys) ? saved.keys : "piano",
  bass: typeof saved.bass === "string" && PATCH_IDS.has(saved.bass) ? saved.bass : "fingerbass",
  splitOn: Boolean(saved.splitOn),
  split: typeof saved.split === "number" && saved.split >= 36 && saved.split <= 72 ? saved.split : 48,
};

export const useSound = create<SoundState>(() => initialSound);

if (saved.keys !== initialSound.keys || saved.bass !== initialSound.bass) {
  try {
    localStorage.setItem("keystream.sound", JSON.stringify(initialSound));
  } catch {
    /* storage can be blocked */
  }
}

function emptyPending(): Record<SampleId, number> {
  const pending = {} as Record<SampleId, number>;
  for (const id of Object.keys(PROGRAMS) as SampleId[]) pending[id] = 0;
  return pending;
}

export const useSamples = create<{ pending: Record<SampleId, number> }>(() => ({
  pending: emptyPending(),
}));

function sampleUrl(file: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${base.endsWith("/") ? "" : "/"}${file}`;
}

function zoneFor(program: SampleProgram, midi: number): SampleZone {
  let nearest = program.zones[0];
  let nearestDist = Infinity;
  for (const zone of program.zones) {
    if (midi >= zone.lo && midi <= zone.hi) return zone;
    const dist = midi < zone.lo ? zone.lo - midi : midi - zone.hi;
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = zone;
    }
  }
  return nearest;
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
    const pending = emptyPending();
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
    // Read the level first. cancelAndHoldAtTime followed by an exponential ramp
    // collapses the note to silence in one block in Chrome, which is the click
    // on keys the player releases. Playback never takes this path.
    const held = Math.max(g.value, SILENT);
    const stopAt = time + Math.max(rel, 0.02);
    try {
      g.cancelScheduledValues(time);
      g.setValueAtTime(held, time);
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

  /** Play a recorded note. A missing layer stays silent — sampled instruments never fall back to oscillators. */
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
    let chosen: SampleLayer | undefined;
    let missing: string | null = null;
    for (const layer of layers) {
      const url = sampleUrl(layer.file);
      const decoded = cache.get(url);
      if (decoded) {
        buffer = decoded;
        chosen = layer;
        break;
      }
      if (!missing) missing = url;
    }
    if (missing) cache.prioritize(missing);
    if (!buffer || !chosen) {
      cache.ensure(id);
      return false;
    }
    const rate = 2 ** ((midi - zone.root) / 12);
    const startAt = Math.min(Math.max(0, chosen.offset), Math.max(0, buffer.duration - 0.01));
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const loopStart = chosen.loopStart ?? 0;
    const loopEnd = chosen.loopEnd ?? 0;
    const looped = loopEnd > loopStart + 0.05;
    if (looped) {
      const end = Math.min(loopEnd, Math.max(0.06, buffer.duration - 0.001));
      const start = Math.max(0, Math.min(loopStart, end - 0.05));
      if (end > start + 0.05) {
        src.loop = true;
        src.loopStart = start;
        src.loopEnd = end;
      }
    }
    const amp = ctx.createGain();
    const peak = Math.max(program.gain * ((1 - program.velTrack) + program.velTrack * velocity), SILENT * 8);
    amp.gain.value = SILENT;
    src.connect(amp).connect(this.master);
    const now = ctx.currentTime + 0.01;
    amp.gain.setValueAtTime(SILENT, now);
    amp.gain.linearRampToValueAtTime(peak, now + 0.004);
    let stopAt = src.loop ? now + 120 : now + (buffer.duration - startAt) / rate + 0.05;
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
    this.playSample(patch.sample, midi, velocity, sustainSec);
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
