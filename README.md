# Keystream

Browser-based piano practice with a MIDI keyboard: falling notes, wait / play-along modes, and note judging. Fully client-side and static (no backend, no accounts).

## Run

```bash
npm install
npm run dev      # http://127.0.0.1:3000
npm run build    # static output in dist/
```

Use Chrome, Edge or Opera for Web MIDI. Without a MIDI keyboard you can play with the computer keyboard
(`A S D F G H J K L ;` white keys, `W E T Y U O P` black keys, `Z`/`X` shift octave) or click the on-screen keys.

## Features

- Web MIDI input with hot-plug, built-in WebAudio piano synth (no samples to download)
- 60fps canvas falling-notes view and 88-key-aware keyboard
- Modes: Listen, Wait (pauses until you play the chord), Play along (timing window judging)
- Hand selection (the other hand plays as accompaniment), tempo, metronome, count-in, A/B bar loop
- Demo song (Ode to Joy) and Standard MIDI file import

## Layout

- `src/lib/song.ts` – internal song model, demo song, MIDI parsing
- `src/lib/engine.ts` – clock, modes, judging (kept outside React)
- `src/lib/renderer.ts` – canvas renderer
- `src/lib/midi.ts`, `src/lib/audio.ts` – input and sound
