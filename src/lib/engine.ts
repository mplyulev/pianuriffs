import { create } from "zustand";
import { DEMO_SONG, type Hand, type Song } from "./song";
import { synth } from "./audio";
import { onNote, type NoteEvent } from "./midi";

export type Mode = "wait" | "play";

export const HIT_WINDOW_SEC = 0.2;
export const PERFECT_WINDOW_SEC = 0.07;

export interface EngineState {
  song: Song;
  mode: Mode;
  hands: Record<Hand, boolean>;
  speed: number;
  metronome: boolean;
  appSound: boolean;
  countIn: boolean;
  loop: { a: number; b: number } | null;
  playing: boolean;
  finished: boolean;
  hits: number;
  misses: number;
  wrongs: number;
  streak: number;
  best: number;
}

const freshStats = { hits: 0, misses: 0, wrongs: 0, streak: 0, best: 0, finished: false };

export const useEngine = create<EngineState>(() => ({
  song: DEMO_SONG,
  mode: "play",
  hands: { L: true, R: true },
  speed: 0.8,
  metronome: false,
  appSound: true,
  countIn: true,
  loop: null,
  playing: false,
  ...freshStats,
}));

export const PENDING = 0;
export const HIT = 1;
export const MISSED = 2;

export interface HitFx {
  midi: number;
  hand: Hand;
  perfect: boolean;
}

function lowerBound(song: Song, beat: number): number {
  let lo = 0;
  let hi = song.notes.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (song.notes[mid].start < beat) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

class Engine {
  pos = 0;
  status = new Uint8Array(0);
  held = new Set<number>();
  wrong = new Map<number, number>();
  fx: HitFx[] = [];
  judgement: { text: string; at: number; good: boolean } | null = null;

  private scanIdx = 0;
  private audioIdx = 0;
  private lastNow = 0;
  private lastTickAt = 0;
  private flushedAt = 0;
  private dirty = false;
  private stats = { ...freshStats };

  constructor() {
    this.loadSong(DEMO_SONG);
    onNote((e, on) => this.handleNote(e, on));
    useEngine.subscribe((s, prev) => {
      if (s.song !== prev.song) this.loadSong(s.song);
      else if (s.mode !== prev.mode || s.hands !== prev.hands) this.reset(this.pos);
      if (s.playing !== prev.playing) {
        if (s.playing) this.onPlay();
        else synth.allOff();
      }
    });
  }

  private get s() {
    return useEngine.getState();
  }

  private loadSong(song: Song) {
    this.status = new Uint8Array(song.notes.length);
    this.stats = { ...freshStats };
    this.pos = 0;
    this.reset(0);
    this.flush(true);
  }

  isRequired(i: number) {
    const s = this.s;
    return s.hands[s.song.notes[i].hand];
  }

  private get beatsPerSec() {
    return (this.s.song.bpm * this.s.speed) / 60;
  }

  reset(beat: number) {
    const { song } = this.s;
    const from = lowerBound(song, beat - 1e-6);
    this.status.fill(PENDING, from);
    this.scanIdx = from;
    this.audioIdx = from;
    synth.allOff();
  }

  seek(beat: number) {
    const { song } = this.s;
    this.pos = Math.max(0, Math.min(song.length, beat));
    this.reset(this.pos);
    const wasFinished = this.stats.finished;
    this.stats.finished = false;
    if (wasFinished) this.dirty = true;
    this.flush(true);
  }

  restart() {
    this.stats = { ...freshStats };
    this.seek(this.s.loop?.a ?? 0);
    useEngine.setState({ ...freshStats });
  }

  private onPlay() {
    const s = this.s;
    if (this.stats.finished || this.pos >= s.song.length) this.restart();
    if (s.countIn && this.pos <= (s.loop?.a ?? 0) + 1e-6) {
      this.pos = (s.loop?.a ?? 0) - s.song.beatsPerBar;
    }
    this.audioIdx = lowerBound(s.song, this.pos - 1e-6);
    this.lastNow = performance.now();
  }

  private nextPendingIdx(): number {
    const { notes } = this.s.song;
    let i = this.scanIdx;
    while (i < notes.length && !(this.status[i] === PENDING && this.isRequired(i))) i++;
    this.scanIdx = i;
    return i;
  }

  private handleNote(e: NoteEvent, on: boolean) {
    if (!on) {
      this.held.delete(e.midi);
      synth.noteOff(e.midi);
      return;
    }
    this.held.add(e.midi);
    synth.noteOn(e.midi, 0.4 + e.velocity * 0.6);
    const s = this.s;
    if (!s.playing) return;

    const { notes } = s.song;
    const bps = this.beatsPerSec;
    if (s.mode === "wait") {
      const gi = this.nextPendingIdx();
      if (gi >= notes.length) return;
      const g = notes[gi];
      let match = -1;
      for (let i = gi; i < notes.length && notes[i].start - g.start < 0.02; i++) {
        if (this.status[i] === PENDING && this.isRequired(i) && notes[i].midi === e.midi) match = i;
      }
      if (match < 0) return this.markWrong(e.midi);
      if (g.start - this.pos > 1) return;
      this.markHit(match, true);
      return;
    }

    const posAtEvent = this.pos + ((e.time - this.lastTickAt) / 1000) * bps;
    const win = HIT_WINDOW_SEC * bps;
    let best = -1;
    let bestDist = Infinity;
    for (let i = Math.max(0, this.scanIdx - 8); i < notes.length; i++) {
      const n = notes[i];
      if (n.start > posAtEvent + win) break;
      if (n.midi !== e.midi || this.status[i] !== PENDING || !this.isRequired(i)) continue;
      const d = Math.abs(n.start - posAtEvent);
      if (d <= win && d < bestDist) {
        best = i;
        bestDist = d;
      }
    }
    if (best < 0) return this.markWrong(e.midi);
    this.markHit(best, bestDist / bps <= PERFECT_WINDOW_SEC);
  }

  private markHit(i: number, perfect: boolean) {
    const n = this.s.song.notes[i];
    this.status[i] = HIT;
    this.stats.hits++;
    this.stats.streak++;
    this.stats.best = Math.max(this.stats.best, this.stats.streak);
    this.fx.push({ midi: n.midi, hand: n.hand, perfect });
    this.judgement = {
      text: perfect ? "Perfect" : "Good",
      at: performance.now(),
      good: true,
    };
    this.dirty = true;
  }

  private markWrong(midi: number) {
    this.stats.wrongs++;
    this.stats.streak = 0;
    this.wrong.set(midi, performance.now() + 350);
    this.judgement = { text: "Wrong note", at: performance.now(), good: false };
    this.dirty = true;
  }

  private flush(force = false) {
    const now = performance.now();
    if (!force && (!this.dirty || now - this.flushedAt < 100)) return;
    this.flushedAt = now;
    this.dirty = false;
    useEngine.setState({ ...this.stats });
  }

  tick(now: number) {
    this.lastTickAt = now;
    const s = this.s;
    const dt = Math.min(0.1, (now - this.lastNow) / 1000);
    this.lastNow = now;
    if (!s.playing) {
      this.flush();
      return;
    }
    const { notes } = s.song;
    const bps = this.beatsPerSec;
    const prev = this.pos;
    let next = prev + dt * bps;

    if (s.mode === "wait") {
      const gi = this.nextPendingIdx();
      if (gi < notes.length && next > notes[gi].start) next = Math.max(prev, notes[gi].start);
    }

    if (s.loop && next >= s.loop.b) {
      this.pos = s.loop.a;
      this.reset(this.pos);
      this.flush(true);
      return;
    }

    const beatPrev = Math.floor(prev);
    const beatNext = Math.floor(next);
    if (beatNext > beatPrev && (s.metronome || next < 0 || prev < 0)) {
      synth.click(((beatNext % s.song.beatsPerBar) + s.song.beatsPerBar) % s.song.beatsPerBar === 0);
    }

    this.pos = next;

    const missBefore = next - HIT_WINDOW_SEC * bps;
    if (s.mode === "play") {
      while (this.scanIdx < notes.length && notes[this.scanIdx].start < missBefore) {
        const i = this.scanIdx++;
        if (this.status[i] === PENDING && this.isRequired(i)) {
          this.status[i] = MISSED;
          this.stats.misses++;
          this.stats.streak = 0;
          this.dirty = true;
        }
      }
    }

    while (this.audioIdx < notes.length && notes[this.audioIdx].start <= next) {
      const n = notes[this.audioIdx++];
      const idx = this.audioIdx - 1;
      if (s.appSound) synth.noteOn(n.midi, this.isRequired(idx) ? 0.3 : 0.6, n.dur / bps);
    }

    if (next >= s.song.length + 0.5) {
      this.stats.finished = true;
      this.flush(true);
      useEngine.setState({ playing: false });
      return;
    }
    this.flush();
  }
}

export const engine = new Engine();

export function accuracy(s: Pick<EngineState, "hits" | "misses" | "wrongs">) {
  const total = s.hits + s.misses + s.wrongs;
  return total === 0 ? null : Math.round((s.hits / total) * 100);
}
