import type { Song } from "../song";
import { LH, Part, RH, makeSong, progression, voicing, wrap, type ChordSpec, type Pattern } from "./dsl";

type Lick = [number | null, number][];

const LICKS: Record<string, Lick> = {
  A: [[0, 1], [3, 0.5], [5, 0.5], [6, 0.5], [7, 0.5], [10, 1]],
  B: [[12, 0.5], [10, 0.5], [7, 1], [5, 0.5], [3, 0.5], [0, 1]],
  C: [[7, 0.5], [10, 0.5], [12, 0.5], [10, 0.5], [7, 0.5], [6, 0.5], [5, 0.5], [3, 0.5]],
  D: [[0, 0.5], [3, 0.5], [5, 0.5], [7, 0.5], [10, 1], [7, 0.5], [5, 0.5]],
  E: [[7, 1.5], [10, 0.5], [12, 2]],
  F: [[12, 0.5], [12, 0.5], [10, 0.5], [7, 0.5], [null, 1], [5, 0.5], [7, 0.5]],
  G: [[10, 0.5], [12, 0.5], [10, 0.5], [7, 0.5], [5, 1], [3, 0.5], [0, 0.5]],
  H: [[7, 1], [6, 0.5], [5, 0.5], [3, 1], [0, 1]],
};

const BLUES_BARS = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7];

const BLUES_LH: Record<string, Pattern> = {
  boogie: LH.boogie,
  minorBoogie: (p, v) => {
    for (const o of [0, 3, 7, 9, 10, 9, 7, 3]) p.add(v.bass + o, 0.5);
  },
  walk: LH.walk,
  shuffle: (p, v) => {
    for (const o of [0, 7, 9, 7]) p.add(v.bass + o, 1, 0.8);
  },
  rock: LH.octEighths,
  slow: (p, v) => {
    p.add([v.bass, v.bass + 10], 2, 0.95);
    p.add([v.bass + 4, v.bass + 10], 2, 0.95);
  },
};

function blues(o: {
  title: string;
  key: number;
  lh: keyof typeof BLUES_LH;
  licks: string;
  bpm: number;
}): Song {
  const R = new Part("R");
  const L = new Part("L");
  BLUES_BARS.forEach((rel, bar) => {
    const pc = o.key + rel;
    const v = voicing(pc, "7");
    BLUES_LH[o.lh](L, v, 4);
    const base = 60 + wrap(pc);
    const lick = LICKS[bar === 11 ? "H" : o.licks[bar % o.licks.length]];
    for (const [off, dur] of lick) R.add(off === null ? null : base + off, dur);
  });
  return makeSong(o.title, "Blues lick", o.bpm, 4, [R, L]);
}

export const BLUES: (() => Song)[] = [
  () => blues({ title: "Boogie Woogie in C", key: 0, lh: "boogie", licks: "ABCDEFGA", bpm: 100 }),
  () => blues({ title: "Slow Blues in G", key: 7, lh: "slow", licks: "EBDGAFCB", bpm: 66 }),
  () => blues({ title: "Walking Blues in F", key: 5, lh: "walk", licks: "CGABFEDB", bpm: 108 }),
  () => blues({ title: "Shuffle in A", key: 9, lh: "shuffle", licks: "ADBGCFEA", bpm: 112 }),
  () => blues({ title: "Texas Boogie in E", key: 4, lh: "boogie", licks: "BEAGDCFB", bpm: 120 }),
  () => blues({ title: "Minor Blues in C", key: 0, lh: "minorBoogie", licks: "DBEACGFD", bpm: 92 }),
  () => blues({ title: "Jump Blues in B♭", key: 10, lh: "rock", licks: "CFAEBDGC", bpm: 128 }),
  () => blues({ title: "Gospel Blues in D", key: 2, lh: "slow", licks: "EGBEDAFE", bpm: 72 }),
  () => blues({ title: "Delta Riff in E", key: 4, lh: "rock", licks: "AAFBAAGE", bpm: 96 }),
  () => blues({ title: "Rock 'n' Roll in C", key: 0, lh: "rock", licks: "CGCFBEDA", bpm: 136 }),
];

interface JazzLick {
  name: string;
  rh: string[];
}

const JAZZ_LICKS: JazzLick[] = [
  {
    name: "Arpeggio Climb",
    rh: [
      "F4:.5 A4:.5 C5:.5 E5:.5 D5:.5 C5:.5 A4:.5 F4:.5",
      "G4:.5 B4:.5 D5:.5 F5:.5 E5:.5 D5:.5 B4:.5 G4:.5",
      "E4:.5 G4:.5 B4:.5 C5:.5 E5:2",
      "B4:1 C5:3",
    ],
  },
  {
    name: "Enclosure",
    rh: [
      "D5:.5 C5:.5 A4:.5 F4:.5 A4:1 D5:1",
      "B4:.5 C5:.5 D5:.5 B4:.5 G4:.5 F4:.5 D4:1",
      "E4:1 G4:.5 B4:.5 C5:2",
      "E5:2 C5:2",
    ],
  },
  {
    name: "Bebop Descent",
    rh: [
      "C5:.5 B4:.5 A4:.5 G4:.5 F4:.5 E4:.5 D4:.5 F4:.5",
      "G4:.5 A4:.5 B4:.5 D5:.5 F5:.5 D5:.5 B4:.5 G4:.5",
      "E5:1 D5:.5 C5:.5 B4:.5 A4:.5 G4:1",
      "C4:4",
    ],
  },
  {
    name: "Rhythmic Thirds",
    rh: [
      "F4:1 A4:1 C5:1 E5:1",
      "D5:1 B4:1 G4:1 F4:1",
      "E4:1 G4:1 B4:1 E5:1",
      "D5:2 C5:2",
    ],
  },
  {
    name: "Syncopated Line",
    rh: [
      "r:.5 D4:.5 F4:.5 A4:.5 C5:1.5 A4:.5",
      "B4:.5 D5:.5 F5:1 E5:.5 D5:.5 B4:1",
      "C5:1.5 B4:.5 G4:1 E4:1",
      "E4:2 C4:2",
    ],
  },
];

const CHARLESTON = (p: Part, chord: number[]) => {
  p.add(chord, 1.5, 0.95);
  p.add(chord, 2.5, 0.95);
};

const II_V_I_LH = [[50, 53, 60], [43, 53, 59], [48, 52, 59], [48, 52, 59]];

function iiVI(title: string, shift: number, lickIdx: number, bpm: number): Song {
  const R = new Part("R");
  const L = new Part("L");
  for (let loop = 0; loop < 2; loop++) {
    JAZZ_LICKS[lickIdx].rh.forEach((bar) => R.text(bar, shift));
    II_V_I_LH.forEach((c) => CHARLESTON(L, c.map((m) => m + shift)));
  }
  return makeSong(title, `Jazz lick · ${JAZZ_LICKS[lickIdx].name}`, bpm, 4, [R, L]);
}

function jazzLines(title: string, bars: { rh: string; lh: number[] }[], bpm: number, name: string): Song {
  const R = new Part("R");
  const L = new Part("L");
  for (let loop = 0; loop < 2; loop++) {
    for (const b of bars) {
      R.text(b.rh);
      CHARLESTON(L, b.lh);
    }
  }
  return makeSong(title, name, bpm, 4, [R, L]);
}

function bebopScale(): Song {
  const scale = [79, 78, 77, 76, 74, 72, 71, 69, 67];
  const R = new Part("R");
  const L = new Part("L");
  const run = [...scale, ...[...scale].reverse().slice(1)];
  for (let i = 0; i < 32; i++) R.add(run[i % run.length], 0.5);
  for (let b = 0; b < 4; b++) CHARLESTON(L, [43, 53, 59]);
  return makeSong("Bebop Dominant Scale (G7)", "Jazz lick · scale run", 112, 4, [R, L]);
}

function rootless(): Song {
  const chords = [
    { r: [65, 69, 72, 76], l: [38, 45] },
    { r: [59, 64, 65, 69], l: [43, 50] },
    { r: [64, 67, 71, 74], l: [48, 55] },
    { r: [64, 67, 71, 74], l: [48, 55] },
  ];
  const R = new Part("R");
  const L = new Part("L");
  for (let loop = 0; loop < 2; loop++) {
    for (const c of chords) {
      CHARLESTON(R, c.r);
      L.add(c.l, 2, 0.95);
      L.add(c.l, 2, 0.95);
    }
  }
  return makeSong("Rootless Voicing Comping", "Jazz lick · comping", 100, 4, [R, L]);
}

const bossaRh: Pattern = (p, v) => {
  p.add(v.rh, 1.5);
  p.add(v.rh, 1);
  p.rest(0.5);
  p.add(v.rh, 1);
};
const bossaLh: Pattern = (p, v) => {
  p.add(v.bass, 1.5);
  p.add(v.bass + 7, 1.5);
  p.add(v.bass + 12, 1);
};

export const JAZZ: (() => Song)[] = [
  () => iiVI("ii–V–I in C · Arpeggio Climb", 0, 0, 100),
  () => iiVI("ii–V–I in F · Enclosure", 5, 1, 104),
  () => iiVI("ii–V–I in B♭ · Bebop Descent", -2, 2, 108),
  () => iiVI("ii–V–I in G · Rhythmic Thirds", -5, 3, 96),
  () => iiVI("ii–V–I in E♭ · Syncopated Line", 3, 4, 112),
  bebopScale,
  () =>
    jazzLines(
      "Minor ii–V–i in C",
      [
        { rh: "F4:.5 Ab4:.5 C5:.5 D5:.5 C5:.5 Ab4:.5 F4:1", lh: [50, 53, 60] },
        { rh: "G4:.5 B4:.5 D5:.5 Ab5:.5 G5:.5 F5:.5 D5:.5 B4:.5", lh: [43, 53, 59] },
        { rh: "C5:1 Eb5:1 G5:1 Eb5:1", lh: [48, 51, 58] },
        { rh: "C5:4", lh: [48, 51, 58] },
      ],
      88,
      "Jazz lick · minor cadence",
    ),
  () =>
    jazzLines(
      "Tritone Substitution Turnaround",
      [
        { rh: "F4:.5 A4:.5 C5:1 A4:.5 F4:.5 D4:1", lh: [50, 53, 60] },
        { rh: "Db5:.5 C5:.5 B4:.5 Ab4:.5 F4:1 Ab4:.5 Db5:.5", lh: [49, 53, 59] },
        { rh: "C5:1 B4:1 G4:1 E4:1", lh: [48, 52, 59] },
        { rh: "C5:4", lh: [48, 52, 59] },
      ],
      100,
      "Jazz lick · tritone sub",
    ),
  rootless,
  () =>
    progression({
      title: "Bossa Nova Comping",
      composer: "Jazz groove",
      bpm: 128,
      prog: [
        { off: 0, type: "M7" },
        { off: 2, type: "m7" },
        { off: 7, type: "7" },
        { off: 0, type: "M7" },
      ],
      rh: bossaRh,
      lh: bossaLh,
    }),
];

const A_PROG: ChordSpec[] = [
  { off: 0, type: "M" },
  { off: 7, type: "M" },
  { off: 9, type: "m" },
  { off: 5, type: "M" },
];

export const POP: (() => Song)[] = [
  () => progression({ title: "Axis Progression in C (I–V–vi–IV)", bpm: 100, prog: A_PROG, rh: RH.arp([0, 1, 2, 1]), lh: LH.octaves }),
  () => progression({ title: "Axis Progression in G", bpm: 104, key: 7, prog: A_PROG, rh: RH.pulse, lh: LH.rootFifth }),
  () =>
    progression({
      title: "50s Doo-Wop (I–vi–IV–V)",
      bpm: 92,
      prog: [{ off: 0, type: "M" }, { off: 9, type: "m" }, { off: 5, type: "M" }, { off: 7, type: "M" }],
      rh: RH.quarters,
      lh: LH.rootFifth,
    }),
  () =>
    progression({
      title: "Singer-Songwriter (vi–IV–I–V)",
      bpm: 88,
      prog: [{ off: 9, type: "m" }, { off: 5, type: "M" }, { off: 0, type: "M" }, { off: 7, type: "M" }],
      rh: RH.arp([0, 1, 2, 3, 2, 1]),
      lh: LH.root,
    }),
  () =>
    progression({
      title: "Canon Progression in D",
      bpm: 80,
      key: 2,
      loops: 1,
      prog: [
        { off: 0, type: "M" },
        { off: 7, type: "M" },
        { off: 9, type: "m" },
        { off: 4, type: "m" },
        { off: 5, type: "M" },
        { off: 0, type: "M" },
        { off: 5, type: "M" },
        { off: 7, type: "M" },
      ],
      rh: RH.arp([0, 1, 2, 3, 2, 1, 2, 1]),
      lh: LH.octaves,
    }),
  () =>
    progression({
      title: "Cinematic Build (vi–V–IV–V)",
      bpm: 84,
      prog: [{ off: 9, type: "m" }, { off: 7, type: "M" }, { off: 5, type: "M" }, { off: 7, type: "M" }],
      rh: RH.halves,
      lh: LH.octEighths,
    }),
  () =>
    progression({
      title: "Moody Minor in E (i–VI–III–VII)",
      bpm: 90,
      key: 4,
      prog: [{ off: 0, type: "m" }, { off: 8, type: "M" }, { off: 3, type: "M" }, { off: 10, type: "M" }],
      rh: RH.offbeat,
      lh: LH.rootFifth,
    }),
  () =>
    progression({
      title: "Ballad in F",
      bpm: 72,
      key: 5,
      prog: [{ off: 0, type: "M7" }, { off: 5, type: "M7" }, { off: 9, type: "m7" }, { off: 7, type: "7" }],
      rh: RH.arp([0, 1, 2, 3, 2, 1]),
      lh: LH.root,
    }),
  () => progression({ title: "Dance Pulse in A", bpm: 124, key: 9, prog: A_PROG, rh: RH.pulse, lh: LH.octEighths }),
  () =>
    progression({
      title: "Gospel Pop in B♭",
      bpm: 80,
      key: 10,
      prog: [{ off: 0, type: "M" }, { off: 4, type: "m" }, { off: 5, type: "M" }, { off: 7, type: "7" }],
      rh: RH.halves,
      lh: LH.walk,
    }),
];
