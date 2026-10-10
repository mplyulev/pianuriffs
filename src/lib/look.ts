import { create } from "zustand";
import type { Hand } from "./song";

export type PaletteId = "current" | "aurora" | "ember" | "ink";

export interface HandColor {
  hue: number;
  sat: number;
  l1: number;
  l2: number;
  hitL1: number;
  hitL2: number;
}

export interface Palette {
  id: PaletteId;
  name: string;
  hands: Record<Hand, HandColor>;
  bg0: string;
  bg1: string;
  grid: string;
  bar: string;
  wash0: string;
  wash1: string;
  line: [string, string, string];
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

const stage = {
  bg0: "#07070f",
  bg1: "#10102a",
  grid: "rgba(255,255,255,0.035)",
  bar: "rgba(255,255,255,0.10)",
  wash0: "rgba(120,140,255,0)",
  wash1: "rgba(120,140,255,0.22)",
  keyBed: "#0b0b18",
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

const hand = (hue: number, sat: number, l1 = 62, l2 = 48, hitL1 = 78, hitL2 = 62): HandColor => ({
  hue, sat, l1, l2, hitL1, hitL2,
});

export const PALETTES: Palette[] = [
  {
    id: "current",
    name: "Current",
    hands: { R: hand(190, 95), L: hand(320, 90) },
    ...stage,
    line: ["#22d3ee", "#818cf8", "#f472b6"],
  },
  {
    id: "aurora",
    name: "Aurora",
    hands: { R: hand(168, 82), L: hand(268, 74) },
    ...stage,
    wash0: "rgba(45,212,191,0)",
    wash1: "rgba(167,139,250,0.20)",
    line: ["#2dd4bf", "#818cf8", "#c4b5fd"],
  },
  {
    id: "ember",
    name: "Ember",
    hands: { R: hand(36, 94), L: hand(346, 80) },
    ...stage,
    wash0: "rgba(251,191,36,0)",
    wash1: "rgba(251,113,133,0.18)",
    line: ["#fbbf24", "#fb923c", "#fb7185"],
  },
  {
    id: "ink",
    name: "Ink",
    hands: {
      R: hand(40, 26, 90, 78, 96, 86),
      L: hand(207, 36, 74, 60, 84, 70),
    },
    bg0: "#100e0c",
    bg1: "#1c1814",
    grid: "rgba(255,244,230,0.028)",
    bar: "rgba(255,244,230,0.06)",
    wash0: "rgba(232,220,200,0)",
    wash1: "rgba(232,220,200,0.07)",
    line: ["#e8dcc6", "#d5cbb8", "#9eb6c9"],
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
];

const byId = (id: string) => PALETTES.find((p) => p.id === id) ?? PALETTES[0];

function loadId(): PaletteId {
  try {
    const id = localStorage.getItem("keystream.look") ?? "";
    if (PALETTES.some((p) => p.id === id)) return id as PaletteId;
  } catch {
    /* keep the default palette */
  }
  return "current";
}

interface LookState {
  id: PaletteId;
  palette: Palette;
  setId: (id: PaletteId) => void;
}

export const useLook = create<LookState>((set) => ({
  id: loadId(),
  palette: byId(loadId()),
  setId: (id) => {
    const palette = byId(id);
    try {
      localStorage.setItem("keystream.look", palette.id);
    } catch {
      /* storage can be blocked */
    }
    set({ id: palette.id, palette });
  },
}));
