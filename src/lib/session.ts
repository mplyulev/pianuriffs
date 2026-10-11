import { CATEGORIES, loadItem, locateSong } from "./library";
import { DEMO_SONG, type Song } from "./song";

const KEY = "keystream.session";
const MODES = new Set(["wait", "play", "echo"]);

export type SessionMode = "wait" | "play" | "echo";

export interface SessionSnap {
  cat: string;
  index: number;
  libraryCategory: string;
  mode: SessionMode;
  hands: { L: boolean; R: boolean };
  speed: number;
  metronome: boolean;
  appSound: boolean;
  countIn: boolean;
  octave: number;
}

const FALLBACK: SessionSnap = {
  cat: "classical",
  index: 0,
  libraryCategory: "classical",
  mode: "play",
  hands: { L: true, R: true },
  speed: 0.8,
  metronome: false,
  appSound: true,
  countIn: true,
  octave: 4,
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function validCat(id: unknown) {
  return typeof id === "string" && CATEGORIES.some((c) => c.id === id) ? id : null;
}

function parse(raw: unknown): SessionSnap {
  if (!raw || typeof raw !== "object") return { ...FALLBACK };
  const j = raw as Record<string, unknown>;
  const cat = validCat(j.cat) ?? FALLBACK.cat;
  const category = CATEGORIES.find((c) => c.id === cat) ?? CATEGORIES[0];
  const index = typeof j.index === "number" && Number.isInteger(j.index) && j.index >= 0 && j.index < category.items.length
    ? j.index
    : 0;
  const handsIn = j.hands && typeof j.hands === "object" ? (j.hands as { L?: unknown; R?: unknown }) : {};
  const L = handsIn.L !== false;
  const R = handsIn.R !== false;
  const hands = !L && !R ? { ...FALLBACK.hands } : { L, R };
  const mode = typeof j.mode === "string" && MODES.has(j.mode) ? (j.mode as SessionMode) : FALLBACK.mode;
  return {
    cat,
    index,
    libraryCategory: validCat(j.libraryCategory) ?? cat,
    mode,
    hands,
    speed: typeof j.speed === "number" && Number.isFinite(j.speed) ? clamp(j.speed, 0.25, 1.25) : FALLBACK.speed,
    metronome: Boolean(j.metronome),
    appSound: j.appSound !== false,
    countIn: j.countIn !== false,
    octave: typeof j.octave === "number" && Number.isFinite(j.octave) ? Math.round(clamp(j.octave, 1, 7)) : FALLBACK.octave,
  };
}

let hadFile = false;

function readRaw(): SessionSnap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...FALLBACK };
    hadFile = true;
    return parse(JSON.parse(raw));
  } catch {
    return { ...FALLBACK };
  }
}

let snap = readRaw();

export function getSession(): SessionSnap {
  return snap;
}

export function songFromSession(): Song {
  if (!hadFile) return DEMO_SONG;
  const cat = CATEGORIES.find((c) => c.id === snap.cat) ?? CATEGORIES[0];
  const index = Math.min(snap.index, cat.items.length - 1);
  return loadItem(cat, Math.max(0, index));
}

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(snap));
  } catch {
    /* storage can be blocked */
  }
}

export function patchSession(partial: Partial<SessionSnap>) {
  const next = { ...snap, ...partial };
  if (JSON.stringify(next) === JSON.stringify(snap)) return;
  snap = next;
  write();
}

export function rememberSong(song: Song) {
  const key = songKey(song);
  if (!key) return;
  const [cat, index] = key.split(":");
  patchSession({ cat, index: Number(index) });
}

const SONGS_KEY = "keystream.songs";

export interface SongMem {
  mode: SessionMode;
  hands: { L: boolean; R: boolean };
  speed: number;
  bestAcc: number | null;
  plays: number;
}

function songKey(song: Song): string | null {
  const found = locateSong(song);
  if (found) return `${found.category.id}:${found.index}`;
  if (song.title === DEMO_SONG.title && song.composer === DEMO_SONG.composer) return "classical:0";
  return null;
}

function readSongs(): Record<string, SongMem> {
  try {
    const raw = localStorage.getItem(SONGS_KEY);
    if (!raw) return {};
    const j = JSON.parse(raw) as Record<string, Partial<SongMem>>;
    const out: Record<string, SongMem> = {};
    for (const [k, v] of Object.entries(j)) {
      if (!v || typeof v !== "object") continue;
      const handsIn = v.hands && typeof v.hands === "object" ? (v.hands as { L?: unknown; R?: unknown }) : {};
      const L = handsIn.L !== false;
      const R = handsIn.R !== false;
      out[k] = {
        mode: typeof v.mode === "string" && MODES.has(v.mode) ? (v.mode as SessionMode) : FALLBACK.mode,
        hands: !L && !R ? { ...FALLBACK.hands } : { L, R },
        speed: typeof v.speed === "number" && Number.isFinite(v.speed) ? clamp(v.speed, 0.25, 1.25) : FALLBACK.speed,
        bestAcc: typeof v.bestAcc === "number" && Number.isFinite(v.bestAcc) ? clamp(v.bestAcc, 0, 100) : null,
        plays: typeof v.plays === "number" && v.plays > 0 ? Math.floor(v.plays) : 0,
      };
    }
    return out;
  } catch {
    return {};
  }
}

let songs = readSongs();

function writeSongs() {
  try {
    localStorage.setItem(SONGS_KEY, JSON.stringify(songs));
  } catch {
    /* storage can be blocked */
  }
}

export function allSongMem(): Record<string, SongMem> {
  return songs;
}

export function prefsForSong(song: Song): { mode: SessionMode; hands: SongMem["hands"]; speed: number } | null {
  const key = songKey(song);
  if (!key || !songs[key]) return null;
  const m = songs[key];
  return { mode: m.mode, hands: m.hands, speed: m.speed };
}

export function persistSongPrefs(s: { song: Song; mode: SessionMode; hands: SongMem["hands"]; speed: number }) {
  const key = songKey(s.song);
  if (!key) return;
  const prev = songs[key];
  songs = {
    ...songs,
    [key]: {
      mode: s.mode,
      hands: s.hands,
      speed: s.speed,
      bestAcc: prev?.bestAcc ?? null,
      plays: prev?.plays ?? 0,
    },
  };
  writeSongs();
}

export function recordSongRun(song: Song, acc: number | null) {
  const key = songKey(song);
  if (!key) return;
  const prev = songs[key] ?? {
    mode: snap.mode,
    hands: snap.hands,
    speed: snap.speed,
    bestAcc: null as number | null,
    plays: 0,
  };
  const bestAcc = acc === null ? prev.bestAcc : Math.max(prev.bestAcc ?? 0, acc);
  songs = { ...songs, [key]: { ...prev, bestAcc, plays: prev.plays + 1 } };
  writeSongs();
}

export function bestForKey(key: string): { bestAcc: number | null; plays: number } {
  const m = songs[key];
  return { bestAcc: m?.bestAcc ?? null, plays: m?.plays ?? 0 };
}
