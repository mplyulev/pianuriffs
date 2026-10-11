# pianoriffs

Browser-based piano practice with a MIDI keyboard: falling notes, wait / play-along modes, and note judging. Fully client-side and static (no backend, no accounts).

## Run

```bash
npm install
npm run dev      # http://127.0.0.1:3000
npm run build    # static output in dist/
```

Use Chrome, Edge or Opera for Web MIDI. Without a MIDI keyboard you can play with the computer keyboard
(`A S D F G H J K L ;` white keys, `W E T Y U O P` black keys, `Z`/`X` shift octave) or click the on-screen keys.

## Support

Buy Me a Coffee is set in `src/lib/sponsors.ts`. Change `COFFEE_URL` to your page.

## Features

- Web MIDI input with hot-plug. Every instrument in the Sounds menu is a recording included with the app (piano, basses, strings, and sampled synths)
- 60fps canvas falling-notes view and 88-key-aware keyboard
- Modes: Play along (timing window judging), Wait (pauses until you play the chord), Call & response (plays two bars, then waits for you to play them back; Space or Enter starts the next part)
- Hand selection (a hand that is off is dimmed and silent), tempo, metronome, count-in, A/B bar loop
- Demo song (Ode to Joy) and Standard MIDI file import

## Sounds

Every sound in the menu is a redistributable recording. Grand Piano is Salamander Grand Piano by Alexander Holm (CC BY 3.0). Finger Bass and Picked Bass are Andrea Biasior's Yamaha RBX recordings (CC0). Strings are VSCO 2 Community Edition by Versilian Studios (CC0). FM Piano, Synth Strings, Synth Pad, and Synth Brass are FreePats recordings by Roberto (roberto@zenvoid.org) (CC0). See `public/samples/CREDITS.txt`. Rebuild them with `npm run fetch-samples`.

## Layout

- `src/lib/song.ts` – internal song model, demo song, MIDI parsing
- `src/lib/engine.ts` – clock, modes, judging (kept outside React)
- `src/lib/renderer.ts` – canvas renderer
- `src/lib/midi.ts`, `src/lib/audio.ts`, `src/lib/sampleBank.ts` – input and sampled instruments
- `public/samples/` – recordings shipped with the app (`CREDITS.txt`)
