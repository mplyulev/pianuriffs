import type { Song } from "../song";
import { noteNumber } from "../song";
import { LH, Part, RH, makeSong, progression, tone, type ChordSpec, type Pattern } from "./dsl";

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const HARMONIC = [0, 2, 3, 5, 7, 8, 11];
const PENT = [0, 2, 4, 7, 9];
const BLUES = [0, 3, 5, 6, 7, 10];
const CHROMATIC = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function scaleSong(title: string, rootName: string, ivs: number[], bpm = 84): Song {
  const R = new Part("R");
  const L = new Part("L");
  const rr = noteNumber(`${rootName}4`);
  const lr = noteNumber(`${rootName}3`);
  const span = ivs.length * (ivs.length === 12 ? 1 : 2);
  const degrees = [
    ...Array.from({ length: span + 1 }, (_, i) => i),
    ...Array.from({ length: span }, (_, i) => span - 1 - i),
  ];
  for (let rep = 0; rep < 2; rep++) {
    for (const d of degrees) {
      R.add(tone(rr, ivs, d), 0.5);
      L.add(tone(lr, ivs, d), 0.5);
    }
  }
  return makeSong(title, "Scale practice", bpm, 4, [R, L]);
}

function hanon(): Song {
  const R = new Part("R");
  const L = new Part("L");
  const pattern = [0, 2, 3, 4, 5, 4, 3, 2];
  const run = (rev: boolean) => {
    for (let k = 0; k < 8; k++) {
      const base = rev ? 7 - k : k;
      const notes = rev ? [...pattern].reverse() : pattern;
      for (const o of notes) {
        R.add(tone(60, MAJOR, base + o), 0.5);
        L.add(tone(48, MAJOR, base + o), 0.5);
      }
    }
  };
  run(false);
  run(true);
  return makeSong("Finger Dexterity (Hanon style)", "Finger exercise", 76, 4, [R, L]);
}

const cadence: ChordSpec[] = [
  { off: 0, type: "M" },
  { off: 5, type: "M" },
  { off: 7, type: "M" },
  { off: 0, type: "M" },
];

const inversions: Pattern = (p, v) => {
  const [a, b, c] = v.rh;
  const inv = [[a, b, c], [b, c, a + 12], [c, a + 12, b + 12]];
  for (const chord of [...inv, inv[1], inv[0]]) p.add(chord, 0.8, 0.9);
};

export const SCALES: (() => Song)[] = [
  () => scaleSong("C Major Scale", "C", MAJOR),
  () => scaleSong("G Major Scale", "G", MAJOR),
  () => scaleSong("F Major Scale", "F", MAJOR),
  () => scaleSong("D Major Scale", "D", MAJOR),
  () => scaleSong("A Natural Minor Scale", "A", MINOR),
  () => scaleSong("A Harmonic Minor Scale", "A", HARMONIC),
  () => scaleSong("C Major Pentatonic", "C", PENT, 96),
  () => scaleSong("A Blues Scale", "A", BLUES, 90),
  () => scaleSong("C Chromatic Scale", "C", CHROMATIC, 72),
  hanon,
];

export const CHORDS: (() => Song)[] = [
  () =>
    progression({
      title: "C Major Arpeggios",
      bpm: 80,
      prog: cadence,
      rh: RH.arp([0, 1, 2, 3, 2, 1, 0, 1]),
      lh: LH.rootFifth,
    }),
  () =>
    progression({
      title: "G Major Arpeggios",
      bpm: 80,
      key: 7,
      prog: cadence,
      rh: RH.arp([0, 1, 2, 3, 2, 1, 0, 1]),
      lh: LH.rootFifth,
    }),
  () =>
    progression({
      title: "A Minor Arpeggios",
      bpm: 76,
      key: 9,
      prog: [
        { off: 0, type: "m" },
        { off: 5, type: "m" },
        { off: 7, type: "M" },
        { off: 0, type: "m" },
      ],
      rh: RH.arp([0, 1, 2, 3, 2, 1, 0, 1]),
      lh: LH.rootFifth,
    }),
  () =>
    progression({
      title: "Rolling Arpeggios (C–Am–F–G)",
      bpm: 84,
      prog: [
        { off: 0, type: "M" },
        { off: 9, type: "m" },
        { off: 5, type: "M" },
        { off: 7, type: "M" },
      ],
      rh: RH.arp([0, 1, 2, 3, 2, 1, 2, 1]),
      lh: LH.octaves,
    }),
  () =>
    progression({
      title: "Seventh Chord Arpeggios",
      bpm: 76,
      prog: [
        { off: 0, type: "M7" },
        { off: 2, type: "m7" },
        { off: 7, type: "7" },
        { off: 0, type: "M7" },
      ],
      rh: RH.arp([0, 1, 2, 3, 3, 2, 1, 0]),
      lh: LH.rootFifth,
    }),
  () =>
    progression({
      title: "Alberti Bass Chords",
      bpm: 88,
      prog: cadence,
      rh: RH.hold,
      lh: LH.alberti,
    }),
  () =>
    progression({
      title: "Block Chords I–IV–V–I (C)",
      bpm: 80,
      prog: cadence,
      rh: RH.halves,
      lh: LH.octaves,
    }),
  () =>
    progression({
      title: "Triad Inversions",
      bpm: 84,
      prog: [{ off: 0, type: "M" }, { off: 7, type: "M" }, { off: 5, type: "M" }, { off: 0, type: "M" }],
      rh: inversions,
      lh: LH.root,
    }),
  () =>
    progression({
      title: "Suspended Chords",
      bpm: 72,
      prog: [
        { off: 0, type: "sus4" },
        { off: 0, type: "M" },
        { off: 7, type: "sus4" },
        { off: 7, type: "M" },
        { off: 5, type: "sus2" },
        { off: 5, type: "M" },
        { off: 0, type: "sus4" },
        { off: 0, type: "M" },
      ],
      rh: RH.halves,
      lh: LH.root,
    }),
  () =>
    progression({
      title: "Cadences: I–vi–ii–V–I",
      bpm: 80,
      loops: 2,
      prog: [
        { off: 0, type: "M" },
        { off: 9, type: "m" },
        { off: 2, type: "m" },
        { off: 7, type: "7" },
        { off: 0, type: "M" },
      ],
      rh: RH.quarters,
      lh: LH.rootFifth,
    }),
];

function lhSong(title: string, lh: Pattern, bpm: number, bpb = 4): Song {
  const prog: ChordSpec[] = [
    { off: 0, type: "M" },
    { off: 9, type: "m" },
    { off: 5, type: "M" },
    { off: 7, type: "7" },
  ];
  return progression({ title, composer: "Left-hand drill", bpm, bpb, prog, loops: 2, rh: RH.hold, lh });
}

export const LEFT_HAND: (() => Song)[] = [
  () => lhSong("Alberti Bass", LH.alberti, 84),
  () => lhSong("Broken Octaves", LH.brokenOctaves, 80),
  () => lhSong("Walking Bass", LH.walk, 96),
  () => lhSong("Boogie-Woogie Bass", LH.boogie, 100),
  () => lhSong("Stride Piano", LH.stride, 96),
  () => lhSong("Waltz Oom-Pah-Pah", LH.waltz, 96, 3),
  () => lhSong("Rolling Arpeggio Bass", LH.rolling, 84),
  () => lhSong("Fifths Pulse", LH.fifths, 92),
  () => lhSong("Rock Octave Eighths", LH.octEighths, 110),
  () => lhSong("Latin Tumbao Bass", LH.latin, 100),
];
