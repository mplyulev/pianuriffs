import type { Song } from "../song";
import { Part, doubled, makeSong, voicing, type ChordType, type Pattern } from "./dsl";
import { bassFrom, hitsFrom, layer, line, shellFrom } from "./genres";

type Cell = { off: number; type: ChordType; rh: Pattern; lh: Pattern; n?: number };

export function score(o: {
  title: string;
  label: string;
  bpm: number;
  key: number;
  swing?: number;
  bpb?: number;
  form: Cell[];
}): () => Song {
  return () => {
    const bpb = o.bpb ?? 4;
    const R = new Part("R");
    const L = new Part("L");
    for (const c of o.form) {
      const v = voicing(o.key + c.off, c.type, o.key);
      for (let i = 0; i < (c.n ?? 1); i++) {
        c.rh(R, v, bpb);
        c.lh(L, v, bpb);
      }
    }
    const home = voicing(o.key + o.form[0].off, o.form[0].type, o.key);
    R.add(home.rh, bpb, 0.98, 0.55);
    L.add([home.bass - 12, home.bass], bpb, 0.98, 0.7);
    return makeSong(o.title, o.label, o.bpm, bpb, [R, L], o.swing ?? 0);
  };
}

const rest: Pattern = (p, _v, bpb) => {
  p.t += bpb;
};
const hold: Pattern = (p, v, bpb) => {
  p.add(v.rh, bpb, 0.97, 0.55);
};
const bassHold: Pattern = (p, v, bpb) => {
  p.add([v.bass - 12, v.bass], bpb, 0.97, 0.7);
};
const octaves: Pattern = (p, v, bpb) => {
  for (let i = 0; i < bpb * 2; i++) p.add([v.bass, v.bass + 12], 0.5, 0.85, i % 4 === 0 ? 0.9 : 0.55);
};
const pulse: Pattern = (p, v, bpb) => {
  for (let i = 0; i < bpb * 2; i++) p.add(v.rh, 0.5, 0.82, i % 2 ? 0.45 : 0.85);
};

const B = (off: number, type: ChordType, rh: Pattern, lh: Pattern, n = 1): Cell => ({ off, type, rh, lh, n });
const many = (n: number, cells: Cell[]) => Array.from({ length: n }, () => cells).flat();

/* shared grooves */
const popV = line("0:2:7 2:1:4 3:1:2");
const popC = line("0:.5:7 .5:.5:12 1:.5:11 1.5:.5:12 2:1:14 3:.5:12 3.5:.5:9");
const popLift = line("0:.5:12 .5:.5:14 1:.5:16 1.5:.5:14 2:1:12 3:1:9");
const popBassV = bassFrom("0:2:0 2:2:7");
const popBassC = layer(bassFrom("0:1:0 1:.5:0 1.5:.5:7 2:1:12 3:.5:7 3.5:.5:0"), shellFrom("1:.5 3:.5"));
const popFill = line("0:.25:7 .25:.25:9 .5:.25:11 .75:.25:12 1:.25:14 1.25:.25:12 1.5:.25:11 1.75:.25:9 2:1:7 3:1:4");

export const extraPop = [
  score({
    title: "Sunset Drive",
    label: "Pop · verse / chorus",
    bpm: 102,
    key: 0,
    form: [
      B(0, "M", rest, bassHold, 2),
      ...many(2, [B(0, "M", popV, popBassV), B(7, "M", popV, popBassV), B(9, "m", popV, popBassV), B(5, "M", popV, popBassV)]),
      B(5, "M", popLift, popBassC),
      B(7, "sus4", popLift, popBassC),
      ...many(2, [B(0, "M", popC, popBassC), B(7, "M", popC, popBassC), B(9, "m", popC, popBassC), B(5, "M", popC, popBassC)]),
      B(7, "M", popFill, popBassC),
    ],
  }),
  score({
    title: "Midnight Radio",
    label: "Pop · pre-chorus lift",
    bpm: 96,
    key: 7,
    form: [
      B(9, "m", hold, bassHold, 2),
      B(9, "m", popV, popBassV),
      B(5, "M", popV, popBassV),
      B(0, "M", popV, popBassV),
      B(7, "M", popV, popBassV),
      B(9, "m", popLift, octaves),
      B(5, "M", popLift, octaves),
      B(0, "M", popC, popBassC),
      B(7, "M", popC, popBassC),
      B(9, "m", popC, popBassC),
      B(5, "M", popC, popBassC),
      B(0, "M", doubled(popC, 12), popBassC),
      B(7, "M", doubled(popC, 12), popBassC),
      B(9, "m", popFill, popBassC),
      B(5, "M", hold, bassHold),
    ],
  }),
];

const lfHits = hitsFrom(".75:1.25 2.5:.5 3.25:.75");
const lfHits2 = hitsFrom("0:.5 1:1.5 3:1");
const lfBass = layer(bassFrom("0:1.75:0 2.5:.5:7 3.25:.75:0"), shellFrom("1:.5 3:.5"));
const lfWalk = bassFrom("0:1:0 1:1:2 2:1:4 3:1:7");
const lfHook = line("0:1.5:11 1.5:.5:9 2:1:7 3:.5:4 3.5:.5:2");
const lfRun = line("0:.5:14 .5:.5:11 1:.5:9 1.5:.5:7 2:.5:9 2.5:.5:7 3:.5:4 3.5:.5:2");

export const extraLofi = [
  score({
    title: "Cassette Side B",
    label: "Lo-Fi · drop then lift",
    bpm: 76,
    key: 0,
    swing: 0.14,
    form: [
      B(0, "M9", hold, bassHold, 2),
      B(0, "M9", lfHits, lfBass),
      B(9, "m9", lfHits, lfBass),
      B(2, "m9", lfHits2, lfBass),
      B(7, "13", lfHits2, lfBass),
      B(0, "M9", rest, lfWalk),
      B(9, "m9", rest, lfWalk),
      B(0, "M9", lfHook, lfBass),
      B(4, "m7", lfHook, lfBass),
      B(5, "M9", lfRun, lfBass),
      B(7, "13", lfRun, lfBass),
      B(0, "M9", doubled(lfHook, 12), lfBass),
      B(9, "m9", lfHits, lfBass),
    ],
  }),
  score({
    title: "Rain Check",
    label: "Lo-Fi · broken then dense",
    bpm: 70,
    key: 9,
    swing: 0.12,
    form: [
      B(0, "m9", rest, bassHold),
      B(0, "m9", lfHits, lfBass, 2),
      B(5, "m9", lfHits2, lfBass, 2),
      B(10, "9", lfHook, lfWalk),
      B(3, "M9", lfHook, lfWalk),
      B(0, "m9", lfRun, lfBass),
      B(8, "M9", lfRun, lfBass),
      B(0, "m9", doubled(lfHook, -12), lfBass),
    ],
  }),
];

const rbV = line("0:1.5:7 1.5:.5:4 2:1:2 3:1:0");
const rbC = line("0:.75:12 .75:.75:11 1.5:.5:12 2:1:14 3:.5:12 3.5:.5:9");
const rbCall = line("0:.5:7 .5:.5:12 1:1:16 2:.5:14 2.5:.5:12 3:1:9");
const rbBassV = layer(bassFrom("0:2:0 2:2:7"), shellFrom("1:1"));
const rbBassC = layer(bassFrom("0:1:0 1:.5:7 1.5:.5:12 2:1:7 3:.5:4 3.5:.5:5"), shellFrom(".75:.5 2.5:.5"));

export const extraRnb = [
  score({
    title: "After Hours",
    label: "R&B · quiet verse, stacked chorus",
    bpm: 72,
    key: 3,
    swing: 0.08,
    form: [
      B(0, "M9", hold, bassHold, 2),
      B(0, "M9", rbV, rbBassV),
      B(5, "M9", rbV, rbBassV),
      B(4, "m9", rbV, rbBassV),
      B(7, "13", rbV, rbBassV),
      B(2, "m9", rbCall, rbBassC),
      B(7, "13", rbCall, rbBassC),
      B(0, "M9", rbC, rbBassC),
      B(5, "M9", rbC, rbBassC),
      B(4, "m9", rbC, rbBassC),
      B(7, "13", rbC, rbBassC),
      B(0, "M9", doubled(rbC, 12), rbBassC),
      B(7, "13", line("0:.25:12 .25:.25:14 .5:.25:16 .75:.25:19 1:1:16 2:2:12"), rbBassC),
    ],
  }),
  score({
    title: "Velvet Reply",
    label: "R&B · call and response",
    bpm: 80,
    key: 0,
    swing: 0.1,
    form: [
      B(2, "m9", rbCall, rbBassV),
      B(7, "13", rest, rbBassV),
      B(2, "m9", rbCall, rbBassV),
      B(7, "13", rbV, rbBassV),
      B(0, "M9", rbC, rbBassC, 2),
      B(9, "m9", rbC, rbBassC),
      B(7, "13", rbCall, rbBassC),
      B(0, "M9", doubled(rbC, 7), rbBassC),
    ],
  }),
];

const hhPiano = line("0:.75:7 .75:.25:5 1:.5:3 1.5:.5:0 2:1:3 3:.5:0 3.5:.5:-2");
const hhBell = line("0:.5:12 .5:.5:15 1:.5:19 1.5:.5:15 2:.5:12 2.5:.5:10 3:1:7");
const hhBoom = layer(bassFrom("0:.75:0 1.5:.5:0 2.5:.5:0 3:1:-2"), shellFrom("2:.4"));
const hhTrap = bassFrom("0:1.5:0 2:.5:0 2.5:.5:0 3:1:0");
const hhStab = hitsFrom("0:.6 2:.4 3.5:.4");

export const extraHiphop = [
  score({
    title: "Rooftop Cipher",
    label: "Hip-Hop · boom-bap into trap",
    bpm: 90,
    key: 9,
    swing: 0.1,
    form: [
      B(0, "m9", hhStab, hhBoom, 2),
      B(0, "m9", hhPiano, hhBoom, 2),
      B(5, "m9", hhPiano, hhBoom, 2),
      B(0, "m9", hhBell, hhTrap, 2),
      B(8, "M", hhBell, hhTrap),
      B(7, "M", hhBell, hhTrap),
      B(0, "m9", doubled(hhPiano, 12), hhBoom, 2),
      B(0, "m9", rest, hhBoom),
      B(0, "m9", hhStab, hhBoom),
    ],
  }),
  score({
    title: "Dust Loop Flip",
    label: "Hip-Hop · chopped then open",
    bpm: 86,
    key: 2,
    swing: 0.08,
    form: [
      B(0, "m9", hhStab, hhBoom),
      B(10, "M9", hhStab, hhBoom),
      B(0, "m9", hhPiano, hhBoom, 2),
      B(3, "M9", hhPiano, hhBoom),
      B(10, "9", hhBell, hhBoom),
      B(0, "m9", doubled(hhBell, -5), hhTrap, 2),
      B(0, "m9", hhStab, bassHold),
    ],
  }),
];

const rkVerse = line("0:2:0 2:1:3 3:1:5");
const rkCh = line("0:.5:12 .5:.5:12 1:.5:10 1.5:.5:7 2:1:5 3:.5:3 3.5:.5:0");
const rkRiff = line("0:.5:0 .5:.5:0 1:.5:3 1.5:.5:5 2:1:7 3:.5:5 3.5:.5:3", 0);
const rkGallop = bassFrom("0:.5:0 .5:.25:0 .75:.25:0 1:.5:0 1.5:.25:0 1.75:.25:0 2:.5:0 2.5:.25:0 2.75:.25:0 3:.5:0 3.5:.5:7");

export const extraRock = [
  score({
    title: "Coastline",
    label: "Rock · quiet verse, stadium chorus",
    bpm: 118,
    key: 4,
    form: [
      B(0, "5", hold, bassHold, 2),
      B(0, "5", rkVerse, bassFrom("0:4:0"), 2),
      B(10, "5", rkVerse, bassFrom("0:4:0")),
      B(5, "5", rkVerse, bassFrom("0:4:0")),
      B(0, "5", rkCh, octaves),
      B(10, "5", rkCh, octaves),
      B(5, "5", rkCh, octaves),
      B(7, "5", rkCh, octaves),
      B(0, "5", rkRiff, rkGallop, 2),
      B(5, "5", rkRiff, rkGallop),
      B(7, "5", doubled(rkCh, 12), octaves),
      B(0, "5", hold, bassHold),
    ],
  }),
  score({
    title: "Last Light Anthem",
    label: "Rock · broken then full band",
    bpm: 104,
    key: 0,
    form: [
      B(0, "M", rest, bassHold),
      B(0, "M", rkVerse, bassFrom("0:2:0 2:2:7")),
      B(7, "M", rkVerse, bassFrom("0:2:0 2:2:7")),
      B(9, "m", rkVerse, bassFrom("0:2:0 2:2:7")),
      B(5, "M", rkVerse, bassFrom("0:2:0 2:2:7")),
      ...many(2, [B(0, "M", pulse, octaves), B(7, "M", pulse, octaves), B(9, "m", pulse, octaves), B(5, "M", pulse, octaves)]),
      B(0, "M", doubled(rkCh, 0), octaves),
    ],
  }),
];

const fkStab = hitsFrom("0:.25 .5:.25 .75:.25 1.5:.25 2:.5 3:.25 3.5:.25");
const fkGhost = hitsFrom(".5:.2 1.25:.2 1.75:.2 2.75:.2 3.5:.2");
const fkBass = bassFrom("0:.5:0 .75:.25:12 1.5:.5:0 2:.5:7 2.75:.25:12 3.5:.5:10");
const fkBreak = bassFrom("0:1:0 1:.5:0 2:2:0");
const fkHook = line("0:.25:7 .25:.25:10 .5:.25:12 1:.5:15 1.75:.25:12 2:.5:10 3:1:7");

export const extraFunk = [
  score({
    title: "Warehouse Pocket",
    label: "Funk · vamp, break, shout",
    bpm: 108,
    key: 4,
    form: [
      B(0, "9", fkGhost, fkBass, 2),
      B(0, "9", fkStab, fkBass, 4),
      B(0, "9", rest, fkBreak, 2),
      B(0, "9", fkHook, fkBass, 2),
      B(5, "9", fkHook, fkBass),
      B(0, "9", doubled(fkStab, 12), fkBass, 2),
      B(0, "9", fkGhost, bassHold),
    ],
  }),
  score({
    title: "Night Bus Groove",
    label: "Funk · call, mute, release",
    bpm: 102,
    key: 9,
    form: [
      B(0, "m9", fkStab, fkBass, 2),
      B(5, "9", fkStab, fkBass, 2),
      B(0, "m9", fkGhost, fkBreak, 2),
      B(0, "m9", fkHook, fkBass),
      B(5, "9", fkHook, fkBass),
      B(0, "7#9", doubled(fkHook, 12), fkBass, 2),
    ],
  }),
];

const skank = hitsFrom(".5:.35 1.5:.35 2.5:.35 3.5:.35");
const drop = bassFrom("2:.75:0 3:.5:0 3.5:.5:7");
const rockers = bassFrom("0:.75:0 1:.5:0 1.5:.5:7 2:.75:12 3:.5:7 3.5:.5:0");
const rgHook = line("0:1.5:7 1.5:.5:4 2:1:2 3:1:0");
const rgRun = line("0:.5:12 .5:.5:10 1:.5:7 1.5:.5:4 2:.5:7 2.5:.5:4 3:1:0");

export const extraReggae = [
  score({
    title: "Harbour Lights",
    label: "Reggae · one-drop verse, rockers chorus",
    bpm: 76,
    key: 7,
    form: [
      B(0, "M", rest, drop, 2),
      B(0, "M", skank, drop, 2),
      B(5, "M", skank, drop, 2),
      B(0, "M", rgHook, rockers),
      B(9, "m", rgHook, rockers),
      B(5, "M", rgHook, rockers),
      B(7, "M", rgHook, rockers),
      B(0, "M", rgRun, rockers),
      B(5, "M", doubled(rgHook, 12), rockers),
    ],
  }),
  score({
    title: "Dub Delay",
    label: "Reggae · strip then return",
    bpm: 70,
    key: 9,
    form: [
      B(0, "m", skank, drop, 2),
      B(0, "m", rest, drop, 2),
      B(5, "m", rest, drop),
      B(0, "m", rgHook, rockers, 2),
      B(7, "7", rgRun, rockers),
      B(0, "m", doubled(skank, 12), rockers, 2),
    ],
  }),
];

const chick: Pattern = (p, v, bpb) => {
  p.add(v.bass, 1, 0.8, 0.9);
  p.add(v.rh.map((m) => m - 12), 1, 0.7, 0.55);
  if (bpb <= 3) {
    p.add(v.rh.map((m) => m - 12), 1, 0.7, 0.55);
    return;
  }
  p.add(v.bass + 7, 1, 0.8, 0.75);
  p.add(v.rh.map((m) => m - 12), bpb - 3, 0.7, 0.55);
};
const ctyV = line("0:1:12 1:.5:16 1.5:.5:19 2:1.5:16 3.5:.5:12");
const ctyC = line("0:.5:19 .5:.5:21 1:.5:19 1.5:.5:16 2:1:12 3:.5:16 3.5:.5:19");
const ctyTurn = line("0:.5:16 .5:.5:19 1:.5:21 1.5:.5:19 2:.5:16 2.5:.5:12 3:1:7");

export const extraCountry = [
  score({
    title: "Dust Road Two-Step",
    label: "Country · verse fiddle, chorus double-stops",
    bpm: 116,
    key: 7,
    swing: 0.06,
    form: [
      B(0, "M", rest, chick),
      B(0, "M", ctyV, chick, 2),
      B(5, "M", ctyV, chick),
      B(7, "7", ctyV, chick),
      B(0, "M", ctyC, chick, 2),
      B(5, "M", ctyC, chick),
      B(7, "7", ctyTurn, chick),
      B(0, "M", doubled(ctyC, 7), chick, 2),
    ],
  }),
  score({
    title: "Porch Light Waltz",
    label: "Country · 3/4 story then lift",
    bpm: 108,
    key: 0,
    bpb: 3,
    form: [
      B(0, "M", hold, bassHold, 2),
      B(0, "M", line("0:1:12 1:1:16 2:1:19"), chick, 2),
      B(5, "M", line("0:1:17 1:1:16 2:1:12"), chick, 2),
      B(0, "M", line("0:.5:19 .5:.5:21 1:1:19 2:1:16"), chick, 2),
      B(7, "7", line("0:1:14 1:1:16 2:1:12"), chick),
      B(0, "M", doubled(line("0:1:12 1:1:16 2:1:19"), 7), chick, 2),
    ],
  }),
];

const ragA = line("0:.5:12 .5:1:16 1.5:.5:12 2:.5:16 2.5:1:19 3.5:.5:16");
const ragB = line("0:.5:19 .5:.5:17 1:.5:16 1.5:1:17 2.5:.5:19 3:1:21");
const ragRun = line("0:.5:12 .5:.5:14 1:.5:16 1.5:.5:17 2:.5:19 2.5:.5:21 3:1:24");
const ragBass: Pattern = (p, v) => {
  p.add([v.bass, v.bass - 12], 1, 0.8, 0.9);
  p.add(v.rh.map((m) => m - 12), 1, 0.7, 0.55);
  p.add([v.bass + 7, v.bass - 5], 1, 0.8, 0.8);
  p.add(v.rh.map((m) => m - 12), 1, 0.7, 0.55);
};

export const extraRagtime = [
  score({
    title: "Maple Street Rag",
    label: "Ragtime · A strain, B strain, A",
    bpm: 108,
    key: 0,
    form: [
      B(0, "M", ragA, ragBass, 2),
      B(9, "7", ragA, ragBass),
      B(2, "7", ragA, ragBass),
      B(7, "7", ragRun, ragBass),
      B(5, "M", ragB, ragBass, 2),
      B(0, "M", ragB, ragBass),
      B(7, "7", ragRun, ragBass),
      B(0, "M", doubled(ragA, 12), ragBass, 2),
    ],
  }),
  score({
    title: "Cakewalk Break",
    label: "Ragtime · stop-time then stride",
    bpm: 118,
    key: 5,
    form: [
      B(0, "M", ragA, ragBass, 2),
      B(0, "M", ragA, rest, 2),
      B(5, "M", ragB, ragBass, 2),
      B(7, "7", ragRun, ragBass),
      B(0, "M", doubled(ragB, 7), ragBass, 2),
    ],
  }),
];

const montuno = line("0:.5:0 .5:.5:3 1.5:.5:7 2:.5:3 3:.5:0 3.5:.5:3", 0);
const mambo = line("0:.5:0+12 .5:.5:4+16 1.5:.5:7+19 2:.5:4+16 3:.5:0+12 3.5:.5:4+16", 0);
const tumbao = bassFrom("1.5:.5:0 2:1:7 3.5:.5:0");
const bossaR: Pattern = (p, v) => {
  p.add(v.rh, 1.5, 0.9, 0.7);
  p.add(v.rh, 1, 0.9, 0.5);
  p.rest(0.5);
  p.add(v.rh, 1, 0.9, 0.65);
};
const bossaB = bassFrom("0:1.5:0 1.5:1.5:7 3:1:12");

export const extraLatin = [
  score({
    title: "Barrio Montuno",
    label: "Latin · montuno then mambo shout",
    bpm: 176,
    key: 9,
    form: [
      B(0, "m", montuno, tumbao, 4),
      B(5, "m", montuno, tumbao, 2),
      B(7, "7", montuno, tumbao, 2),
      B(0, "m", mambo, tumbao, 4),
      B(7, "7", line("0:.25:12 .25:.25:15 .5:.25:19 .75:.25:24 1:1:19 2:2:12"), tumbao),
      B(0, "m", doubled(montuno, 12), tumbao, 2),
    ],
  }),
  score({
    title: "Copacabana Dusk",
    label: "Latin · bossa verse, samba lift",
    bpm: 128,
    key: 2,
    form: [
      B(0, "m7", bossaR, bossaB, 2),
      B(5, "m7", bossaR, bossaB),
      B(10, "7", bossaR, bossaB),
      B(3, "M7", bossaR, bossaB),
      B(0, "m7", mambo, tumbao, 2),
      B(7, "7", mambo, tumbao),
      B(0, "m7", doubled(bossaR, 12), bossaB, 2),
    ],
  }),
];

const hymn = hold;
const shout = hitsFrom("0:.75 .75:.75 1.5:.5 2:.75 2.75:.25 3:1");
const walk = bassFrom("0:1:0 1:1:2 2:1:4 3:1:5");
const amen = hitsFrom("0:3 3:1");

export const extraGospel = [
  score({
    title: "Sunday Open the Doors",
    label: "Gospel · hymn into shout",
    bpm: 72,
    key: 0,
    swing: 0.08,
    form: [
      B(0, "M", hymn, bassHold, 2),
      B(5, "M", hymn, bassHold, 2),
      B(0, "M", hymn, bassHold),
      B(7, "7", hymn, bassHold),
      B(5, "M", amen, bassHold, 2),
      B(0, "M", amen, bassHold, 2),
      B(0, "M", shout, walk, 2),
      B(5, "M", shout, walk, 2),
      B(0, "M", doubled(shout, 12), octaves, 2),
      B(7, "7", line("0:.5:12 .5:.5:16 1:.5:19 1.5:.5:16 2:2:12"), walk),
    ],
  }),
  score({
    title: "Choir Loft Vamp",
    label: "Gospel · pads then praise break",
    bpm: 118,
    key: -2,
    swing: 0.1,
    form: [
      B(0, "M", hold, bassHold, 2),
      B(0, "M", shout, walk, 4),
      B(5, "M", shout, walk, 2),
      B(0, "M", rest, walk, 2),
      B(0, "M", doubled(shout, 12), octaves, 4),
    ],
  }),
];

const arpSlow: Pattern = (p, v, bpb) => {
  const idx = [0, 1, 2, 1];
  for (let i = 0; i < bpb; i++) p.add(v.root + v.ivs[idx[i % 4]], 1, 0.9, 0.55);
};
const arpFast: Pattern = (p, v, bpb) => {
  const idx = [0, 2, 1, 2, 3, 2, 1, 2];
  for (let i = 0; i < bpb * 2; i++) p.add(v.root + 12 + (v.ivs[idx[i % idx.length] % v.ivs.length] ?? 0), 0.5, 0.88, i % 4 ? 0.5 : 0.9);
};
const lead = line("0:.75:12 .75:.75:15 1.5:.5:19 2:1:17 3:1:15");
const oct16: Pattern = (p, v, bpb) => {
  for (let i = 0; i < bpb * 4; i++) p.add(v.bass + (i % 2 ? 12 : 0), 0.25, 0.8, i % 8 ? 0.45 : 0.9);
};

export const extraSynth = [
  score({
    title: "Neon Overpass",
    label: "Synth · filter-open build",
    bpm: 118,
    key: 9,
    form: [
      B(0, "m", arpSlow, bassHold, 2),
      B(8, "M", arpSlow, bassHold),
      B(3, "M", arpSlow, bassHold),
      B(10, "M", arpSlow, bassHold),
      B(0, "m", arpFast, oct16, 2),
      B(8, "M", arpFast, oct16),
      B(3, "M", arpFast, oct16),
      B(10, "M", arpFast, oct16),
      B(0, "m", lead, oct16, 2),
      B(0, "m", doubled(lead, 12), oct16, 2),
      B(0, "m", hold, bassHold),
    ],
  }),
  score({
    title: "Afterglow Pluck",
    label: "Synth · sparse then four-on-the-floor",
    bpm: 124,
    key: 0,
    form: [
      B(9, "m", hold, bassHold, 2),
      B(9, "m", arpSlow, bassFrom("0:4:0")),
      B(5, "M", arpSlow, bassFrom("0:4:0")),
      B(0, "M", arpSlow, bassFrom("0:4:0")),
      B(7, "M", arpSlow, bassFrom("0:4:0")),
      B(9, "m", pulse, octaves, 2),
      B(5, "M", pulse, octaves),
      B(0, "M", pulse, octaves),
      B(7, "M", pulse, octaves),
      B(9, "m", lead, oct16, 2),
    ],
  }),
];

const lickA = line("0:1:0 1:.5:3 1.5:.5:5 2:.5:6 2.5:.5:7 3:1:10", 12);
const lickB = line("0:.5:12 .5:.5:10 1:1:7 2:.5:5 2.5:.5:3 3:1:0", 12);
const stopRh = line("0:1:12 1:3:0", 12);
const boogie: Pattern = (p, v) => {
  for (const o of [0, 4, 7, 9, 10, 9, 7, 4]) p.add(v.bass + o, 0.5, 0.85, o === 0 ? 0.9 : 0.55);
};

export const extraBlues = [
  score({
    title: "Stop-Time Shuffle",
    label: "Blues · 12-bar with stop chorus",
    bpm: 104,
    key: 0,
    swing: 0.167,
    form: [
      B(0, "7", lickA, boogie, 4),
      B(5, "7", lickB, boogie, 2),
      B(0, "7", lickA, boogie, 2),
      B(7, "7", lickB, boogie),
      B(5, "7", lickA, boogie),
      B(0, "7", lickB, boogie),
      B(7, "7", lickA, boogie),
      B(0, "7", stopRh, rest, 4),
      B(5, "7", stopRh, rest, 2),
      B(0, "7", stopRh, rest, 2),
      B(7, "7", lickB, boogie),
      B(5, "7", lickA, boogie),
      B(0, "7", doubled(lickB, 12), boogie),
      B(7, "7", line("0:.5:10 .5:.5:7 1:.5:5 1.5:.5:3 2:2:0", 12), boogie),
    ],
  }),
  score({
    title: "Slow Burn in G",
    label: "Blues · sparse then full shuffle",
    bpm: 62,
    key: 7,
    swing: 0.14,
    form: [
      B(0, "7", hold, bassHold, 2),
      B(0, "7", lickB, bassFrom("0:2:0 2:2:7"), 2),
      B(5, "7", lickA, bassFrom("0:2:0 2:2:7"), 2),
      B(0, "7", lickB, boogie, 2),
      B(7, "7", lickA, boogie),
      B(5, "7", lickB, boogie),
      B(0, "7", doubled(lickA, 12), boogie, 2),
    ],
  }),
];

const ii = line("0:.5:5 .5:.5:9 1:.5:12 1.5:.5:16 2:.5:14 2.5:.5:12 3:.5:9 3.5:.5:5");
const V7 = line("0:.5:7 .5:.5:11 1:.5:14 1.5:.5:17 2:.5:16 2.5:.5:14 3:.5:11 3.5:.5:7");
const I = line("0:1:16 1:.5:12 1.5:.5:11 2:2:12");
const trade = line("0:.5:19 .5:.5:16 1:.5:14 1.5:.5:12 2:2:11");
const charleston: Pattern = (p, v) => {
  p.add(v.rh, 1.5, 0.92, 0.8);
  p.add(v.rh, 2.5, 0.92, 0.55);
};

export const extraJazz = [
  score({
    title: "Trading Fours Downtown",
    label: "Jazz · line, then space, then line",
    bpm: 168,
    key: 0,
    swing: 0.17,
    form: [
      B(2, "m7", ii, charleston),
      B(7, "7", V7, charleston),
      B(0, "M7", I, charleston),
      B(0, "M7", rest, charleston),
      B(2, "m7", rest, charleston),
      B(7, "7", rest, charleston),
      B(0, "M7", trade, charleston),
      B(0, "M7", I, charleston),
      B(2, "m7", doubled(ii, 12), charleston),
      B(7, "7", doubled(V7, 12), charleston),
      B(0, "M7", doubled(I, 12), charleston),
      B(0, "M7", hold, bassHold),
    ],
  }),
  score({
    title: "Late Set Ballad",
    label: "Jazz · rubato feel, then time",
    bpm: 72,
    key: 5,
    swing: 0.12,
    form: [
      B(2, "m7", hold, bassHold),
      B(7, "7", hold, bassHold),
      B(0, "M7", hold, bassHold, 2),
      B(2, "m7", ii, charleston),
      B(7, "7", V7, charleston),
      B(0, "M7", I, charleston, 2),
      B(5, "m7", trade, charleston),
      B(10, "7", V7, charleston),
      B(0, "M7", doubled(I, 12), charleston, 2),
    ],
  }),
];

function pianoPiece(title: string, bpm: number, bpb: number, rh: string, lh: string): () => Song {
  return () => makeSong(title, "Original piano", bpm, bpb, [new Part("R").text(rh), new Part("L").text(lh)]);
}

export const extraClassical = [
  pianoPiece(
    "Nocturne Sketch in A Minor",
    66,
    3,
    "E5:2 C5 A4 E5:2 C5 A4 F5:2 D5 B4 E5:3 " +
      "A5:2 E5 C5 G5:2 E5 B4 F5:2 D5 B4 E5:3 " +
      "C6:1.5 B5:.5 A5 G5 F5 E5 D5 C5 B4 A4 G#4 B4 A4:3 " +
      "E5:2 C5 A4 F5:2 D5 B4 E5:.5 D5:.5 C5 B4 A4:3",
    "A2:1 E3 A3 A2 E3 A3 D3 A3 F3 E3 B3 G#3 A2 E3 A3 A2 E3 A3 " +
      "A2 E3 A3 E2 B2 G#3 D3 A3 F3 E3 B3 G#3 A2 E3 A3 A2 E3 A3 " +
      "F2 C3 A3 E2 B2 G#3 D3 A3 F3 E3 B3 G#3 A2 E3 C4 A2:3 " +
      "A2 E3 A3 D3 A3 F3 E3 B3 G#3 A2 E3 C4 A2:3",
  ),
  pianoPiece(
    "Prelude Spark in G",
    112,
    4,
    "G4:.5 B4:.5 D5:.5 G5:.5 D5:.5 B4:.5 G4:.5 D4:.5 " +
      "A4:.5 C5:.5 E5:.5 A5:.5 E5:.5 C5:.5 A4:.5 E4:.5 " +
      "B4:.5 D5:.5 F#5:.5 B5:.5 F#5:.5 D5:.5 B4:.5 F#4:.5 " +
      "G4:.5 B4:.5 D5:.5 G5:.5 B5:.5 G5:.5 D5:.5 B4:.5 " +
      "C5:.5 E5:.5 G5:.5 C6:.5 G5:.5 E5:.5 C5:.5 G4:.5 " +
      "D5:.5 F#5:.5 A5:.5 C6:.5 A5:.5 F#5:.5 D5:.5 A4:.5 " +
      "G5:.5 D5:.5 B4:.5 G4:.5 D5:.5 B4:.5 G4:.5 D4:.5 " +
      "G4:4",
    "G2:2 D3:2 A2:2 E3:2 B2:2 F#3:2 G2:2 D3:2 C3:2 G3:2 D3:2 A3:2 G2:2 D3:2 G2:4",
  ),
];

const arpWide: Pattern = (p, v, bpb) => {
  for (let i = 0; i < bpb * 2; i++) p.add(v.root + v.ivs[i % v.ivs.length] + (i % 8 > 4 ? 12 : 0), 0.5, 0.9, i % 4 ? 0.5 : 0.85);
};

export const extraChords = [
  score({
    title: "Rising Inversions Wave",
    label: "Practice · inversions then cascade",
    bpm: 88,
    key: 0,
    form: [
      B(0, "M", hold, bassHold, 2),
      B(0, "M", arpWide, bassFrom("0:4:0"), 2),
      B(5, "M", arpWide, bassFrom("0:4:0"), 2),
      B(7, "M", arpWide, bassFrom("0:4:0"), 2),
      B(0, "M", doubled(arpWide, 12), octaves, 2),
    ],
  }),
];

export const extraLeft = [
  score({
    title: "Bass Story: Walk, Break, Boogie",
    label: "Left hand · three feels",
    bpm: 100,
    key: 0,
    swing: 0.1,
    form: [
      B(0, "M", hold, bassFrom("0:1:0 1:1:2 2:1:4 3:1:5"), 2),
      B(5, "M", hold, bassFrom("0:1:0 1:1:2 2:1:4 3:1:5"), 2),
      B(0, "M", rest, bassFrom("0:2:0 2:2:0"), 2),
      B(0, "7", hold, boogie, 2),
      B(5, "7", hold, boogie, 2),
      B(0, "7", hold, doubled(boogie, -12), 2),
    ],
  }),
];

export const extraScales = [
  score({
    title: "Scale Cascade with Accents",
    label: "Warm-up · quiet, then marked",
    bpm: 84,
    key: 0,
    form: [
      B(0, "M", line("0:.5:0 .5:.5:2 1:.5:4 1.5:.5:5 2:.5:7 2.5:.5:9 3:.5:11 3.5:.5:12", 0), bassHold, 2),
      B(0, "M", line("0:.25:12 .25:.25:11 .5:.25:9 .75:.25:7 1:.25:5 1.25:.25:4 1.5:.25:2 1.75:.25:0 2:.25:2 2.25:.25:4 2.5:.25:5 2.75:.25:7 3:.25:9 3.25:.25:11 3.5:.5:12", 0), bassFrom("0:2:0 2:2:7"), 2),
      B(0, "M", doubled(line("0:.5:0 .5:.5:2 1:.5:4 1.5:.5:5 2:.5:7 2.5:.5:9 3:.5:11 3.5:.5:12", 12), 12), octaves, 2),
    ],
  }),
];
