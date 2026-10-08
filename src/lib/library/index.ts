import type { Song } from "../song";
import { CLASSICAL } from "./classical";
import { BLUES, JAZZ, POP } from "./styles";
import { CHORDS, LEFT_HAND, SCALES } from "./practice";

export interface Category {
  id: string;
  name: string;
  blurb: string;
  accent: string;
  hands: { L: boolean; R: boolean };
  items: (() => Song)[];
}

export const CATEGORIES: Category[] = [
  { id: "classical", name: "Songs & Classics", blurb: "Public-domain favourites", accent: "from-cyan-400 to-indigo-500", hands: { L: false, R: true }, items: CLASSICAL },
  { id: "pop", name: "Pop Progressions", blurb: "Loops you hear everywhere", accent: "from-pink-400 to-rose-500", hands: { L: true, R: true }, items: POP },
  { id: "blues", name: "Blues Licks", blurb: "12-bar grooves with licks", accent: "from-amber-300 to-orange-500", hands: { L: false, R: true }, items: BLUES },
  { id: "jazz", name: "Jazz Licks", blurb: "ii–V–I lines and comping", accent: "from-violet-400 to-fuchsia-500", hands: { L: false, R: true }, items: JAZZ },
  { id: "chords", name: "Chords & Arpeggios", blurb: "Voicings under your fingers", accent: "from-emerald-300 to-teal-500", hands: { L: false, R: true }, items: CHORDS },
  { id: "left", name: "Left-Hand Patterns", blurb: "Bass and accompaniment drills", accent: "from-sky-300 to-blue-500", hands: { L: true, R: false }, items: LEFT_HAND },
  { id: "scales", name: "Scales & Warm-ups", blurb: "Technique and dexterity", accent: "from-lime-300 to-green-500", hands: { L: false, R: true }, items: SCALES },
];

const cache = new Map<string, Song>();
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
  return Math.ceil(song.length / song.beatsPerBar);
}
