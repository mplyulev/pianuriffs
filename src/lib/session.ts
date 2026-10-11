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
  const found = locateSong(song);
  if (found) {
    patchSession({ cat: found.category.id, index: found.index });
    return;
  }
  if (song.title === DEMO_SONG.title && song.composer === DEMO_SONG.composer) {
    patchSession({ cat: "classical", index: 0 });
  }
}
