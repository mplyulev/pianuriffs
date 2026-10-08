import { Part, type Pattern } from "./dsl";

export type Spot = [start: number, dur: number];
export type Note = [start: number, dur: number, semis: number | number[]];

const accent = (start: number) => (start === 0 ? 1 : start % 1 === 0 ? 0.85 : start % 0.5 === 0 ? 0.68 : 0.5);

export const MELODIC = new WeakSet<Pattern>();

export const hits = (spots: Spot[]): Pattern => (p, v, bpb) => {
  const t0 = p.t;
  for (const [s, d] of spots) {
    p.t = t0 + s;
    p.add(v.rh, d, 0.9, accent(s));
  }
  p.t = t0 + bpb;
};

type Base = (v: { root: number; bass: number; tonic: number }) => number;

export const place =
  (base: Base, oct = 0) =>
  (notes: Note[]): Pattern =>
  (p: Part, v, bpb) => {
    const t0 = p.t;
    for (const [s, d, semis] of notes) {
      p.t = t0 + s;
      p.add(Array.isArray(semis) ? semis.map((x) => base(v) + oct + x) : base(v) + oct + semis, d, 0.9, accent(s));
    }
    p.t = t0 + bpb;
  };

export const bassLine = place((v) => v.bass);
export const riff = place((v) => v.root);

/** Parse `start:dur:semis` notes (semis may be `a+b`), bars separated by `|`. */
export function parsePhrase(src: string): Note[][] {
  return src.split("|").map((bar) =>
    bar
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((tok) => {
        const [s, d, m] = tok.split(":");
        const semis = m.includes("+") ? m.split("+").map(Number) : Number(m);
        return [Number(s), Number(d), semis] as Note;
      }),
  );
}

/** One-bar melody relative to the song tonic. Does not cycle. */
export function line(src: string, oct = 12): Pattern {
  return place((v) => v.tonic, oct)(parsePhrase(src)[0]);
}

/** A melody that cycles bar by bar, relative to the song's tonic (default one octave up). */
export function phrase(src: string, oct = 12): Pattern {
  const bars = parsePhrase(src).map((n) => place((v) => v.tonic, oct)(n));
  const pat: Pattern = (p, v, bpb) => bars[Math.round(p.t / bpb) % bars.length](p, v, bpb);
  MELODIC.add(pat);
  return pat;
}

/** Cycles through several one-bar patterns bar by bar. */
export const seq =
  (...patterns: Pattern[]): Pattern =>
  (p, v, bpb) =>
    patterns[Math.round(p.t / bpb) % patterns.length](p, v, bpb);

/** Plays several patterns at the same time on one part. */
export const layer =
  (...patterns: Pattern[]): Pattern =>
  (p, v, bpb) => {
    const t0 = p.t;
    for (const pat of patterns) {
      p.t = t0;
      pat(p, v, bpb);
    }
    p.t = t0 + bpb;
  };

/** Third and seventh (or fifth) above the bass, struck at the given spots. */
export const shellHits = (spots: Spot[]): Pattern => (p, v, bpb) => {
  const t0 = p.t;
  for (const [s, d] of spots) {
    p.t = t0 + s;
    p.add(v.shell, d, 0.85, 0.6);
  }
  p.t = t0 + bpb;
};

/** Parse a one-bar chord-relative bass line: `start:dur:semis ...`. */
export const bassFrom = (src: string): Pattern => bassLine(parsePhrase(src)[0]);
export const hitsFrom = (src: string): Pattern =>
  hits(src.trim().split(/\s+/).map((t) => t.split(":").map(Number) as Spot));
export const shellFrom = (src: string): Pattern =>
  shellHits(src.trim().split(/\s+/).map((t) => t.split(":").map(Number) as Spot));
