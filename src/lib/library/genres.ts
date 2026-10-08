import type { Song } from "../song";
import { LH, Part, RH, progression, type ChordType, type Pattern } from "./dsl";

type Spot = [start: number, dur: number];
type Note = [start: number, dur: number, semis: number];
type Prog = [off: number, type: ChordType, bars?: number][];

const hits = (spots: Spot[]): Pattern => (p, v, bpb) => {
  const t0 = p.t;
  for (const [s, d] of spots) {
    p.t = t0 + s;
    p.add(v.rh, d, 0.9);
  }
  p.t = t0 + bpb;
};

const place = (base: (v: { root: number; bass: number }) => number): ((n: Note[]) => Pattern) => (notes) => (p: Part, v, bpb) => {
  const t0 = p.t;
  for (const [s, d, semis] of notes) {
    p.t = t0 + s;
    p.add(base(v) + semis, d, 0.9);
  }
  p.t = t0 + bpb;
};

const bassLine = place((v) => v.bass);
const riff = place((v) => v.root);

function mk(label: string, title: string, bpm: number, key: number, prog: Prog, rh: Pattern, lh: Pattern): () => Song {
  return () =>
    progression({
      title,
      composer: label,
      bpm,
      key,
      prog: prog.map(([off, type, bars]) => ({ off, type, bars })),
      loops: 2,
      rh,
      lh,
    });
}

const lofi = (t: string, bpm: number, key: number, prog: Prog, rh: Pattern, lh: Pattern) => mk("Lo-Fi", t, bpm, key, prog, rh, lh);
const rnb = (t: string, bpm: number, key: number, prog: Prog, rh: Pattern, lh: Pattern) => mk("R&B / Soul", t, bpm, key, prog, rh, lh);
const hip = (t: string, bpm: number, key: number, prog: Prog, rh: Pattern, lh: Pattern) => mk("Hip-Hop", t, bpm, key, prog, rh, lh);
const rock = (t: string, bpm: number, key: number, prog: Prog, rh: Pattern, lh: Pattern) => mk("Rock", t, bpm, key, prog, rh, lh);
const funk = (t: string, bpm: number, key: number, prog: Prog, rh: Pattern, lh: Pattern) => mk("Funk", t, bpm, key, prog, rh, lh);

const lazy1 = hits([[0, 1.5], [1.5, 1], [3, 1]]);
const lazy2 = hits([[0, 2], [2.5, 1.5]]);
const lazy3 = hits([[0.5, 1], [2, 0.5], [3, 1]]);
const lfBass1 = bassLine([[0, 1.5, 0], [2, 0.5, 0], [3, 1, 7]]);
const lfBass2 = bassLine([[0, 2, 0], [2.5, 1.5, 7]]);
const lfBass3 = bassLine([[0, 1, 0], [1.5, 0.5, 12], [2, 2, 7]]);
const plink = riff([[0.5, 0.5, 7], [1, 0.5, 11], [2.5, 0.5, 14], [3, 1, 11]]);

export const LOFI = [
  lofi("Study Beat", 78, 0, [[0, "M7"], [9, "m7"], [2, "m7"], [7, "7"]], lazy3, lfBass1),
  lofi("Rainy Window", 72, 0, [[5, "M7"], [4, "m7"], [2, "m7"], [0, "M7"]], lazy1, lfBass2),
  lofi("Late Night Keys", 80, 0, [[2, "m7"], [7, "7"], [0, "M7", 2]], lazy2, lfBass3),
  lofi("Tape Hiss in A Minor", 70, 9, [[0, "m7"], [5, "m7"], [10, "7"], [3, "M7"]], lazy3, lfBass2),
  lofi("Sunday Morning", 84, 7, [[0, "M7"], [9, "m7"], [2, "m7"], [7, "7"]], lazy1, lfBass1),
  lofi("Chillhop Arpeggios", 82, 0, [[0, "M7"], [4, "m7"], [5, "M7"], [7, "7"]], RH.arp([0, 1, 2, 3, 2, 1]), lfBass3),
  lofi("Jazzy Dusk", 76, 2, [[5, "M7"], [7, "7"], [4, "m7"], [9, "m7"]], lazy2, lfBass1),
  lofi("Vinyl Crackle", 68, 4, [[9, "m7"], [2, "m7"], [7, "7"], [0, "M7"]], plink, lfBass2),
  lofi("Slow Bounce", 74, -2, [[0, "M7"], [9, "m7"], [2, "m7"], [7, "7"]], lazy3, lfBass3),
  lofi("Dreamy Pads", 66, 5, [[0, "M7"], [2, "m7"], [4, "m7"], [5, "M7"]], RH.hold, LH.rootFifth),
];

export const RNB = [
  rnb("Neo-Soul Vamp", 78, 0, [[2, "m7"], [7, "7"], [0, "M7"], [9, "m7"]], hits([[0, 0.75], [0.75, 0.75], [1.5, 0.5], [2.5, 1.5]]), bassLine([[0, 1.5, 0], [1.5, 0.5, 7], [2, 1, 0], [3.5, 0.5, 10]])),
  rnb("Slow Jam in E♭", 62, 3, [[0, "M7"], [5, "M7"], [4, "m7"], [7, "7"]], hits([[0, 2], [2, 1], [3, 1]]), bassLine([[0, 2, 0], [2, 2, 7]])),
  rnb("Quiet Storm", 66, 5, [[0, "M7"], [4, "m7"], [5, "M7"], [7, "7"]], hits([[0, 1], [1.5, 0.5], [2, 1], [3.5, 0.5]]), bassLine([[0, 1, 0], [1, 0.5, 0], [2.5, 0.5, 0], [3, 1, 7]])),
  rnb("Gospel Walk-Up", 72, 0, [[0, "M"], [5, "M"], [0, "M"], [7, "7"]], RH.halves, LH.walk),
  rnb("Smooth Groove in A♭", 84, -4, [[0, "M7"], [9, "m7"], [2, "m7"], [7, "7"]], hits([[0, 0.75], [1, 0.5], [2, 0.75], [3, 0.5]]), bassLine([[0, 1, 0], [1.5, 0.5, 7], [2.5, 0.5, 12], [3, 1, 7]])),
  rnb("Falsetto Ballad", 60, 7, [[0, "M"], [7, "M"], [9, "m"], [5, "M"]], RH.arp([0, 1, 2, 1]), LH.root),
  rnb("90s Slow Dance", 68, 2, [[9, "m7"], [2, "m7"], [7, "7"], [0, "M7"]], hits([[0, 1.5], [1.5, 0.5], [2, 2]]), bassLine([[0, 1.5, 0], [2, 2, 0]])),
  rnb("Motown Pulse", 110, 0, [[0, "M"], [5, "M"], [0, "M"], [7, "M"]], RH.quarters, bassLine([[0, 1, 0], [1, 0.5, 7], [1.5, 0.5, 0], [2, 1, 4], [3, 1, 7]])),
  rnb("Late Night Rhodes", 70, 4, [[0, "m7"], [5, "m7"], [10, "7"], [3, "M7"]], hits([[0.5, 1], [2, 1], [3.5, 0.5]]), bassLine([[0, 2, 0], [3, 1, 5]])),
  rnb("Soul Shuffle in C", 96, 0, [[0, "7"], [5, "7"], [0, "7"], [7, "7"]], hits([[0, 0.5], [1, 0.5], [2, 0.5], [3, 0.5]]), LH.boogie),
];

const boom = bassLine([[0, 0.75, 0], [1.5, 0.5, 0], [2.5, 0.5, 0], [3, 1, -2]]);
const trap = bassLine([[0, 2, 0], [2.5, 0.5, 0], [3, 1, 0]]);
const dark = hits([[0, 0.5], [1.5, 0.5], [2, 0.5], [3.5, 0.5]]);
const slab = hits([[0, 3], [3.5, 0.5]]);
const hhRiff = riff([[0, 0.5, 0], [0.5, 0.5, 3], [1.5, 0.5, 7], [2, 1, 5], [3.5, 0.5, 3]]);

export const HIPHOP = [
  hip("Boom Bap in A Minor", 90, 9, [[0, "m7"], [5, "m7"]], dark, boom),
  hip("Dusty Sample Loop", 86, 2, [[0, "m7"], [10, "M7"], [3, "M7"], [10, "7"]], hhRiff, boom),
  hip("Trap Minor", 140, 6, [[0, "m"], [8, "M"], [3, "M"], [10, "M"]], slab, trap),
  hip("East Coast Piano", 92, 0, [[9, "m7"], [2, "m7"]], hhRiff, boom),
  hip("Cinematic Rap Intro", 80, 4, [[0, "m"], [8, "M"], [10, "M"], [7, "M"]], slab, trap),
  hip("West Coast Whine", 94, 7, [[0, "m7"], [5, "7"]], RH.offbeat, bassLine([[0, 1, 0], [1.5, 0.5, 7], [2, 1, 0], [3, 1, 7]])),
  hip("Soul Chop", 88, -2, [[0, "M7"], [2, "m7"], [4, "m7"], [5, "M7"]], dark, boom),
  hip("Drill Bell Melody", 142, 11, [[0, "m"], [8, "M"], [7, "M"], [0, "m"]], riff([[0, 0.5, 12], [0.5, 0.5, 15], [1, 0.5, 19], [2, 0.5, 15], [2.5, 0.5, 12], [3.5, 0.5, 7]]), trap),
  hip("Jazz-Rap Chords", 86, 5, [[2, "m7"], [7, "7"], [0, "M7"], [0, "M7"]], hits([[0, 1.5], [2, 1], [3.5, 0.5]]), boom),
  hip("Late 90s Underground", 91, 0, [[9, "m"], [7, "M"], [5, "M"], [4, "7"]], dark, trap),
];

const rk1 = riff([[0, 0.5, 0], [0.5, 0.5, 0], [1, 0.5, 3], [1.5, 0.5, 5], [2, 1, 7], [3, 1, 5]]);
const rk2 = riff([[0, 1, 12], [1, 0.5, 10], [1.5, 0.5, 7], [2, 1, 5], [3, 0.5, 3], [3.5, 0.5, 0]]);
const stabs = hits([[0, 1], [1.5, 0.5], [2, 1], [3.5, 0.5]]);
const quarterBass = bassLine([[0, 1, 0], [1, 1, 0], [2, 1, 0], [3, 1, 0]]);

export const ROCK = [
  rock("Power Chords I–IV–V", 120, 0, [[0, "5"], [5, "5"], [7, "5"], [0, "5"]], RH.pulse, LH.octEighths),
  rock("Mixolydian Rock (I–♭VII–IV)", 124, 4, [[0, "5"], [10, "5"], [5, "5"], [0, "5"]], RH.pulse, LH.octEighths),
  rock("Minor Rock (i–♭VI–♭VII)", 112, 9, [[0, "5"], [8, "5"], [10, "5"], [0, "5"]], stabs, quarterBass),
  rock("Classic Riff in E", 132, 4, [[0, "5", 2], [5, "5"], [7, "5"]], rk1, LH.octEighths),
  rock("Stadium Anthem", 104, 7, [[0, "M"], [7, "M"], [9, "m"], [5, "M"]], RH.halves, LH.octaves),
  rock("Punk Eighths", 168, 2, [[0, "5"], [5, "5"], [7, "5"], [5, "5"]], RH.pulse, LH.octEighths),
  rock("Blues Rock Shuffle", 118, 9, [[0, "7", 2], [5, "7"], [7, "7"]], rk2, LH.boogie),
  rock("Rock Ballad", 74, 0, [[0, "M"], [7, "M"], [9, "m"], [5, "M"]], RH.arp([0, 1, 2, 1]), LH.rootFifth),
  rock("Hard Rock Gallop", 140, 4, [[0, "5"], [3, "5"], [5, "5"], [7, "5"]], rk1, bassLine([[0, 0.5, 0], [0.5, 0.25, 0], [0.75, 0.25, 0], [1, 0.5, 0], [1.5, 0.25, 0], [1.75, 0.25, 0], [2, 0.5, 0], [2.5, 0.25, 0], [2.75, 0.25, 0], [3, 0.5, 0], [3.5, 0.5, 7]])),
  rock("Southern Boogie", 126, 7, [[0, "7", 2], [5, "7"], [0, "7"], [7, "7"]], rk2, LH.boogie),
];

const f1 = hits([[0, 0.25], [0.5, 0.25], [0.75, 0.25], [1.5, 0.25], [2, 0.5], [3, 0.25], [3.5, 0.25]]);
const f2 = hits([[0.5, 0.25], [1, 0.25], [1.75, 0.25], [2.5, 0.25], [3, 0.5]]);
const fb1 = bassLine([[0, 0.5, 0], [0.75, 0.25, 12], [1.5, 0.5, 0], [2, 0.5, 7], [2.75, 0.25, 12], [3.5, 0.5, 10]]);
const fb2 = bassLine([[0, 0.25, 0], [0.5, 0.25, 12], [1, 0.5, 0], [2, 0.25, 0], [2.5, 0.25, 12], [3, 0.5, 7], [3.5, 0.5, 10]]);
const fRiff = riff([[0, 0.25, 0], [0.25, 0.25, 3], [0.5, 0.25, 5], [1, 0.5, 7], [1.75, 0.25, 5], [2, 0.5, 3], [3, 0.5, 0]]);

export const FUNK = [
  funk("One-Chord Funk (E9)", 104, 4, [[0, "7", 4]], f1, fb1),
  funk("Clav Stabs in A", 100, 9, [[0, "7", 2], [5, "7", 2]], f2, fb2),
  funk("Minor Funk Vamp", 98, 2, [[0, "m7", 2], [5, "7", 2]], f1, fb2),
  funk("Disco Octaves", 116, 0, [[0, "m7"], [5, "7"], [0, "m7"], [7, "7"]], f2, LH.octEighths),
  funk("Slap Line in G", 108, 7, [[0, "7", 2], [5, "7"], [0, "7"], [7, "7"]], fRiff, fb1),
  funk("Chicken Scratch", 112, 5, [[0, "7", 4]], f1, fb1),
  funk("Soul Funk Groove", 96, 0, [[0, "7"], [5, "7"], [0, "7"], [5, "7"]], f2, fb2),
  funk("Smooth Funk in B♭", 102, -2, [[0, "M7"], [5, "7"], [2, "m7"], [7, "7"]], f1, fb1),
  funk("Night Drive Groove", 106, 9, [[0, "m7", 2], [10, "7"], [7, "7"]], fRiff, fb2),
  funk("Pocket Riff in D", 110, 2, [[0, "7", 2], [5, "7", 2]], fRiff, fb1),
];
