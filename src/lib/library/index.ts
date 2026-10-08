import type { Song } from "../song";
import { CLASSICAL } from "./classical";
import { JAZZ } from "./styles";
import { BLUES, FUNK, HIPHOP, LOFI, POP, RNB, ROCK } from "./grooves";
import { COUNTRY, GOSPEL, LATIN, RAGTIME, REGGAE, SYNTH } from "./world";
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
  { id: "lofi", name: "Lo-Fi", blurb: "Mellow jazzy loops to study to", accent: "from-orange-200 to-rose-400", hands: { L: false, R: true }, items: LOFI },
  { id: "rnb", name: "R&B / Soul", blurb: "Smooth grooves and slow jams", accent: "from-fuchsia-300 to-purple-500", hands: { L: false, R: true }, items: RNB },
  { id: "hiphop", name: "Hip-Hop", blurb: "Boom bap, trap and sample loops", accent: "from-yellow-300 to-amber-500", hands: { L: false, R: true }, items: HIPHOP },
  { id: "rock", name: "Rock", blurb: "Power chords and riffs", accent: "from-red-400 to-orange-500", hands: { L: false, R: true }, items: ROCK },
  { id: "funk", name: "Funk", blurb: "Tight, syncopated pockets", accent: "from-teal-300 to-cyan-500", hands: { L: false, R: true }, items: FUNK },
  { id: "reggae", name: "Reggae", blurb: "Skank, one-drop and dub", accent: "from-green-300 to-yellow-400", hands: { L: false, R: true }, items: REGGAE },
  { id: "country", name: "Country", blurb: "Boom-chick, steel slips, two-steps", accent: "from-amber-200 to-orange-400", hands: { L: false, R: true }, items: COUNTRY },
  { id: "ragtime", name: "Ragtime", blurb: "Syncopated stride", accent: "from-stone-200 to-amber-500", hands: { L: false, R: true }, items: RAGTIME },
  { id: "latin", name: "Latin", blurb: "Montuno, bossa, samba, mambo", accent: "from-rose-300 to-orange-500", hands: { L: false, R: true }, items: LATIN },
  { id: "gospel", name: "Gospel", blurb: "Walk-ups, shouts and amens", accent: "from-indigo-300 to-violet-500", hands: { L: false, R: true }, items: GOSPEL },
  { id: "synth", name: "Synth / EDM", blurb: "Arps, plucks and driving bass", accent: "from-cyan-300 to-fuchsia-500", hands: { L: false, R: true }, items: SYNTH },
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
