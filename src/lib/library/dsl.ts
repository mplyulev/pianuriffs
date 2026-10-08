import { finalize, noteNumber, type Hand, type Song, type SongNote } from "../song";

export const IVS = {
  M: [0, 4, 7],
  m: [0, 3, 7],
  "7": [0, 4, 7, 10],
  M7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  dim: [0, 3, 6],
  m7b5: [0, 3, 6, 10],
} as const;
export type ChordType = keyof typeof IVS;

export const tone = (root: number, ivs: readonly number[], i: number) =>
  root + ivs[((i % ivs.length) + ivs.length) % ivs.length] + 12 * Math.floor(i / ivs.length);

/** Fold a pitch class (any integer) into -5..6 so voicings stay near the middle of the keyboard. */
export const wrap = (pc: number) => ((((pc + 5) % 12) + 12) % 12) - 5;

export type Pitch = number | readonly number[] | null;

export class Part {
  notes: SongNote[] = [];
  t = 0;
  constructor(readonly hand: Hand) {}

  add(p: Pitch, dur: number, gate = 0.92) {
    if (p !== null) {
      for (const midi of Array.isArray(p) ? p : [p as number]) {
        this.notes.push({ midi, start: this.t, dur: dur * gate, hand: this.hand });
      }
    }
    this.t += dur;
    return this;
  }

  rest(dur: number) {
    this.t += dur;
    return this;
  }

  /** Tokens like `C4:1`, `C4+E4+G4:2`, `r:.5`. Default duration is one beat. */
  text(src: string, shift = 0) {
    for (const tok of src.trim().split(/\s+/)) {
      const [names, d] = tok.split(":");
      const dur = d === undefined ? 1 : Number(d);
      if (names === "r") this.rest(dur);
      else this.add(names.split("+").map((n) => noteNumber(n) + shift), dur);
    }
    return this;
  }
}

export function makeSong(title: string, composer: string, bpm: number, bpb: number, parts: Part[]): Song {
  return finalize({ title, composer, bpm, beatsPerBar: bpb, notes: parts.flatMap((p) => p.notes) });
}

export interface Voicing {
  root: number;
  rh: number[];
  bass: number;
  ivs: readonly number[];
}

export function voicing(pc: number, type: ChordType): Voicing {
  const ivs = IVS[type];
  const root = 60 + wrap(pc);
  return { root, rh: ivs.map((i) => root + i), bass: 48 + wrap(pc), ivs };
}

export type Pattern = (p: Part, v: Voicing, bpb: number) => void;

export interface ChordSpec {
  off: number;
  type: ChordType;
  bars?: number;
}

export function progression(o: {
  title: string;
  composer?: string;
  bpm: number;
  bpb?: number;
  key?: number;
  prog: ChordSpec[];
  loops?: number;
  rh: Pattern;
  lh: Pattern;
}): Song {
  const bpb = o.bpb ?? 4;
  const R = new Part("R");
  const L = new Part("L");
  for (let loop = 0; loop < (o.loops ?? 2); loop++) {
    for (const c of o.prog) {
      const v = voicing((o.key ?? 0) + c.off, c.type);
      for (let b = 0; b < (c.bars ?? 1); b++) {
        o.rh(R, v, bpb);
        o.lh(L, v, bpb);
      }
    }
  }
  return makeSong(o.title, o.composer ?? "Practice", o.bpm, bpb, [R, L]);
}

const fillBar = (bpb: number, dur: number, fn: (i: number) => void) => {
  for (let i = 0; i < Math.round(bpb / dur); i++) fn(i);
};

export const RH = {
  hold: ((p, v, bpb) => p.add(v.rh, bpb, 0.97)) as Pattern,
  halves: ((p, v, bpb) => {
    for (let b = 0; b < bpb; b += 2) p.add(v.rh, Math.min(2, bpb - b), 0.95);
  }) as Pattern,
  quarters: ((p, v, bpb) => fillBar(bpb, 1, () => p.add(v.rh, 1, 0.85))) as Pattern,
  pulse: ((p, v, bpb) => fillBar(bpb, 0.5, () => p.add(v.rh, 0.5, 0.85))) as Pattern,
  offbeat: ((p, v, bpb) =>
    fillBar(bpb, 1, () => {
      p.rest(0.5);
      p.add(v.rh, 0.5, 0.85);
    })) as Pattern,
  arp:
    (idxs: number[], dur = 0.5): Pattern =>
    (p, v, bpb) =>
      fillBar(bpb, dur, (i) => p.add(tone(v.root, v.ivs, idxs[i % idxs.length]), dur)),
};

export const LH = {
  root: ((p, v, bpb) => p.add(v.bass, bpb, 0.97)) as Pattern,
  rootFifth: ((p, v, bpb) =>
    fillBar(bpb, 2, (i) => p.add(i % 2 ? v.bass + 7 : v.bass, Math.min(2, bpb - i * 2), 0.95))) as Pattern,
  octaves: ((p, v, bpb) => fillBar(bpb, 2, () => p.add([v.bass, v.bass + 12], 2, 0.95))) as Pattern,
  octEighths: ((p, v, bpb) => fillBar(bpb, 0.5, () => p.add([v.bass, v.bass + 12], 0.5, 0.85))) as Pattern,
  brokenOctaves: ((p, v, bpb) => fillBar(bpb, 0.5, (i) => p.add(v.bass + (i % 2 ? 12 : 0), 0.5))) as Pattern,
  alberti: ((p, v, bpb) =>
    fillBar(bpb, 0.5, (i) => p.add(tone(v.bass, v.ivs, [0, 2, 1, 2][i % 4]), 0.5))) as Pattern,
  rolling: ((p, v, bpb) =>
    fillBar(bpb, 0.5, (i) => p.add(tone(v.bass, v.ivs, [0, 1, 2, 3, 2, 1][i % 6]), 0.5))) as Pattern,
  boogie: ((p, v, bpb) =>
    fillBar(bpb, 0.5, (i) => p.add(v.bass + [0, 4, 7, 9, 10, 9, 7, 4][i % 8], 0.5))) as Pattern,
  walk: ((p, v, bpb) =>
    fillBar(bpb, 1, (i) => p.add(v.bass + [0, v.ivs[1], v.ivs[2], v.ivs[1] + 2][i % 4], 1))) as Pattern,
  stride: ((p, v, bpb) =>
    fillBar(bpb, 1, (i) => p.add(i % 2 ? v.rh.map((m) => m - 12) : v.bass, 1, 0.85))) as Pattern,
  waltz: ((p, v) => {
    p.add(v.bass, 1, 0.9);
    p.add(v.ivs.map((i) => v.bass + 12 + i), 1, 0.85);
    p.add(v.ivs.map((i) => v.bass + 12 + i), 1, 0.85);
  }) as Pattern,
  fifths: ((p, v, bpb) => fillBar(bpb, 0.5, () => p.add([v.bass, v.bass + 7], 0.5, 0.85))) as Pattern,
  latin: ((p, v, bpb) => {
    if (bpb !== 4) {
      p.add(v.bass, bpb, 0.97);
      return;
    }
    p.add(v.bass, 1.5);
    p.add(v.bass + 7, 0.5);
    p.add(v.bass + 12, 1);
    p.add(v.bass + 7, 1);
  }) as Pattern,
};
