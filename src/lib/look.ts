import { create } from "zustand";
import type { Hand } from "./song";

export type PaletteId = "current" | "aurora" | "ember" | "ink";
export type StageId = "midnight" | "dusk" | "lagoon" | "hearth" | "grove" | "rose" | "parchment" | "paper" | "custom";

export interface HandColor {
  hue: number;
  sat: number;
  l1: number;
  l2: number;
  hitL1: number;
  hitL2: number;
}

export interface NoteTheme {
  id: PaletteId;
  name: string;
  hands: Record<Hand, HandColor>;
  line: [string, string, string];
}

export interface Stage {
  id: StageId;
  name: string;
  light: boolean;
  bg0: string;
  bg1: string;
  grid: string;
  bar: string;
  wash0: string;
  wash1: string;
  keyBed: string;
  whiteTop: string;
  whiteBot: string;
  blackTop: string;
  blackBot: string;
  heldWhiteTop: string;
  heldWhiteBot: string;
  heldBlackTop: string;
  heldBlackBot: string;
  cLabel: string;
}

const hand = (hue: number, sat: number, l1 = 62, l2 = 48, hitL1 = 78, hitL2 = 62): HandColor => ({
  hue, sat, l1, l2, hitL1, hitL2,
});

const keys = {
  whiteTop: "#f4f5fb",
  whiteBot: "#d5d8e6",
  blackTop: "#2a2a3d",
  blackBot: "#0d0d16",
  heldWhiteTop: "#c9d4ff",
  heldWhiteBot: "#8ea2ff",
  heldBlackTop: "#8aa0ff",
  heldBlackBot: "#4559d6",
  cLabel: "rgba(20,20,40,0.45)",
};

export const NOTE_THEMES: NoteTheme[] = [
  {
    id: "current",
    name: "Current",
    hands: { R: hand(190, 95), L: hand(320, 90) },
    line: ["#22d3ee", "#818cf8", "#f472b6"],
  },
  {
    id: "aurora",
    name: "Aurora",
    hands: { R: hand(168, 82), L: hand(268, 74) },
    line: ["#2dd4bf", "#818cf8", "#c4b5fd"],
  },
  {
    id: "ember",
    name: "Ember",
    hands: { R: hand(36, 94), L: hand(346, 80) },
    line: ["#fbbf24", "#fb923c", "#fb7185"],
  },
  {
    id: "ink",
    name: "Ink",
    hands: {
      R: hand(40, 26, 90, 78, 96, 86),
      L: hand(207, 36, 74, 60, 84, 70),
    },
    line: ["#e8dcc6", "#d5cbb8", "#9eb6c9"],
  },
];

export const STAGES: Stage[] = [
  {
    id: "midnight",
    name: "Midnight",
    light: false,
    bg0: "#07070f",
    bg1: "#10102a",
    grid: "rgba(255,255,255,0.035)",
    bar: "rgba(255,255,255,0.10)",
    wash0: "rgba(120,140,255,0)",
    wash1: "rgba(120,140,255,0.22)",
    keyBed: "#0b0b18",
    ...keys,
  },
  {
    id: "dusk",
    name: "Dusk",
    light: false,
    bg0: "#100818",
    bg1: "#2a1640",
    grid: "rgba(255,255,255,0.04)",
    bar: "rgba(255,255,255,0.10)",
    wash0: "rgba(167,139,250,0)",
    wash1: "rgba(167,139,250,0.24)",
    keyBed: "#140c1e",
    ...keys,
    blackTop: "#322848",
    blackBot: "#120c18",
    heldWhiteTop: "#eadcff",
    heldWhiteBot: "#c4b5fd",
    heldBlackTop: "#a78bfa",
    heldBlackBot: "#5b3d8a",
  },
  {
    id: "lagoon",
    name: "Lagoon",
    light: false,
    bg0: "#031416",
    bg1: "#0c3034",
    grid: "rgba(255,255,255,0.04)",
    bar: "rgba(255,255,255,0.10)",
    wash0: "rgba(45,212,191,0)",
    wash1: "rgba(45,212,191,0.22)",
    keyBed: "#062022",
    ...keys,
    blackTop: "#1c3838",
    blackBot: "#071414",
    heldWhiteTop: "#ccfbf1",
    heldWhiteBot: "#5eead4",
    heldBlackTop: "#2dd4bf",
    heldBlackBot: "#0f766e",
  },
  {
    id: "hearth",
    name: "Hearth",
    light: false,
    bg0: "#140806",
    bg1: "#321410",
    grid: "rgba(255,255,255,0.04)",
    bar: "rgba(255,255,255,0.10)",
    wash0: "rgba(251,146,60,0)",
    wash1: "rgba(251,146,60,0.22)",
    keyBed: "#1a0c08",
    ...keys,
    blackTop: "#3a2820",
    blackBot: "#140c0a",
    heldWhiteTop: "#ffedd5",
    heldWhiteBot: "#fdba74",
    heldBlackTop: "#fb923c",
    heldBlackBot: "#9a3412",
  },
  {
    id: "grove",
    name: "Grove",
    light: false,
    bg0: "#06140c",
    bg1: "#12321c",
    grid: "rgba(255,255,255,0.04)",
    bar: "rgba(255,255,255,0.10)",
    wash0: "rgba(74,222,128,0)",
    wash1: "rgba(74,222,128,0.16)",
    keyBed: "#0a1a10",
    ...keys,
    blackTop: "#24382c",
    blackBot: "#0c1410",
    heldWhiteTop: "#dcfce7",
    heldWhiteBot: "#86efac",
    heldBlackTop: "#4ade80",
    heldBlackBot: "#166534",
  },
  {
    id: "rose",
    name: "Rose",
    light: false,
    bg0: "#140810",
    bg1: "#341428",
    grid: "rgba(255,255,255,0.04)",
    bar: "rgba(255,255,255,0.10)",
    wash0: "rgba(244,114,182,0)",
    wash1: "rgba(244,114,182,0.2)",
    keyBed: "#1a0c14",
    ...keys,
    blackTop: "#3a2432",
    blackBot: "#140810",
    heldWhiteTop: "#fce7f3",
    heldWhiteBot: "#f9a8d4",
    heldBlackTop: "#f472b6",
    heldBlackBot: "#9d174d",
  },
  {
    id: "parchment",
    name: "Parchment",
    light: false,
    bg0: "#100e0c",
    bg1: "#1c1814",
    grid: "rgba(255,244,230,0.028)",
    bar: "rgba(255,244,230,0.06)",
    wash0: "rgba(232,220,200,0)",
    wash1: "rgba(232,220,200,0.07)",
    keyBed: "#14110e",
    whiteTop: "#f6f0e6",
    whiteBot: "#e3dacb",
    blackTop: "#3a342c",
    blackBot: "#14110e",
    heldWhiteTop: "#fff6e8",
    heldWhiteBot: "#e7d3b0",
    heldBlackTop: "#8eb0c4",
    heldBlackBot: "#3d5a6e",
    cLabel: "rgba(48,38,28,0.55)",
  },
  {
    id: "paper",
    name: "Paper",
    light: true,
    bg0: "#f7f3ec",
    bg1: "#e6dccb",
    grid: "rgba(90,60,30,0.08)",
    bar: "rgba(90,60,30,0.16)",
    wash0: "rgba(160,120,70,0)",
    wash1: "rgba(160,120,70,0.12)",
    keyBed: "#d8cdb8",
    whiteTop: "#fffdf8",
    whiteBot: "#efe4d4",
    blackTop: "#3a322c",
    blackBot: "#161310",
    heldWhiteTop: "#fff4d2",
    heldWhiteBot: "#e7c98a",
    heldBlackTop: "#8a6a3a",
    heldBlackBot: "#4a3820",
    cLabel: "rgba(60,42,24,0.55)",
  },
];

const hsl = (h: number, s: number, l: number) =>
  `hsl(${Math.round(((h % 360) + 360) % 360)} ${Math.round(clamp01(s) * 100)}% ${Math.round(clamp01(l) * 100)}%)`;

const hsla = (h: number, s: number, l: number, a: number) =>
  `hsla(${Math.round(((h % 360) + 360) % 360)},${Math.round(clamp01(s) * 100)}%,${Math.round(clamp01(l) * 100)}%,${a})`;

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function hexToHsl(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
}

export function stageFromHex(hex: string): Stage {
  const { h, s, l } = hexToHsl(hex);
  const light = l >= 0.6;
  if (light) {
    const sat = Math.min(0.7, s);
    return {
      id: "custom",
      name: "Custom",
      light: true,
      bg0: hsl(h, sat * 0.75, Math.min(0.97, l + 0.06)),
      bg1: hsl(h, sat, l),
      grid: hsla(h, 0.25, 0.2, 0.09),
      bar: hsla(h, 0.3, 0.16, 0.16),
      wash0: hsla(h, sat, 0.5, 0),
      wash1: hsla(h, sat, 0.4, 0.14),
      keyBed: hsl(h, Math.min(0.28, sat), Math.max(0.62, l - 0.16)),
      whiteTop: "#fffdf9",
      whiteBot: hsl(h, 0.12, 0.9),
      blackTop: hsl(h, 0.16, 0.2),
      blackBot: hsl(h, 0.2, 0.08),
      heldWhiteTop: hsl(h, 0.45, 0.95),
      heldWhiteBot: hsl(h, 0.5, 0.74),
      heldBlackTop: hsl(h, 0.4, 0.42),
      heldBlackBot: hsl(h, 0.42, 0.24),
      cLabel: hsla(h, 0.2, 0.18, 0.55),
    };
  }
  const sat = Math.min(0.9, s);
  return {
    id: "custom",
    name: "Custom",
    light: false,
    bg0: hsl(h, sat, Math.max(0.015, l * 0.42)),
    bg1: hsl(h, sat, l),
    grid: "rgba(255,255,255,0.045)",
    bar: "rgba(255,255,255,0.12)",
    wash0: hsla(h, sat, Math.min(0.72, l + 0.25), 0),
    wash1: hsla(h, sat, Math.min(0.68, l + 0.2), 0.28),
    keyBed: hsl(h, sat * 0.8, Math.max(0.012, l * 0.28)),
    ...keys,
    blackTop: hsl(h, Math.min(0.35, sat), 0.16),
    blackBot: hsl(h, Math.min(0.4, sat), 0.05),
    heldWhiteTop: hsl(h, 0.42, 0.9),
    heldWhiteBot: hsl(h, 0.5, 0.68),
    heldBlackTop: hsl(h, 0.52, 0.56),
    heldBlackBot: hsl(h, 0.5, 0.32),
  };
}

const noteById = (id: string) => NOTE_THEMES.find((p) => p.id === id) ?? NOTE_THEMES[0];
const stageById = (id: string) => STAGES.find((p) => p.id === id) ?? STAGES[0];

const KEY = "keystream.look";
const DEFAULT_CUSTOM = "#2a1848";

function validHex(v: unknown) {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : null;
}

function load() {
  const fallback = { notesId: "current" as PaletteId, stageId: "midnight" as StageId, custom: DEFAULT_CUSTOM };
  try {
    const raw = localStorage.getItem(KEY) ?? "";
    if (!raw) return fallback;
    if (raw.startsWith("{")) {
      const j = JSON.parse(raw) as { notes?: string; stage?: string; custom?: string };
      const notesId = NOTE_THEMES.some((p) => p.id === j.notes) ? (j.notes as PaletteId) : fallback.notesId;
      const stageId = j.stage === "custom" || STAGES.some((p) => p.id === j.stage) ? (j.stage as StageId) : fallback.stageId;
      return { notesId, stageId, custom: validHex(j.custom) ?? DEFAULT_CUSTOM };
    }
    if (raw === "ink") return { notesId: "ink" as PaletteId, stageId: "parchment" as StageId, custom: "#1c1814" };
    if (NOTE_THEMES.some((p) => p.id === raw)) return { ...fallback, notesId: raw as PaletteId };
  } catch {
    /* keep the defaults */
  }
  return fallback;
}

function persist(notesId: PaletteId, stageId: StageId, custom: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ notes: notesId, stage: stageId, custom }));
  } catch {
    /* storage can be blocked */
  }
}

function resolve(notesId: PaletteId, stageId: StageId, custom: string) {
  return {
    notesId,
    stageId,
    custom,
    notes: noteById(notesId),
    stage: stageId === "custom" ? stageFromHex(custom) : stageById(stageId),
  };
}

interface LookState {
  notesId: PaletteId;
  stageId: StageId;
  custom: string;
  notes: NoteTheme;
  stage: Stage;
  setNotes: (id: PaletteId) => void;
  setStage: (id: StageId) => void;
  setCustom: (hex: string) => void;
}

const initial = load();

export const useLook = create<LookState>((set) => ({
  ...resolve(initial.notesId, initial.stageId, initial.custom),
  setNotes: (id) => set((s) => {
    persist(id, s.stageId, s.custom);
    return resolve(id, s.stageId, s.custom);
  }),
  setStage: (id) => set((s) => {
    persist(s.notesId, id, s.custom);
    return resolve(s.notesId, id, s.custom);
  }),
  setCustom: (hex) => set((s) => {
    const custom = validHex(hex);
    if (!custom) return s;
    persist(s.notesId, "custom", custom);
    return resolve(s.notesId, "custom", custom);
  }),
}));
