import type { Song } from "../song";
import { LH, Part, RH, makeSong, tone, voicing, type ChordType, type Pattern } from "./dsl";
import { bassLine, hits, riff } from "./genres";

export type Prog = [off: number, type: ChordType, bars?: number][];

export interface Spec {
  label: string;
  title: string;
  bpm: number;
  key: number;
  prog: Prog;
  rh: Pattern;
  lh: Pattern;
  fill?: Pattern;
  bpb?: number;
  loops?: number;
}

export function build(o: Spec): () => Song {
  return () => {
    const bpb = o.bpb ?? 4;
    const R = new Part("R");
    const L = new Part("L");
    for (let loop = 0; loop < (o.loops ?? 2); loop++) {
      o.prog.forEach(([off, type, bars = 1], ci) => {
        const v = voicing(o.key + off, type, o.key);
        for (let b = 0; b < bars; b++) {
          const last = ci === o.prog.length - 1 && b === bars - 1;
          (last && o.fill ? o.fill : o.rh)(R, v, bpb);
          o.lh(L, v, bpb);
        }
      });
    }
    return makeSong(o.title, o.label, o.bpm, bpb, [R, L]);
  };
}

const oddBar = (p: Part, bpb: number) => Math.round(p.t / bpb) % 2 === 1;
const alt = (a: Pattern, b: Pattern): Pattern => (p, v, bpb) => (oddBar(p, bpb) ? b : a)(p, v, bpb);

const toneRiff =
  (spots: [number, number, number][], oct = 12): Pattern =>
  (p, v, bpb) => {
    const t0 = p.t;
    for (const [s, d, idx] of spots) {
      p.t = t0 + s;
      p.add(tone(v.root + oct, v.ivs, idx), d, 0.9);
    }
    p.t = t0 + bpb;
  };

const lowChord = (v: { rh: number[] }) => v.rh.map((m) => m - 12);
const boomChick: Pattern = (p, v, bpb) => {
  const t0 = p.t;
  p.add(v.bass, 1, 0.8);
  p.add(lowChord(v), 1, 0.7);
  p.add(v.bass + 7, 1, 0.8);
  p.add(lowChord(v), Math.max(0, bpb - 3), 0.7);
  p.t = t0 + bpb;
};

/* ---------------- Reggae ---------------- */
const skank = hits([[0.5, 0.4], [1.5, 0.4], [2.5, 0.4], [3.5, 0.4]]);
const skank24 = hits([[1.5, 0.4], [3.5, 0.4]]);
const bubble = hits([[0.5, 0.25], [1, 0.25], [1.5, 0.25], [2, 0.25], [2.5, 0.25], [3, 0.25], [3.5, 0.25]]);
const oneDrop = bassLine([[2, 0.75, 0], [3, 0.5, 0], [3.5, 0.5, 7]]);
const rockers = bassLine([[0, 0.75, 0], [1, 0.5, 0], [1.5, 0.5, 7], [2, 0.75, 12], [3, 0.5, 7], [3.5, 0.5, 0]]);
const dubBass = bassLine([[0, 1.5, 0], [2, 0.5, 0], [2.5, 0.5, 7], [3.5, 0.5, 5]]);
const reggaeFill = toneRiff([[0, 0.5, 4], [0.5, 0.5, 3], [1, 0.5, 2], [1.5, 0.5, 1], [2, 0.5, 0], [2.5, 0.5, -1], [3, 1, 0]]);

export const REGGAE = [
  build({ label: "Reggae", title: "One Drop in G", bpm: 76, key: 7, prog: [[0, "M"], [5, "M"], [0, "M"], [5, "M"]], rh: skank24, lh: oneDrop, fill: reggaeFill }),
  build({ label: "Reggae", title: "Skanking in A Minor", bpm: 72, key: 9, prog: [[0, "m"], [5, "m"], [0, "m"], [7, "7"]], rh: skank, lh: rockers, fill: reggaeFill }),
  build({ label: "Reggae", title: "Roots Rock Reggae", bpm: 78, key: 0, prog: [[0, "M"], [9, "m"], [5, "M"], [7, "M"]], rh: skank, lh: rockers }),
  build({ label: "Reggae", title: "Organ Bubble in C", bpm: 80, key: 0, prog: [[0, "M", 2], [5, "M", 2]], rh: bubble, lh: oneDrop }),
  build({ label: "Reggae", title: "Dub Minor Vamp", bpm: 68, key: 4, prog: [[0, "m", 2], [10, "M", 2]], rh: skank24, lh: dubBass }),
  build({ label: "Reggae", title: "Rocksteady Ballad", bpm: 84, key: 5, prog: [[0, "M"], [9, "m"], [2, "m"], [7, "7"]], rh: skank24, lh: rockers }),
  build({ label: "Reggae", title: "Lovers Rock in D", bpm: 70, key: 2, prog: [[0, "M7"], [4, "m7"], [5, "M7"], [7, "7"]], rh: skank, lh: oneDrop, fill: reggaeFill }),
  build({ label: "Reggae", title: "Ska Upstroke", bpm: 164, key: 0, prog: [[0, "M"], [5, "M"], [7, "M"], [0, "M"]], rh: hits([[0.5, 0.3], [1.5, 0.3], [2.5, 0.3], [3.5, 0.3]]), lh: LH.walk }),
  build({ label: "Reggae", title: "Dancehall Riddim", bpm: 94, key: 11, prog: [[0, "m", 2], [8, "M"], [7, "M"]], rh: hits([[0, 0.5], [0.75, 0.5], [1.5, 0.5], [2.25, 0.5]]), lh: bassLine([[0, 1, 0], [1.5, 0.5, 0], [2.25, 0.75, 0], [3.5, 0.5, 7]]) }),
  build({ label: "Reggae", title: "Steppers Groove", bpm: 90, key: 9, prog: [[0, "m"], [5, "m"], [0, "m"], [7, "m"]], rh: skank, lh: LH.octaves, fill: reggaeFill }),
];

/* ---------------- Country ---------------- */
const cl1 = riff([[0, 0.5, 12], [0.5, 0.5, 16], [1, 0.5, 19], [1.5, 0.5, 21], [2, 1, 19], [3, 1, 16]]);
const cl2 = riff([[0, 0.125, 15], [0.125, 0.875, 16], [1, 0.5, 19], [1.5, 0.5, 16], [2, 0.5, 12], [2.5, 0.5, 9], [3, 1, 7]]);
const cl3 = riff([[0, 1, [16, 21]], [1, 1, [19, 24]], [2, 1, [16, 21]], [3, 1, [12, 19]]]);
const cl4 = riff([[0, 0.5, 19], [0.5, 0.5, 21], [1, 0.5, 19], [1.5, 0.5, 16], [2, 1, 12], [3, 0.5, 16], [3.5, 0.5, 19]]);
const trainBeat = (p: Part, v: { bass: number; rh: number[] }, bpb: number) => {
  for (let i = 0; i < bpb * 2; i++) p.add(i % 2 ? lowChord(v) : v.bass + (i % 4 === 0 ? 0 : 7), 0.5, 0.8);
};
const countryTurn = toneRiff([[0, 0.5, 4], [0.5, 0.5, 3], [1, 0.5, 2], [1.5, 0.5, 1], [2, 0.5, 2], [2.5, 0.5, 1], [3, 1, 0]]);
const waltzHonky: Pattern = (p, v) => {
  p.add(v.bass, 1, 0.8);
  p.add(lowChord(v), 1, 0.7);
  p.add(lowChord(v), 1, 0.7);
};
const waltzLick = riff([[0, 1, 12], [1, 0.5, 16], [1.5, 0.5, 19], [2, 1, 16]]);

export const COUNTRY = [
  build({ label: "Country", title: "Honky-Tonk Boom-Chick in G", bpm: 112, key: 7, prog: [[0, "M"], [0, "M"], [5, "M"], [7, "7"]], rh: alt(cl1, cl4), lh: boomChick, fill: cl3 }),
  build({ label: "Country", title: "Nashville I–IV–V", bpm: 104, key: 0, prog: [[0, "M"], [5, "M"], [0, "M"], [7, "7"]], rh: alt(cl4, cl1), lh: boomChick, fill: cl3 }),
  build({ label: "Country", title: "Steel Guitar Slip", bpm: 76, key: 2, prog: [[0, "M"], [5, "M"], [0, "M"], [7, "M"]], rh: cl2, lh: LH.rootFifth, fill: cl3 }),
  build({ label: "Country", title: "Country Waltz in C", bpm: 108, key: 0, bpb: 3, prog: [[0, "M"], [0, "M"], [5, "M"], [7, "7"]], rh: waltzLick, lh: waltzHonky }),
  build({ label: "Country", title: "Train Beat", bpm: 144, key: 4, prog: [[0, "M"], [5, "M"], [0, "M"], [7, "7"]], rh: cl4, lh: trainBeat, fill: countryTurn }),
  build({ label: "Country", title: "Bluegrass Breakdown in G", bpm: 150, key: 7, prog: [[0, "M"], [5, "M"], [0, "M"], [7, "M"]], rh: RH.arp([0, 1, 2, 1, 2, 1, 0, 1]), lh: boomChick, fill: countryTurn }),
  build({ label: "Country", title: "Outlaw in A Minor", bpm: 92, key: 9, prog: [[0, "m"], [8, "M"], [3, "M"], [7, "M"]], rh: alt(cl2, cl4), lh: LH.rootFifth }),
  build({ label: "Country", title: "Hymn on the Porch", bpm: 80, key: 5, prog: [[0, "M"], [5, "M"], [0, "M"], [7, "7"]], rh: cl1, lh: LH.root, fill: cl3 }),
  build({ label: "Country", title: "Two-Step in D", bpm: 122, key: 2, prog: [[0, "M"], [7, "M"], [9, "m"], [5, "M"]], rh: alt(cl1, cl2), lh: boomChick }),
  build({ label: "Country", title: "Western Swing Walk", bpm: 138, key: 5, prog: [[0, "7"], [5, "7"], [0, "7"], [7, "7"]], rh: alt(cl4, cl1), lh: LH.walk, fill: countryTurn }),
];

/* ---------------- Ragtime ---------------- */
const ragBass: Pattern = (p, v) => {
  p.add([v.bass, v.bass - 12], 1, 0.8);
  p.add(lowChord(v), 1, 0.7);
  p.add([v.bass + 7, v.bass - 5], 1, 0.8);
  p.add(lowChord(v), 1, 0.7);
};
const ragA = toneRiff([[0, 0.5, 2], [0.5, 1, 4], [1.5, 0.5, 2], [2, 0.5, 4], [2.5, 1, 5], [3.5, 0.5, 4]]);
const ragB = toneRiff([[0, 0.5, 4], [0.5, 0.5, 3], [1, 0.5, 2], [1.5, 1, 3], [2.5, 0.5, 4], [3, 1, 5]]);
const ragC = toneRiff([[0, 0.5, 5], [0.5, 1, 3], [1.5, 0.5, 5], [2, 0.5, 6], [2.5, 0.5, 5], [3, 0.5, 4], [3.5, 0.5, 2]]);
const ragRun = toneRiff([[0, 0.5, 0], [0.5, 0.5, 1], [1, 0.5, 2], [1.5, 0.5, 3], [2, 0.5, 4], [2.5, 0.5, 5], [3, 1, 6]]);
const RAG_CYCLE: Prog = [[0, "M"], [9, "7"], [2, "7"], [7, "7"]];

export const RAGTIME = [
  build({ label: "Ragtime", title: "Parlor Rag in C", bpm: 100, key: 0, prog: RAG_CYCLE, rh: alt(ragA, ragB), lh: ragBass, fill: ragRun }),
  build({ label: "Ragtime", title: "Stride Rag in F", bpm: 108, key: 5, prog: RAG_CYCLE, rh: alt(ragB, ragC), lh: ragBass, fill: ragRun }),
  build({ label: "Ragtime", title: "Syncopation Study", bpm: 88, key: 0, prog: [[0, "M"], [5, "M"], [0, "M"], [7, "7"]], rh: ragA, lh: ragBass }),
  build({ label: "Ragtime", title: "Cakewalk in B♭", bpm: 112, key: -2, prog: [[0, "M"], [5, "M"], [0, "M"], [7, "7"]], rh: alt(ragC, ragA), lh: ragBass, fill: ragRun }),
  build({ label: "Ragtime", title: "Barrelhouse in G", bpm: 120, key: 7, prog: RAG_CYCLE, rh: alt(ragA, ragC), lh: LH.boogie, fill: ragRun }),
  build({ label: "Ragtime", title: "Honky-Tonk Rag in D", bpm: 126, key: 2, prog: RAG_CYCLE, rh: alt(ragB, ragA), lh: ragBass }),
  build({ label: "Ragtime", title: "Sunday Rag Ballad", bpm: 80, key: 3, prog: [[0, "M"], [5, "M"], [0, "M"], [7, "7"]], rh: ragB, lh: ragBass, fill: ragRun }),
  build({ label: "Ragtime", title: "Ragtime Two-Step in A", bpm: 116, key: 9, prog: [[0, "M"], [7, "7"], [0, "M"], [5, "M"]], rh: alt(ragC, ragB), lh: ragBass }),
  build({ label: "Ragtime", title: "Charleston Strut", bpm: 134, key: 0, prog: [[0, "M"], [0, "7"], [5, "M"], [7, "7"]], rh: alt(ragA, ragC), lh: ragBass, fill: ragRun }),
  build({ label: "Ragtime", title: "Minor Rag in A", bpm: 104, key: 9, prog: [[0, "m"], [7, "7"], [0, "m"], [5, "m"]], rh: alt(ragB, ragA), lh: ragBass }),
];

/* ---------------- Latin ---------------- */
const montunoA = toneRiff([[0, 0.5, 0], [0.5, 0.5, 1], [1.5, 0.5, 2], [2, 0.5, 1], [3, 0.5, 0], [3.5, 0.5, 1]], 0);
const montunoB = toneRiff([[0.5, 0.5, 2], [1, 0.5, 1], [2, 0.5, 0], [2.5, 0.5, 1], [3, 1, 2]], 0);
const tumbao = bassLine([[1.5, 0.5, 0], [2, 1, 7], [3.5, 0.5, 0]]);
const tresillo = bassLine([[0, 1.5, 0], [1.5, 1.5, 0], [3, 1, 7]]);
const guajeo = riff([[0, 0.5, [0, 12]], [0.5, 0.5, [4, 16]], [1.5, 0.5, [7, 19]], [2, 0.5, [4, 16]], [3, 0.5, [0, 12]], [3.5, 0.5, [4, 16]]]);
const chaCha = bassLine([[0, 1, 0], [1, 1, 7], [2, 0.5, 0], [2.5, 0.5, 0], [3, 1, 7]]);
const sambaBass = bassLine([[0, 0.75, 0], [0.75, 0.25, 0], [1.5, 0.5, 7], [2, 0.75, 0], [2.75, 0.25, 0], [3.5, 0.5, 7]]);
const bossaR: Pattern = (p, v) => {
  p.add(v.rh, 1.5);
  p.add(v.rh, 1);
  p.rest(0.5);
  p.add(v.rh, 1);
};
const bossaB: Pattern = (p, v) => {
  p.add(v.bass, 1.5);
  p.add(v.bass + 7, 1.5);
  p.add(v.bass + 12, 1);
};
const merengue = bassLine([[0, 0.5, 0], [0.5, 0.5, 12], [1, 0.5, 0], [1.5, 0.5, 12], [2, 0.5, 7], [2.5, 0.5, 12], [3, 0.5, 7], [3.5, 0.5, 12]]);
const latinFill = toneRiff([[0, 0.25, 0], [0.25, 0.25, 1], [0.5, 0.25, 2], [0.75, 0.25, 3], [1, 0.25, 4], [1.25, 0.25, 3], [1.5, 0.25, 2], [1.75, 0.25, 1], [2, 1, 0], [3, 1, 2]], 12);

export const LATIN = [
  build({ label: "Latin", title: "Salsa Montuno in A Minor", bpm: 180, key: 9, prog: [[0, "m", 2], [5, "m"], [7, "7"]], rh: alt(montunoA, montunoB), lh: tumbao, fill: latinFill }),
  build({ label: "Latin", title: "Cha-Cha-Chá Groove", bpm: 116, key: 0, prog: [[0, "M"], [5, "M"], [0, "M"], [7, "7"]], rh: alt(montunoA, montunoB), lh: chaCha }),
  build({ label: "Latin", title: "Bossa Nova in D Minor", bpm: 132, key: 2, prog: [[0, "m7"], [5, "m7"], [10, "7"], [3, "M7"]], rh: bossaR, lh: bossaB }),
  build({ label: "Latin", title: "Samba Pulse in C", bpm: 104, key: 0, prog: [[0, "M7"], [9, "m7"], [2, "m7"], [7, "7"]], rh: hits([[0, 0.5], [0.75, 0.5], [1.5, 0.5], [2.25, 0.5], [3, 0.5]]), lh: sambaBass }),
  build({ label: "Latin", title: "Tresillo Habanera", bpm: 96, key: 4, prog: [[0, "m", 2], [7, "7", 2]], rh: hits([[0, 1.5], [1.5, 1.5], [3, 1]]), lh: tresillo }),
  build({ label: "Latin", title: "Merengue Rush", bpm: 150, key: 5, prog: [[0, "M"], [7, "7"], [0, "M"], [7, "7"]], rh: alt(montunoA, montunoB), lh: merengue }),
  build({ label: "Latin", title: "Bolero Ballad", bpm: 74, key: 7, prog: [[0, "M"], [9, "m"], [2, "m"], [7, "7"]], rh: RH.arp([0, 1, 2, 1, 2, 1]), lh: tresillo }),
  build({ label: "Latin", title: "Cumbia in E Minor", bpm: 88, key: 4, prog: [[0, "m", 2], [7, "7", 2]], rh: hits([[0.5, 0.5], [1.5, 0.5], [2.5, 0.5], [3.5, 0.5]]), lh: bassLine([[0, 1, 0], [1, 0.5, 7], [2, 1, 0], [3, 0.5, 7]]) }),
  build({ label: "Latin", title: "Mambo Guajeo", bpm: 190, key: 0, prog: [[0, "M", 2], [5, "M"], [7, "7"]], rh: guajeo, lh: tumbao, fill: latinFill }),
  build({ label: "Latin", title: "Latin Jazz Vamp", bpm: 150, key: 2, prog: [[0, "m7", 2], [5, "7", 2]], rh: alt(montunoA, montunoB), lh: tresillo, fill: latinFill }),
];

/* ---------------- Gospel ---------------- */
const walkUp = bassLine([[0, 1, 0], [1, 1, 2], [2, 1, 4], [3, 1, 5]]);
const walkDown = bassLine([[0, 1, 0], [1, 1, -1], [2, 1, -3], [3, 1, -5]]);
const shout = hits([[0, 0.75], [0.75, 0.75], [1.5, 0.5], [2, 0.75], [2.75, 0.25], [3, 1]]);
const swell = hits([[0, 3], [3, 1]]);
const gospelPulse = hits([[0, 0.5], [1, 0.5], [2, 0.5], [3, 0.5]]);
const hymn = RH.halves;
const choirCall = riff([[0, 0.5, 12], [0.5, 0.5, 16], [1, 1, 19], [2, 0.5, 16], [2.5, 0.5, 12], [3, 1, 7]]);
const gospelFill = toneRiff([[0, 0.5, 3], [0.5, 0.5, 2], [1, 0.5, 1], [1.5, 0.5, 2], [2, 0.5, 3], [2.5, 0.5, 4], [3, 1, 2]]);

export const GOSPEL = [
  build({ label: "Gospel", title: "Amen Cadence (IV–I)", bpm: 66, key: 0, prog: [[5, "M", 2], [0, "M", 2]], rh: swell, lh: LH.rootFifth }),
  build({ label: "Gospel", title: "Sunday Shout in B♭", bpm: 120, key: -2, prog: [[0, "M"], [5, "M"], [0, "M"], [7, "7"]], rh: shout, lh: walkUp, fill: gospelFill }),
  build({ label: "Gospel", title: "Gospel Walk-Up C to F", bpm: 76, key: 0, prog: [[0, "M"], [5, "M"], [0, "M"], [5, "M"]], rh: swell, lh: walkUp }),
  build({ label: "Gospel", title: "Church Ballad in E♭", bpm: 62, key: 3, prog: [[0, "M"], [5, "M"], [9, "m7"], [7, "7"]], rh: RH.arp([0, 1, 2, 1, 2, 1]), lh: LH.root }),
  build({ label: "Gospel", title: "Praise Break Vamp", bpm: 132, key: 0, prog: [[0, "M", 2], [5, "M", 2]], rh: shout, lh: LH.octEighths }),
  build({ label: "Gospel", title: "Southern Gospel Shuffle", bpm: 100, key: 7, prog: [[0, "M"], [0, "M"], [5, "M"], [7, "7"]], rh: shout, lh: boomChick, fill: gospelFill }),
  build({ label: "Gospel", title: "Hymn Harmony in F", bpm: 72, key: 5, prog: [[0, "M"], [5, "M"], [0, "M"], [7, "7"]], rh: hymn, lh: LH.octaves }),
  build({ label: "Gospel", title: "Call and Response", bpm: 90, key: 0, prog: [[0, "M"], [5, "M"], [0, "M"], [7, "7"]], rh: alt(choirCall, swell), lh: walkDown }),
  build({ label: "Gospel", title: "Worship Pads (I–V–vi–IV)", bpm: 68, key: 2, prog: [[0, "M"], [7, "M"], [9, "m"], [5, "M"]], rh: RH.hold, lh: LH.rootFifth }),
  build({ label: "Gospel", title: "Choir Stabs in A", bpm: 108, key: 9, prog: [[0, "M"], [5, "M"], [7, "M"], [0, "M"]], rh: gospelPulse, lh: walkUp, fill: gospelFill }),
];

/* ---------------- Synth / EDM ---------------- */
const arp16 = (idx: number[]) => RH.arp(idx, 0.25);
const oct16: Pattern = (p, v, bpb) => {
  for (let i = 0; i < bpb * 4; i++) p.add(v.bass + (i % 2 ? 12 : 0), 0.25, 0.8);
};
const houseStabs = hits([[0.5, 0.35], [1.5, 0.35], [2.5, 0.35], [3.5, 0.35]]);
const tranceHits = hits([[0, 0.25], [0.75, 0.25], [1.5, 0.25], [2, 0.25], [2.75, 0.25], [3.5, 0.25]]);
const kickBass = bassLine([[0, 0.5, 0], [1, 0.5, 0], [2, 0.5, 0], [3, 0.5, 0]]);
const synthLead = riff([[0, 0.75, 12], [0.75, 0.75, 15], [1.5, 0.5, 19], [2, 1, 17], [3, 1, 15]]);
const SYNTH_PROG: Prog = [[0, "m"], [8, "M"], [3, "M"], [10, "M"]];

export const SYNTH = [
  build({ label: "Synth / EDM", title: "Neon Drive", bpm: 118, key: 9, prog: SYNTH_PROG, rh: arp16([0, 1, 2, 1]), lh: LH.octEighths }),
  build({ label: "Synth / EDM", title: "Night Rider Arp", bpm: 108, key: 4, prog: SYNTH_PROG, rh: arp16([0, 2, 1, 2, 3, 2, 1, 2]), lh: oct16 }),
  build({ label: "Synth / EDM", title: "Retro Sunset", bpm: 92, key: 0, prog: [[9, "m"], [5, "M"], [0, "M"], [7, "M"]], rh: synthLead, lh: LH.rootFifth }),
  build({ label: "Synth / EDM", title: "Chillwave Haze", bpm: 84, key: 5, prog: [[0, "M7"], [4, "m7"], [9, "m7"], [7, "7"]], rh: RH.hold, lh: LH.root }),
  build({ label: "Synth / EDM", title: "Trance Pluck", bpm: 138, key: 2, prog: [[0, "m"], [8, "M"], [3, "M"], [10, "M"]], rh: tranceHits, lh: oct16 }),
  build({ label: "Synth / EDM", title: "Future Bass Chords", bpm: 150, key: 7, prog: [[0, "M7"], [4, "m7"], [5, "M7"], [7, "M"]], rh: hits([[0, 0.75], [0.75, 0.75], [1.5, 1.5], [3.5, 0.5]]), lh: LH.octaves }),
  build({ label: "Synth / EDM", title: "Big Room Build", bpm: 128, key: 0, prog: [[9, "m"], [5, "M"], [0, "M"], [7, "M"]], rh: RH.pulse, lh: kickBass }),
  build({ label: "Synth / EDM", title: "Italo House Stabs", bpm: 124, key: 9, prog: [[0, "m7", 2], [5, "m7", 2]], rh: houseStabs, lh: kickBass }),
  build({ label: "Synth / EDM", title: "Dreamy Synth Pop", bpm: 100, key: 7, prog: [[0, "M"], [7, "M"], [9, "m"], [5, "M"]], rh: arp16([0, 1, 2, 3, 2, 1, 2, 1]), lh: LH.octaves }),
  build({ label: "Synth / EDM", title: "Pulse Bassline", bpm: 112, key: 11, prog: [[0, "m", 2], [8, "M"], [10, "M"]], rh: synthLead, lh: oct16 }),
];
