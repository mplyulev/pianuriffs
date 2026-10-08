import type { Song } from "../song";
import { LH, Part, RH, makeSong, voicing, wrap, type Pattern } from "./dsl";
import { bassFrom, hitsFrom, layer, parsePhrase, phrase, riff, seq, shellFrom } from "./genres";
import { build, type Prog } from "./world";

const make =
  (label: string) =>
  (title: string, bpm: number, key: number, prog: Prog, rh: Pattern, lh: Pattern, loops = 2) =>
    build({ label, title, bpm, key, prog, rh, lh, loops });

/* ====================== LO-FI ====================== */
const lf = make("Lo-Fi");
const lfA = layer(bassFrom("0:1.75:0 2.5:.5:7 3.25:.75:0"), shellFrom("0.75:.75 2.75:.5"));
const lfB = layer(bassFrom("0:1:0 1.5:.5:0 2:1.5:7"), shellFrom("1:.5 3:1"));
const lfC = layer(bassFrom("0:2:0 2:2:7"), shellFrom("1:1 3:1"));
const lfD = layer(bassFrom("0:1.5:0 1.75:.25:0 2.5:.5:7 3.5:.5:5"), shellFrom("1:.75 3:.5"));
const lfc1 = hitsFrom(".5:1.25 2.5:.5 3.25:.75");
const lfc2 = hitsFrom("0:.75 1.25:.5 2.5:1.5");
const lfc3 = hitsFrom("0:1.75 2:.5 3:.75");
const lfc4 = hitsFrom(".5:.75 1.5:.5 2.25:.5 3:1");

export const LOFI = [
  lf("Study Beat", 78, 0, [[0, "M9"], [9, "m9"], [2, "m9"], [7, "13"]],
    phrase("0:.75:7 .75:.75:4 1.5:.5:2 2:1.5:4 3.5:.5:2 | 0:.75:4 .75:.75:2 1.5:.5:0 2:2:-3 | 0:1:5 1:.5:4 1.5:.5:2 2:1.5:0 3.5:.5:2 | 0:1.5:7 1.5:.5:4 2:.5:2 2.5:.5:0 3:1:-1"), lfA),
  lf("Rainy Window", 72, 0, [[5, "M9"], [4, "m9"], [2, "m9"], [0, "M9"]], seq(lfc1, lfc2, lfc1, lfc3), lfB),
  lf("Late Night Keys", 80, 0, [[2, "m9"], [7, "13"], [0, "M9", 2]], seq(lfc2, lfc4, lfc3, lfc1), lfC),
  lf("Tape Hiss in A Minor", 70, 9, [[0, "m9"], [5, "m9"], [10, "9"], [3, "M9"]],
    phrase("0:1:7 1:.5:10 1.5:.5:7 2:1.5:5 3.5:.5:3 | 0:.75:5 .75:.75:3 1.5:.5:0 2:2:3 | 0:.75:10 .75:.75:7 1.5:.5:5 2:1:3 3:1:0 | 0:1.5:12 1.5:.5:10 2:2:7"), lfD),
  lf("Sunday Morning", 84, 7, [[0, "M9"], [9, "m9"], [2, "m9"], [7, "13"]], RH.arp([1, 2, 4, 3, 2, 1, 2, 3]), lfA),
  lf("Chillhop Arpeggios", 82, 0, [[0, "M9"], [4, "m7"], [5, "M9"], [7, "9"]], RH.arp([0, 2, 4, 3, 2, 1], 0.5), lfB),
  lf("Jazzy Dusk", 76, 2, [[5, "M9"], [7, "13"], [4, "m9"], [9, "m9"]],
    phrase("0:1.5:9 1.5:.5:7 2:1:4 3:1:2 | 0:.75:7 .75:.75:9 1.5:.5:12 2:2:9 | 0:1:7 1:.5:4 1.5:.5:2 2:1.5:4 3.5:.5:7 | 0:2:9 2:1:7 3:1:4"), lfC),
  lf("Vinyl Crackle", 68, 4, [[0, "m9"], [8, "M9"], [3, "M9"], [10, "13"]], seq(lfc4, lfc1, lfc3, lfc2), lfD),
  lf("Slow Bounce", 74, -2, [[0, "M9"], [9, "m9"], [2, "m9"], [7, "13"]],
    phrase("0:.5:7 .5:.5:7 1:.5:4 1.5:.5:2 2:1:4 3:.5:7 3.5:.5:9 | 0:.5:7 .5:.5:7 1:.5:4 1.5:.5:2 2:2:0 | 0:.5:5 .5:.5:5 1:.5:4 1.5:.5:2 2:1:4 3:.5:2 3.5:.5:0 | 0:1.5:-1 1.5:.5:0 2:2:2"), lfB),
  lf("Dreamy Pads", 66, 5, [[0, "M9"], [2, "m9"], [4, "m9"], [5, "M9"]], RH.hold, lfC),
];

/* ====================== R&B / SOUL ====================== */
const rb = make("R&B / Soul");
const rbA = layer(bassFrom("0:1.5:0 1.5:.5:7 2:1:0 3.5:.5:10"), shellFrom("1:.5 2.5:.5 3:.5"));
const rbB = layer(bassFrom("0:2:0 2:1:7 3:1:5"), shellFrom("1:1"));
const rbC = layer(bassFrom("0:1:0 1:.5:0 2.5:.5:0 3:1:7"), shellFrom("1.5:.5 3.5:.5"));
const rbMoto = bassFrom("0:.75:0 1:.5:7 1.5:.5:12 2:.75:7 3:.5:4 3.5:.5:5");
const rbHits1 = hitsFrom("0:.75 .75:.75 1.5:.5 2.5:1.5");
const rbHits2 = hitsFrom("0:2 2:1 3:1");
const rbHits3 = hitsFrom("0:.75 1:.5 2:.75 3:.5");
const rbHits4 = hitsFrom("0:1.5 1.5:.5 2:2");
const rbHits5 = hitsFrom(".5:1 2:1 3.5:.5");

export const RNB = [
  rb("Neo-Soul Vamp", 78, 0, [[2, "m9"], [7, "13"], [0, "M9"], [9, "m9"]], seq(rbHits1, rbHits1, rbHits4, rbHits1), rbA),
  rb("Slow Jam in E♭", 62, 3, [[0, "M9"], [5, "M9"], [4, "m9"], [7, "13"]], rbHits2, rbB),
  rb("Quiet Storm", 66, 5, [[0, "M9"], [5, "M9"], [4, "m9"], [7, "13"]],
    phrase("0:1.5:7 1.5:.5:4 2:.5:2 2.5:1.5:4 | 0:.75:5 .75:.75:4 1.5:.5:2 2:2:0 | 0:1:4 1:.5:7 1.5:.5:4 2:1:2 3:1:0 | 0:1.5:7 1.5:.5:4 2:.5:2 2.5:.5:0 3:1:-3"), rbC),
  rb("Church Choir Ballad", 64, 0, [[0, "M"], [5, "M"], [9, "m7"], [7, "7sus"]], seq(rbHits4, rbHits2), rbB),
  rb("Smooth Groove in A♭", 84, -4, [[0, "M9"], [9, "m9"], [2, "m9"], [7, "13"]], rbHits3, rbA),
  rb("Falsetto Ballad", 60, 7, [[0, "add9"], [7, "add9"], [9, "m7"], [5, "add9"]],
    phrase("0:1:9 1:1:7 2:1.5:4 3.5:.5:2 | 0:1.5:7 1.5:.5:9 2:2:12 | 0:1:12 1:.5:9 1.5:.5:7 2:2:4 | 0:2:9 2:2:7"), rbB),
  rb("90s Slow Dance", 68, 2, [[9, "m9"], [2, "m9"], [7, "13"], [0, "M9"]], seq(rbHits4, rbHits5), rbC),
  rb("Motown Pulse", 110, 0, [[0, "M"], [5, "M"], [0, "M"], [7, "M"]], RH.quarters, (p, v, b) => rbMoto(p, v, b)),
  rb("Late Night Rhodes", 70, 4, [[0, "m9"], [5, "m9"], [10, "13"], [3, "M9"]], seq(rbHits5, rbHits1), rbA),
  rb("Soul Shuffle in C", 96, 0, [[0, "9"], [5, "9"], [0, "9"], [7, "9"]], hitsFrom("0:.5 1:.5 2:.5 3:.5"), LH.boogie),
];

/* ====================== HIP-HOP ====================== */
const hh = make("Hip-Hop");
const hhBoom = layer(bassFrom("0:.75:0 1.5:.5:0 2.5:.5:0 3:1:-2"), shellFrom("2:.5"));
const hhTrap = layer(bassFrom("0:2:0 2.5:.5:0 3:1:0"), shellFrom("1:.25 3.5:.25"));
const hhSlide = bassFrom("0:1:0 1.5:.5:0 2:.5:-2 2.5:.5:0 3:1:3");
const hhStab = hitsFrom("0:.5 1.5:.5 2:.5 3.5:.5");
const hhSlab = hitsFrom("0:3 3.5:.5");
const hhOff = hitsFrom(".5:.5 1.5:.5 2.5:.5 3.5:.5");

export const HIPHOP = [
  hh("Boom Bap in A Minor", 90, 9, [[0, "m9", 2], [5, "m9", 2]],
    phrase("0:.75:7 .75:.75:3 1.5:.5:0 2:.75:3 2.75:.25:0 3:1:-2 | 0:.5:0 .5:.5:3 1:.5:5 1.5:.5:3 2:2:0 | 0:.75:7 .75:.75:3 1.5:.5:0 2:.75:3 2.75:.25:0 3:1:-2 | 0:.5:5 .5:.5:3 1:.5:0 1.5:.5:-2 2:2:0", 12), hhBoom),
  hh("Dusty Sample Loop", 86, 2, [[0, "m9"], [10, "M9"], [3, "M9"], [10, "9"]], seq(hhStab, hhStab, hhSlab, hhStab), hhBoom),
  hh("Trap Minor", 140, 6, [[0, "m"], [8, "M"], [3, "M"], [10, "M"]],
    phrase("0:.5:0 .5:.5:3 1:1:7 2:.5:3 2.5:.5:0 3:1:-2 | 0:.5:0 .5:.5:3 1:1:8 2:.5:5 2.5:.5:3 3:1:0 | 0:.5:0 .5:.5:3 1:1:7 2:.5:3 2.5:.5:0 3:1:-2 | 0:.5:5 .5:.5:3 1:.5:0 1.5:.5:3 2:2:7"), hhTrap),
  hh("East Coast Piano", 92, 0, [[9, "m9"], [2, "m9"]],
    phrase("0:.5:7 .5:.5:4 1:.5:0 1.5:.5:4 2:1:7 3:.5:4 3.5:.5:2 | 0:.5:0 .5:.5:2 1:.5:4 1.5:.5:7 2:2:4 | 0:.5:7 .5:.5:4 1:.5:0 1.5:.5:4 2:1:7 3:1:9 | 0:.5:7 .5:.5:4 1:.5:2 1.5:.5:0 2:2:-3"), hhBoom),
  hh("Cinematic Rap Intro", 80, 4, [[0, "m"], [8, "M"], [10, "M"], [7, "M"]], hhSlab, hhTrap),
  hh("West Coast Whine", 94, 7, [[0, "m9"], [5, "9"]],
    phrase("0:.75:12 .75:.25:11 1:1:12 2:.5:7 2.5:.5:10 3:1:7 | 0:.75:12 .75:.25:11 1:1:12 2:2:7 | 0:.75:12 .75:.25:11 1:1:12 2:.5:7 2.5:.5:10 3:1:7 | 0:.5:10 .5:.5:7 1:.5:5 1.5:.5:3 2:2:0"), layer(hhSlide)),
  hh("Soul Chop", 88, -2, [[0, "M9"], [2, "m9"], [4, "m9"], [5, "M9"]], seq(hhStab, hhOff), hhBoom),
  hh("Drill Bell Melody", 142, 11, [[0, "m"], [8, "M"], [7, "M"], [0, "m"]],
    phrase("0:.5:12 .5:.5:15 1:.5:19 1.5:.5:15 2:.5:12 2.5:.5:15 3:1:19 | 0:.5:12 .5:.5:15 1:.5:19 1.5:.5:15 2:.5:12 2.5:.5:10 3:1:7 | 0:.5:12 .5:.5:15 1:.5:19 1.5:.5:15 2:.5:12 2.5:.5:15 3:1:19 | 0:.5:19 .5:.5:17 1:.5:15 1.5:.5:12 2:2:10", 0), hhTrap),
  hh("Jazz-Rap Chords", 86, 5, [[2, "m9"], [7, "13"], [0, "M9", 2]], hitsFrom("0:1.5 2:1 3.5:.5"), hhBoom),
  hh("Late 90s Underground", 91, 0, [[9, "m"], [7, "M"], [5, "M"], [4, "7"]], seq(hhStab, hhStab, hhOff, hhSlab), hhTrap),
];

/* ====================== ROCK ====================== */
const rk = make("Rock");
const eighths = hitsFrom("0:.5 .5:.5 1:.5 1.5:.5 2:.5 2.5:.5 3:.5 3.5:.5");
const rkAnth = hitsFrom("0:1.5 1.5:.5 2:2");
const rkSync = hitsFrom("0:1 1.5:.5 2:1 3.5:.5");
const rkOct = LH.octEighths;
const rkQuarter = layer(bassFrom("0:1:0 1:1:0 2:1:0 3:1:0"));
const rkGallop = bassFrom("0:.5:0 .5:.25:0 .75:.25:0 1:.5:0 1.5:.25:0 1.75:.25:0 2:.5:0 2.5:.25:0 2.75:.25:0 3:.5:0 3.5:.5:7");
const rkRiffE = phrase("0:.5:0 .5:.5:0 1:.5:3 1.5:.5:5 2:1:7 3:.5:5 3.5:.5:3 | 0:.5:0 .5:.5:0 1:.5:3 1.5:.5:5 2:1:7 3:1:10 | 0:.5:0 .5:.5:0 1:.5:3 1.5:.5:5 2:1:7 3:.5:5 3.5:.5:3 | 0:.5:5 .5:.5:3 1:.5:0 1.5:.5:-2 2:2:0", 0);
const rkBlues = phrase("0:1:12 1:.5:10 1.5:.5:7 2:.5:5 2.5:.5:3 3:1:0 | 0:.5:7 .5:.5:10 1:.5:12 1.5:.5:10 2:2:7 | 0:1:12 1:.5:10 1.5:.5:7 2:.5:5 2.5:.5:3 3:1:0 | 0:.5:3 .5:.5:5 1:.5:6 1.5:.5:7 2:2:0", 0);

export const ROCK = [
  rk("Piano Rock Eighths", 128, 0, [[0, "M"], [5, "M"], [9, "m"], [7, "M"]], RH.pulse, LH.octEighths),
  rk("Mixolydian Rock (I–♭VII–IV)", 124, 4, [[0, "5"], [10, "5"], [5, "5"], [0, "5"]], eighths, rkOct),
  rk("Minor Rock Stabs", 112, 9, [[0, "5"], [8, "5"], [10, "5"], [0, "5"]], rkSync, rkQuarter),
  rk("Classic Riff in E", 132, 4, [[0, "5", 2], [5, "5"], [7, "5"]], rkRiffE, rkOct),
  rk("Stadium Anthem", 104, 7, [[0, "M"], [7, "M"], [9, "m"], [5, "M"]], rkAnth, LH.octaves),
  rk("Punk Eighths", 168, 2, [[0, "5"], [5, "5"], [7, "5"], [5, "5"]], eighths, rkOct),
  rk("Blues Rock Shuffle", 118, 9, [[0, "7", 2], [5, "7"], [7, "7"]], rkBlues, LH.boogie),
  rk("Rock Ballad", 74, 0, [[0, "M"], [0, "sus4"], [7, "M"], [9, "m"], [5, "M"], [5, "sus2"], [7, "sus4"], [7, "M"]], RH.arp([0, 1, 2, 1, 2, 1]), LH.rootFifth),
  rk("Hard Rock Gallop", 140, 4, [[0, "5"], [3, "5"], [5, "5"], [7, "5"]], rkRiffE, rkGallop),
  rk("Southern Boogie", 126, 7, [[0, "7", 2], [5, "7"], [0, "7"], [7, "7"]], rkBlues, LH.boogie),
];

/* ====================== FUNK ====================== */
const fk = make("Funk");
const f1 = hitsFrom("0:.25 .5:.25 .75:.25 1.5:.25 2:.5 3:.25 3.5:.25");
const f2 = hitsFrom(".5:.25 1:.25 1.75:.25 2.5:.25 3:.5");
const f3 = hitsFrom("0:.5 .75:.25 1.25:.25 2:.5 2.75:.25 3.5:.25");
const fb1 = bassFrom("0:.5:0 .75:.25:12 1.5:.5:0 2:.5:7 2.75:.25:12 3.5:.5:10");
const fb2 = bassFrom("0:.25:0 .5:.25:12 1:.5:0 2:.25:0 2.5:.25:12 3:.5:7 3.5:.5:10");
const fb3 = bassFrom("0:.5:0 .5:.25:0 1:.25:12 1.5:.5:10 2:.5:7 2.5:.5:5 3:.5:3 3.5:.5:5");
const fkRiff = phrase("0:.25:0 .25:.25:3 .5:.25:5 1:.5:7 1.75:.25:5 2:.5:3 3:.5:0 | 0:.25:0 .25:.25:3 .5:.25:5 1:.5:7 1.75:.25:10 2:.5:7 3:1:5", 12);
const fkRiff2 = phrase("0:.5:7 .75:.25:10 1:.5:12 1.75:.25:10 2:.5:7 2.5:.5:5 3:1:3 | 0:.5:7 .75:.25:10 1:.5:12 1.75:.25:15 2:1:12 3:1:10", 0);

export const FUNK = [
  fk("One-Chord Funk (E9)", 104, 4, [[0, "9", 4]], seq(f1, f1, f3, f1), fb1),
  fk("Clav Stabs in A", 100, 9, [[0, "9", 2], [5, "9", 2]], f2, fb2),
  fk("Minor Funk Vamp", 98, 2, [[0, "m9", 2], [5, "9", 2]], seq(f1, f2), fb2),
  fk("Disco Octaves", 116, 0, [[0, "m9"], [5, "9"], [0, "m9"], [7, "13"]], f2, LH.octEighths),
  fk("Slap Line in G", 108, 7, [[0, "9", 2], [5, "9"], [0, "9"], [7, "9"]], fkRiff, fb1),
  fk("Chicken Scratch", 112, 5, [[0, "7#9", 4]], f1, fb3),
  fk("Soul Funk Groove", 96, 0, [[0, "9"], [5, "9"], [0, "9"], [5, "9"]], f3, fb2),
  fk("Smooth Funk in B♭", 102, -2, [[0, "M9"], [5, "9"], [2, "m9"], [7, "13"]], f1, fb1),
  fk("Night Drive Groove", 106, 9, [[0, "m9", 2], [10, "9"], [7, "9"]], fkRiff2, fb2),
  fk("Pocket Riff in D", 110, 2, [[0, "9", 2], [5, "9", 2]], fkRiff2, fb3),
];

/* ====================== BLUES ====================== */
const LICKS: Record<string, string> = {
  A: "0:1:0 1:.5:3 1.5:.5:5 2:.5:6 2.5:.5:7 3:1:10",
  B: "0:.5:12 .5:.5:10 1:1:7 2:.5:5 2.5:.5:3 3:1:0",
  C: "0:.5:7 .5:.5:10 1:.5:12 1.5:.5:10 2:.5:7 2.5:.5:6 3:.5:5 3.5:.5:3",
  D: "0:.5:0 .5:.5:3 1:.5:5 1.5:.5:7 2:1:10 3:.5:7 3.5:.5:5",
  E: "0:1.5:7 1.5:.5:10 2:2:12",
  F: "0:.5:12 1:.5:12 1.5:.5:10 2:.5:7 3:.5:5 3.5:.5:7",
  G: "0:.5:10 .5:.5:12 1:.5:10 1.5:.5:7 2:1:5 3:.5:3 3.5:.5:0",
  H: "0:1:7 1:.5:6 1.5:.5:5 2:1:3 3:1:0",
  I: "0:1:7+12 1:.5:5+10 1.5:.5:5+10 2:2:3+7",
  J: "0:.25:3 .25:.25:4 .5:.25:3 .75:.25:4 1:1:4 2:.5:7 2.5:.5:10 3:1:12",
  K: "0:.333:7 .333:.333:10 .667:.333:12 1:1:10 2:.667:7 2.667:.333:5 3:1:3",
  L: "0:.333:12 .333:.333:10 .667:.333:7 1:.333:12 1.333:.333:10 1.667:.333:7 2:1:5 3:.667:3 3.667:.333:0",
  M: "0:.5:0 .5:.5:0 1:.5:3 1.5:.5:5 2:.5:6 2.5:.5:7 3:1:0",
  N: "0:2:10 2:.5:7 2.5:.5:5 3:1:3",
};

const FORM_STD = [0, 5, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7];
const FORM_SLOW = [0, 5, 0, 0, 5, 5, 0, 9, 2, 7, 0, 7];

const BLUES_LH: Record<string, Pattern> = {
  boogie: LH.boogie,
  shuffle: bassFrom("0:.5:0 .5:.5:0 1:.5:4 1.5:.5:4 2:.5:7 2.5:.5:7 3:.5:9 3.5:.5:9"),
  walk: bassFrom("0:1:0 1:1:4 2:1:7 3:1:9"),
  rock: LH.octEighths,
  triplet: (p, v) => {
    for (let b = 0; b < 4; b++) for (const o of [0, 7, 9]) p.add(v.bass + o, 1 / 3, 0.85);
  },
  slow: layer(bassFrom("0:2:0 2:2:7"), shellFrom("1:1 3:1")),
  tension: bassFrom("0:1.5:0 1.5:.5:7 2:1.5:0 3.5:.5:10"),
};

function blues(title: string, bpm: number, key: number, lh: keyof typeof BLUES_LH, licks: string, form = FORM_STD, minor = false): () => Song {
  return () => {
    const R = new Part("R");
    const L = new Part("L");
    form.forEach((rel, bar) => {
      const pc = key + rel;
      const isMinorChord = (minor && (rel === 0 || rel === 5)) || rel === 2;
      const v = voicing(pc, rel === 2 ? "m7" : isMinorChord ? "m7" : "7", key);
      BLUES_LH[lh](L, v, 4);
      const lick = parsePhrase(LICKS[licks[bar % licks.length]])[0];
      const base = 60 + wrap(pc);
      riff(lick.map(([s, d, m]) => [s, d, minor && typeof m === "number" && m === 4 ? 3 : m] as typeof lick[number]))(R, { ...v, root: base }, 4);
    });
    return makeSong(title, "Blues lick", bpm, 4, [R, L]);
  };
}

export const BLUES = [
  blues("Boogie Woogie in C", 100, 0, "boogie", "ABCDEFGM"),
  blues("Slow Blues in G (12/8 feel)", 54, 7, "triplet", "KLNKLEKH", FORM_SLOW),
  blues("Walking Blues in F", 108, 5, "walk", "CGABFEDM"),
  blues("Shuffle in A", 112, 9, "shuffle", "ADBMCFEA"),
  blues("Texas Boogie in E", 120, 4, "boogie", "BEAJDCFM"),
  blues("Minor Blues in C", 70, 0, "tension", "NDEBIGAH", FORM_SLOW, true),
  blues("Jump Blues in B♭", 128, 10, "rock", "CFAMBDGC"),
  blues("Gospel Blues in D", 66, 2, "slow", "EIBNEGKH", FORM_SLOW),
  blues("Delta Riff in E", 96, 4, "rock", "MMFBMMGJ"),
  blues("Rock 'n' Roll in C", 136, 0, "rock", "CJCFBEDA"),
];

/* ====================== POP ====================== */
const pp = make("Pop");
const popBass = layer(bassFrom("0:1.5:0 1.5:.5:0 2:1.5:7 3.5:.5:0"), shellFrom("1:.5 3:.5"));
const ppHook1 = phrase("0:1:7 1:.5:4 1.5:.5:2 2:1.5:0 3.5:.5:2 | 0:1:2 1:1:4 2:2:7 | 0:1:4 1:.5:2 1.5:.5:0 2:1:-3 3:1:0 | 0:1.5:4 1.5:.5:2 2:2:0");
const ppHook2 = phrase("0:.5:7 .5:.5:9 1:1:12 2:.5:9 2.5:.5:7 3:1:4 | 0:.5:7 .5:.5:9 1:1:11 2:2:7 | 0:.5:9 .5:.5:12 1:1:14 2:.5:12 2.5:.5:9 3:1:7 | 0:2:12 2:2:9");
const ppHook3 = phrase("0:1:0 1:1:3 2:1:7 3:1:5 | 0:2:3 2:2:0 | 0:1:0 1:1:3 2:1:7 3:1:10 | 0:2:7 2:2:3");

export const POP = [
  pp("Axis Progression in C (I–V–vi–IV)", 100, 0, [[0, "M"], [7, "M"], [9, "m"], [5, "M"]], ppHook1, LH.octaves),
  pp("Axis Progression in G", 104, 7, [[0, "M"], [7, "M"], [9, "m"], [5, "M"]], RH.pulse, popBass),
  pp("50s Doo-Wop (I–vi–IV–V)", 92, 0, [[0, "M"], [9, "m"], [5, "M"], [7, "M"]], RH.quarters, LH.rootFifth),
  pp("Singer-Songwriter (vi–IV–I–V)", 88, 0, [[9, "m"], [5, "M"], [0, "M"], [7, "M"]], ppHook2, popBass),
  pp("Canon Progression in D", 80, 2, [[0, "M"], [7, "M"], [9, "m"], [4, "m"], [5, "M"], [0, "M"], [5, "M"], [7, "M"]], RH.arp([0, 1, 2, 3, 2, 1, 2, 1]), LH.octaves, 1),
  pp("Cinematic Build (vi–V–IV–V)", 84, 0, [[9, "m"], [7, "M"], [5, "M"], [7, "M"]], RH.halves, LH.octEighths),
  pp("Moody Minor in E (i–VI–III–VII)", 90, 4, [[0, "m"], [8, "M"], [3, "M"], [10, "M"]], ppHook3, popBass),
  pp("Ballad in F", 72, 5, [[0, "M9"], [5, "M9"], [9, "m7"], [7, "7sus"]], RH.arp([0, 1, 2, 3, 2, 1]), LH.root),
  pp("Dance Pulse in A", 124, 9, [[0, "M"], [7, "M"], [9, "m"], [5, "M"]], RH.pulse, LH.octEighths),
  pp("Gospel Pop in B♭", 80, 10, [[0, "M"], [4, "m7"], [5, "M"], [7, "7"]], RH.halves, LH.walk),
];

