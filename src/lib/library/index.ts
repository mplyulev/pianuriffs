import type { Song } from "../song";
import { CLASSICAL } from "./classical";
import { FAMILIAR } from "./familiar";
import { JAZZ } from "./styles";
import { BLUES, FUNK, HIPHOP, LOFI, POP, RNB, ROCK } from "./grooves";
import { COUNTRY, GOSPEL, LATIN, RAGTIME, REGGAE, SYNTH } from "./world";
import { CHORDS, LEFT_HAND, SCALES } from "./practice";
import {
  extraBlues,
  extraChords,
  extraClassical,
  extraCountry,
  extraFunk,
  extraGospel,
  extraHiphop,
  extraJazz,
  extraLeft,
  extraLofi,
  extraPop,
  extraRagtime,
  extraReggae,
  extraRnb,
  extraRock,
  extraScales,
  extraSynth,
  extraLatin,
} from "./extras";

export interface Category {
  id: string;
  name: string;
  blurb: string;
  accent: string;
  hands: { L: boolean; R: boolean };
  items: (() => Song)[];
}

export const CATEGORIES: Category[] = [
  { id: "classical", name: "Songs & Classics", blurb: "Public-domain favourites", accent: "from-cyan-400 to-indigo-500", hands: { L: false, R: true }, items: [...CLASSICAL, ...extraClassical] },
  { id: "pop", name: "Pop Progressions", blurb: "Loops you hear everywhere", accent: "from-pink-400 to-rose-500", hands: { L: true, R: true }, items: [...POP, ...extraPop] },
  { id: "familiar", name: "Familiar Riffs", blurb: "Original hooks in the spirit of songs you know", accent: "from-rose-400 to-amber-300", hands: { L: true, R: true }, items: FAMILIAR },
  { id: "lofi", name: "Lo-Fi", blurb: "Mellow jazzy loops to study to", accent: "from-orange-200 to-rose-400", hands: { L: false, R: true }, items: [...LOFI, ...extraLofi] },
  { id: "rnb", name: "R&B / Soul", blurb: "Smooth grooves and slow jams", accent: "from-fuchsia-300 to-purple-500", hands: { L: false, R: true }, items: [...RNB, ...extraRnb] },
  { id: "hiphop", name: "Hip-Hop", blurb: "Boom bap, trap and sample loops", accent: "from-yellow-300 to-amber-500", hands: { L: false, R: true }, items: [...HIPHOP, ...extraHiphop] },
  { id: "rock", name: "Rock", blurb: "Power chords and riffs", accent: "from-red-400 to-orange-500", hands: { L: false, R: true }, items: [...ROCK, ...extraRock] },
  { id: "funk", name: "Funk", blurb: "Tight, syncopated pockets", accent: "from-teal-300 to-cyan-500", hands: { L: false, R: true }, items: [...FUNK, ...extraFunk] },
  { id: "reggae", name: "Reggae", blurb: "Skank, one-drop and dub", accent: "from-green-300 to-yellow-400", hands: { L: false, R: true }, items: [...REGGAE, ...extraReggae] },
  { id: "country", name: "Country", blurb: "Boom-chick, steel slips, two-steps", accent: "from-amber-200 to-orange-400", hands: { L: false, R: true }, items: [...COUNTRY, ...extraCountry] },
  { id: "ragtime", name: "Ragtime", blurb: "Syncopated stride", accent: "from-stone-200 to-amber-500", hands: { L: false, R: true }, items: [...RAGTIME, ...extraRagtime] },
  { id: "latin", name: "Latin", blurb: "Montuno, bossa, samba, mambo", accent: "from-rose-300 to-orange-500", hands: { L: false, R: true }, items: [...LATIN, ...extraLatin] },
  { id: "gospel", name: "Gospel", blurb: "Walk-ups, shouts and amens", accent: "from-indigo-300 to-violet-500", hands: { L: false, R: true }, items: [...GOSPEL, ...extraGospel] },
  { id: "synth", name: "Synth / EDM", blurb: "Arps, plucks and driving bass", accent: "from-cyan-300 to-fuchsia-500", hands: { L: false, R: true }, items: [...SYNTH, ...extraSynth] },
  { id: "blues", name: "Blues Licks", blurb: "12-bar grooves with licks", accent: "from-amber-300 to-orange-500", hands: { L: false, R: true }, items: [...BLUES, ...extraBlues] },
  { id: "jazz", name: "Jazz Licks", blurb: "ii–V–I lines and comping", accent: "from-violet-400 to-fuchsia-500", hands: { L: false, R: true }, items: [...JAZZ, ...extraJazz] },
  { id: "chords", name: "Chords & Arpeggios", blurb: "Voicings under your fingers", accent: "from-emerald-300 to-teal-500", hands: { L: false, R: true }, items: [...CHORDS, ...extraChords] },
  { id: "left", name: "Left-Hand Patterns", blurb: "Bass and accompaniment drills", accent: "from-sky-300 to-blue-500", hands: { L: true, R: false }, items: [...LEFT_HAND, ...extraLeft] },
  { id: "scales", name: "Scales & Warm-ups", blurb: "Technique and dexterity", accent: "from-lime-300 to-green-500", hands: { L: false, R: true }, items: [...SCALES, ...extraScales] },
];

const cache = new Map<string, Song>();

export function locateSong(current: Song): { category: Category; index: number } | null {
  for (const category of CATEGORIES) {
    for (let index = 0; index < category.items.length; index++) {
      if (loadItem(category, index) === current) return { category, index };
    }
  }
  return null;
}

/** Next piece in the same category, or the first piece of the following category. */
export function nextAfter(current: Song): { song: Song; category: Category } {
  const found = locateSong(current);
  if (!found) {
    const category = CATEGORIES[0];
    return { song: loadItem(category, 0), category };
  }
  if (found.index + 1 < found.category.items.length) {
    return { song: loadItem(found.category, found.index + 1), category: found.category };
  }
  const ci = CATEGORIES.indexOf(found.category);
  const category = CATEGORIES[(ci + 1) % CATEGORIES.length];
  return { song: loadItem(category, 0), category };
}

export function loadItem(cat: Category, index: number): Song {
  const key = `${cat.id}:${index}`;
  let s = cache.get(key);
  if (!s) {
    s = cat.items[index]();
    cache.set(key, s);
  }
  return s;
}

export function barsOf(song: Song) {
  return Math.max(1, Math.ceil((song.length - 1e-4) / song.beatsPerBar));
}

export function barAt(pos: number, song: Song) {
  const total = barsOf(song);
  if (pos <= 0) return 1;
  return Math.min(total, Math.floor(pos / song.beatsPerBar) + 1);
}

export function difficultyOf(song: Song): 1 | 2 | 3 | 4 | 5 {
  const bars = Math.max(1, song.length / song.beatsPerBar);
  const density = song.notes.length / bars;
  const span = song.notes.reduce((a, n) => Math.max(a, n.midi), 0) - song.notes.reduce((a, n) => Math.min(a, n.midi), 127);
  const score = density * 0.65 + span * 0.08;
  if (score < 4.5) return 1;
  if (score < 8) return 2;
  if (score < 12) return 3;
  if (score < 17) return 4;
  return 5;
}

export function dailyPick(at = new Date()) {
  const day = Math.floor(Date.UTC(at.getFullYear(), at.getMonth(), at.getDate()) / 86400000);
  let n = 0;
  for (const c of CATEGORIES) n += c.items.length;
  let i = ((day * 2654435761) >>> 0) % Math.max(1, n);
  for (const category of CATEGORIES) {
    if (i < category.items.length) return { category, index: i, song: loadItem(category, i) };
    i -= category.items.length;
  }
  const category = CATEGORIES[0];
  return { category, index: 0, song: loadItem(category, 0) };
}
