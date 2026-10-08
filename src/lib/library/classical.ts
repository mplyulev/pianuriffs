import { DEMO_SONG, type Song } from "../song";
import { IVS, LH, Part, makeSong, voicing, type ChordType, type Pattern } from "./dsl";

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function chordOf(name: string): { pc: number; type: ChordType } | null {
  if (name === "-") return null;
  const m = /^([A-G])(#|b)?(m|7)?$/.exec(name)!;
  const pc = PC[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  return { pc, type: (m[3] as ChordType | undefined) ?? "M" };
}

const waltz: Pattern = LH.waltz;
const halves: Pattern = (p, v, bpb) => {
  p.add([v.bass, v.bass + 7], 2, 0.95);
  p.add(v.ivs.map((i) => v.bass + 12 + i), bpb - 2, 0.95);
};

function piece(title: string, composer: string, bpm: number, bpb: number, rh: string, chords: string, lh: Pattern): Song {
  const R = new Part("R").text(rh);
  const L = new Part("L");
  for (const name of chords.split(" ")) {
    const c = chordOf(name);
    if (!c) L.rest(bpb);
    else lh(L, voicing(c.pc, c.type), bpb);
  }
  return makeSong(title, composer, bpm, bpb, [R, L]);
}

function canon(): Song {
  const bassRoots = [2, 9, 11, 6, 7, 2, 7, 9];
  const types: ChordType[] = ["M", "M", "m", "m", "M", "M", "M", "M"];
  const top = ["F#5", "E5", "D5", "C#5", "B4", "A4", "B4", "C#5"];
  const R = new Part("R");
  const L = new Part("L");
  for (let phase = 0; phase < 3; phase++) {
    bassRoots.forEach((pc, i) => {
      const v = voicing(pc, types[i]);
      L.add([v.bass, v.bass + 12], 2, 0.95);
      if (phase === 0) R.text(`${top[i]}:2`);
      else if (phase === 1) {
        R.add(v.root + v.ivs[1] + 12, 1, 0.9);
        R.add(v.root + v.ivs[2] + 12, 1, 0.9);
      } else {
        for (const k of [1, 2, 3, 2]) R.add(v.root + 12 + IVS[types[i]][k % 3] + (k === 3 ? 12 : 0), 0.5);
      }
    });
  }
  return makeSong("Canon in D (simplified)", "J. Pachelbel", 72, 4, [R, L]);
}

export const CLASSICAL: (() => Song)[] = [
  () => DEMO_SONG,
  () =>
    piece(
      "Twinkle, Twinkle, Little Star",
      "Traditional",
      96,
      4,
      "C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2 G4 G4 F4 F4 E4 E4 D4:2 G4 G4 F4 F4 E4 E4 D4:2 C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2",
      "C F F G C C C G C F F G",
      halves,
    ),
  () =>
    piece(
      "Mary Had a Little Lamb",
      "Traditional",
      100,
      4,
      "E4 D4 C4 D4 E4 E4 E4:2 D4 D4 D4:2 E4 G4 G4:2 E4 D4 C4 D4 E4 E4 E4 E4 D4 D4 E4 D4 C4:4",
      "C C G C C C G C",
      halves,
    ),
  () =>
    piece(
      "Jingle Bells (chorus)",
      "J. Pierpont",
      112,
      4,
      "E4 E4 E4:2 E4 E4 E4:2 E4 G4 C4:1.5 D4:.5 E4:4 F4 F4 F4:1.5 F4:.5 F4 E4 E4 E4:.5 E4:.5 E4 D4 D4 E4 D4:2 G4:2",
      "C C C C F C G G",
      halves,
    ),
  () =>
    piece(
      "Happy Birthday",
      "P. & M. Hill",
      104,
      3,
      "G4:.75 G4:.25 A4 G4 C5 B4:2 G4:.75 G4:.25 A4 G4 D5 C5:2 G4:.75 G4:.25 G5 E5 C5 B4 A4 F5:.75 F5:.25 E5 C5 D5 C5:2",
      "C G G C C C F C",
      waltz,
    ),
  () =>
    piece(
      "Amazing Grace",
      "Traditional",
      84,
      3,
      "r:2 G3 C4:2 E4:.5 C4:.5 E4:2 D4 C4:2 A3 G3:2 G3 C4:2 E4:.5 C4:.5 E4:2 D4 G4:3",
      "- C C F C C C C",
      waltz,
    ),
  () =>
    piece(
      "Greensleeves",
      "Traditional",
      96,
      3,
      "r:2 A4 C5:2 D5 E5:1.5 F5:.5 E5 D5:2 B4 G4:1.5 A4:.5 B4 C5:2 A4 A4:1.5 G#4:.5 A4 B4:2 G#4 E4:3",
      "- Am Am G Em Am Am E Am",
      waltz,
    ),
  () =>
    piece(
      "Für Elise (opening)",
      "L. v. Beethoven",
      88,
      3,
      "r:2 E5:.5 D#5:.5 E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4 r:.5 C4:.5 E4:.5 A4:.5 B4 r:.5 E4:.5 G#4:.5 B4:.5 C5 r:.5 E4:.5 E5:.5 D#5:.5 E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4 r:.5 C4:.5 E4:.5 A4:.5 B4 r:.5 E4:.5 C5:.5 B4:.5 A4:3",
      "- Am Am E Am Am Am E Am",
      (p, v) => {
        for (const o of [0, 7, 12, 7, 12, 7]) p.add(v.bass + o, 0.5);
      },
    ),
  () =>
    piece(
      "Minuet in G (first section)",
      "C. Petzold",
      108,
      3,
      "D5 G4:.5 A4:.5 B4:.5 C5:.5 D5 G4 G4 E5 C5:.5 D5:.5 E5:.5 F#5:.5 G5 G4 G4 C5 D5:.5 C5:.5 B4:.5 A4:.5 B4 C5:.5 B4:.5 A4:.5 G4:.5 F#4 G4:.5 A4:.5 B4:.5 G4:.5 A4:3",
      "G G C G C G D D",
      waltz,
    ),
  canon,
];

