import { create } from "zustand";
import { type Hand, type Song } from "./song";
import { synth } from "./audio";
import { onNote, type NoteEvent } from "./midi";
import { getSession, patchSession, rememberSong, songFromSession } from "./session";

export type Mode = "wait" | "play" | "echo";

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

const saved = getSession();

export const useEngine = create<EngineState>(() => ({
  song: songFromSession(),
  mode: saved.mode,
  hands: saved.hands,
  speed: saved.speed,
  metronome: saved.metronome,
  appSound: saved.appSound,
  countIn: saved.countIn,
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
  index: number;
  dur: number;
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
  echoPhase: "call" | "reply" | "next" = "call";

  private scanIdx = 0;
  private audioIdx = 0;
  private lastNow = 0;
  private lastTickAt = 0;
  private flushedAt = 0;
  private dirty = false;
  private stats = { ...freshStats };

  constructor() {
    this.loadSong(useEngine.getState().song);
    onNote((e, on) => this.handleNote(e, on));
    useEngine.subscribe((s, prev) => {
      if (s.song !== prev.song) this.loadSong(s.song);
      else if (s.mode !== prev.mode || s.hands !== prev.hands) {
        this.echoPhase = "call";
        if (s.mode === "echo") {
          const { a } = this.phraseBounds(Math.max(0, this.pos));
          this.pos = a;
        }
        this.reset(this.pos);
      }
      if (s.playing !== prev.playing) {
        if (s.playing) this.onPlay();
        else synth.allOff();
      }
      if (
        s.song !== prev.song ||
        s.mode !== prev.mode ||
        s.hands !== prev.hands ||
        s.speed !== prev.speed ||
        s.metronome !== prev.metronome ||
        s.appSound !== prev.appSound ||
        s.countIn !== prev.countIn
      ) {
        rememberSong(s.song);
        patchSession({
          mode: s.mode,
          hands: s.hands,
          speed: s.speed,
          metronome: s.metronome,
          appSound: s.appSound,
          countIn: s.countIn,
        });
      }
    });
  }

  private get s() {
    return useEngine.getState();
  }

  private loadSong(song: Song) {
    this.status = new Uint8Array(song.notes.length);
    this.stats = { ...freshStats };
    this.echoPhase = "call";
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

  reset(beat: number, cutSound = true) {
    const { song } = this.s;
    const from = lowerBound(song, beat - 1e-6);
    this.status.fill(PENDING, from);
    this.scanIdx = from;
    this.audioIdx = from;
    if (cutSound) synth.allOff();
  }

  seek(beat: number) {
    const { song, mode } = this.s;
    let pos = Math.max(0, Math.min(song.length, beat));
    this.echoPhase = "call";
    if (mode === "echo") pos = this.phraseBounds(pos).a;
    this.pos = pos;
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

  /** Hide the finished summary. Leaves playback, position, and the score alone. */
  dismissResults() {
    this.stats.finished = false;
    this.dirty = false;
    useEngine.setState({ finished: false });
  }

  private onPlay() {
    const s = this.s;
    if (this.stats.finished || this.pos >= s.song.length) this.restart();
    if (s.countIn && this.pos <= (s.loop?.a ?? 0) + 1e-6) {
      this.pos = (s.loop?.a ?? 0) - s.song.beatsPerBar;
    }
    this.audioIdx = lowerBound(s.song, this.pos - 1e-6);
    this.lastNow = performance.now();
    this.lastTickAt = this.lastNow;
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
    console.log("[midi] engine note", e.midi, "playing", this.s.playing, "mode", this.s.mode);
    synth.noteOn(e.midi, 0.4 + e.velocity * 0.6);
    const s = this.s;
    if (!s.playing) return;

    const { notes } = s.song;
    const bps = this.beatsPerSec;
    if (s.mode === "wait" || (s.mode === "echo" && this.echoPhase === "reply")) {
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
      if (s.mode === "echo" && this.phraseDone()) this.holdForNext();
      return;
    }
    if (s.mode === "echo") return;

    const posAtEvent = this.pos + ((performance.now() - this.lastTickAt) / 1000) * bps;
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
    this.fx.push({ midi: n.midi, hand: n.hand, perfect, index: i, dur: n.dur });
    this.judgement = {
      text: perfect ? "Perfect" : "Good",
      at: performance.now(),
      good: true,
    };
    this.dirty = true;
  }

  /** Two-bar slices of the song or the active loop. A leftover of one bar or less stays on the previous slice, so the last phrase is at most three bars. */
  private phraseBounds(beat: number) {
    const s = this.s;
    const bpb = s.song.beatsPerBar;
    const origin = s.loop?.a ?? 0;
    const end = Math.max(origin + bpb, s.loop?.b ?? s.song.length);
    const size = 2 * bpb;
    const span = end - origin;
    if (span <= size + bpb) return { a: origin, b: end };
    const rem = span % size;
    const absorb = rem > 1e-6 && rem <= bpb + 1e-6;
    const body = absorb ? span - rem : span;
    const rel = Math.min(Math.max(0, beat - origin), span - 1e-9);
    const lastStart = body - size;
    const aRel = absorb && rel >= lastStart ? lastStart : Math.floor(rel / size) * size;
    const a = origin + aRel;
    const b = absorb && aRel === lastStart ? end : Math.min(end, a + size);
    return { a, b };
  }

  private phraseDone() {
    const { a, b } = this.phraseBounds(this.pos);
    const { notes } = this.s.song;
    for (let i = lowerBound(this.s.song, a - 1e-6); i < notes.length && notes[i].start < b - 1e-4; i++) {
      if (this.isRequired(i) && this.status[i] !== HIT) return false;
    }
    return true;
  }

  private beginReply(at: number) {
    this.echoPhase = "reply";
    this.pos = at;
    this.reset(at, false);
    this.dirty = true;
  }

  private beginCall(at: number) {
    this.echoPhase = "call";
    this.pos = at;
    this.reset(at);
    this.dirty = true;
  }

  private advanceEcho() {
    const { b } = this.phraseBounds(this.pos);
    const end = this.s.loop?.b ?? this.s.song.length;
    if (b >= end - 1e-4) {
      if (this.s.loop) {
        this.parkNext(this.s.loop.a);
        return;
      }
      this.stats.finished = true;
      this.flush(true);
      useEngine.setState({ playing: false });
      return;
    }
    this.parkNext(b);
  }

  /** Phrase is done. Park on the next one and wait for Space or Enter. */
  private holdForNext() {
    if (this.echoPhase === "next" || this.stats.finished) return;
    this.advanceEcho();
  }

  private parkNext(at: number) {
    this.echoPhase = "next";
    this.pos = at;
    this.reset(at);
    this.dirty = true;
    this.flush(true);
  }

  /** Start the parked phrase. Returns true when Space or Enter was consumed. */
  confirmEcho(): boolean {
    if (this.echoPhase !== "next" || this.s.mode !== "echo" || this.stats.finished) return false;
    const at = this.pos;
    if (!this.s.playing) useEngine.setState({ playing: true });
    this.beginCall(at);
    this.flush(true);
    return true;
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
    if (s.mode === "echo" && this.echoPhase === "next") {
      this.flush();
      return;
    }
    const { notes } = s.song;
    const bps = this.beatsPerSec;
    const prev = this.pos;
    let next = prev + dt * bps;

    let replyAt: number | null = null;
    if (s.mode === "echo" && prev >= (s.loop?.a ?? 0) - 1e-6) {
      const { a, b } = this.phraseBounds(this.pos);
      if (this.echoPhase === "reply") {
        if (this.phraseDone()) {
          this.holdForNext();
          return;
        }
        const gi = this.nextPendingIdx();
        if (gi < notes.length && notes[gi].start < b && next > notes[gi].start) next = Math.max(prev, notes[gi].start);
      } else if (next >= b) {
        next = Math.max(prev, b - 1e-4);
        replyAt = a;
      }
    } else if (s.mode === "wait") {
      const gi = this.nextPendingIdx();
      if (gi < notes.length && next > notes[gi].start) next = Math.max(prev, notes[gi].start);
    }

    if (s.mode !== "echo" && s.loop && next >= s.loop.b) {
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

    const hearScore = s.mode === "echo" ? this.echoPhase === "call" : s.appSound;
    while (this.audioIdx < notes.length && notes[this.audioIdx].start <= next) {
      const n = notes[this.audioIdx++];
      const idx = this.audioIdx - 1;
      if (hearScore && this.isRequired(idx)) synth.noteOn(n.midi, (n.vel ?? 0.7) * 0.4, n.dur / bps);
    }
    if (replyAt !== null) {
      this.beginReply(replyAt);
      this.flush(true);
      return;
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
