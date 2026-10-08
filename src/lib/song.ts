import { Midi } from "@tonejs/midi";

export type Hand = "L" | "R";

export interface SongNote {
  midi: number;
  start: number;
  dur: number;
  hand: Hand;
  vel?: number;
}

export interface Song {
  title: string;
  composer: string;
  bpm: number;
  beatsPerBar: number;
  notes: SongNote[];
  length: number;
}

const NAMES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function noteNumber(name: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  const acc = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
  return 12 * (Number(m[3]) + 1) + NAMES[m[1]] + acc;
}

export function finalize(song: Omit<Song, "length">): Song {
  const notes = [...song.notes].sort((a, b) => a.start - b.start || a.midi - b.midi);
  const length = notes.reduce((m, n) => Math.max(m, n.start + n.dur), 0);
  return { ...song, notes, length };
}

function demoSong(): Song {
  const melody =
    "E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 E4:1.5 D4:.5 D4:2 " +
    "E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 D4:1.5 C4:.5 C4:2 " +
    "D4:1 D4:1 E4:1 C4:1 D4:1 E4:.5 F4:.5 E4:1 C4:1 D4:1 E4:.5 F4:.5 E4:1 D4:1 C4:1 D4:1 G3:2 " +
    "E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 D4:1.5 C4:.5 C4:2";
  const notes: SongNote[] = [];
  let t = 0;
  for (const tok of melody.split(" ")) {
    const [n, d] = tok.split(":");
    const dur = Number(d);
    notes.push({ midi: noteNumber(n), start: t, dur: dur * 0.95, hand: "R" });
    t += dur;
  }
  const C = [48, 55];
  const G = [43, 50];
  const bars: number[][][] = [
    [C, C], [G, G], [C, C], [G, G],
    [C, C], [G, G], [C, C], [G, C],
    [G, C], [G, C], [G, G], [C, G],
    [C, C], [G, G], [C, C], [G, C],
  ];
  bars.forEach((halves, bar) =>
    halves.forEach((chord, h) =>
      chord.forEach((midi) =>
        notes.push({ midi, start: bar * 4 + h * 2, dur: 1.9, hand: "L" }),
      ),
    ),
  );
  return finalize({
    title: "Ode to Joy",
    composer: "L. v. Beethoven",
    bpm: 96,
    beatsPerBar: 4,
    notes,
  });
}

export const DEMO_SONG = demoSong();

export async function parseMidiFile(file: File): Promise<Song> {
  const midi = new Midi(await file.arrayBuffer());
  const ppq = midi.header.ppq;
  const notes: SongNote[] = [];
  for (const track of midi.tracks) {
    if (track.instrument.percussion) continue;
    for (const n of track.notes) {
      notes.push({
        midi: n.midi,
        start: n.ticks / ppq,
        dur: Math.max(0.1, n.durationTicks / ppq),
        hand: n.midi < 60 ? "L" : "R",
      });
    }
  }
  if (!notes.length) throw new Error("No notes found in that MIDI file");
  const bpm = Math.round(midi.header.tempos[0]?.bpm ?? 100);
  const ts = midi.header.timeSignatures[0]?.timeSignature ?? [4, 4];
  return finalize({
    title: midi.name || file.name.replace(/\.midi?$/i, ""),
    composer: "Imported MIDI",
    bpm,
    beatsPerBar: ts[0] * (4 / ts[1]),
    notes,
  });
}
