import type { Song } from "../song";
import { Part, makeSong, progression, type Pattern } from "./dsl";

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

