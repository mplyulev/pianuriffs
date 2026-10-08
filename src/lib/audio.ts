const A4 = 440;

class PianoSynth {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private voices = new Map<number, { gain: GainNode; stop: () => void }>();

  private ensure(): AudioContext {
    if (!this.ctx) {
      const ctx = new AudioContext({ latencyHint: "interactive" });
      const comp = ctx.createDynamicsCompressor();
      this.master = ctx.createGain();
      this.master.gain.value = 0.7;
      this.master.connect(comp).connect(ctx.destination);
      this.ctx = ctx;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  unlock() {
    this.ensure();
  }

  noteOn(midi: number, velocity = 0.8, sustainSec?: number) {
    const ctx = this.ensure();
    this.noteOff(midi, true);
    const now = ctx.currentTime;
    const freq = A4 * 2 ** ((midi - 69) / 12);
    const gain = ctx.createGain();
    const peak = 0.28 * velocity * (1.15 - midi / 140);
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.setValueAtTime(Math.min(9000, freq * 7), now);
    tone.frequency.exponentialRampToValueAtTime(Math.max(600, freq * 2), now + 1.2);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(peak * 0.35, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 4.5);
    tone.connect(gain).connect(this.master);

    const oscs: OscillatorNode[] = [];
    const partials: [number, number, OscillatorType][] = [
      [1, 1, "triangle"],
      [2, 0.45, "sine"],
      [3, 0.18, "sine"],
      [4, 0.08, "sine"],
    ];
    for (const [mult, amp, type] of partials) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq * mult * (1 + (Math.random() - 0.5) * 0.0006);
      g.gain.value = amp;
      o.connect(g).connect(tone);
      o.start(now);
      oscs.push(o);
    }
    const stop = () => oscs.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } });
    this.voices.set(midi, { gain, stop });
    if (sustainSec !== undefined) {
      setTimeout(() => this.noteOff(midi), sustainSec * 1000);
    }
  }

  noteOff(midi: number, immediate = false) {
    const v = this.voices.get(midi);
    if (!v || !this.ctx) return;
    this.voices.delete(midi);
    const now = this.ctx.currentTime;
    const rel = immediate ? 0.02 : 0.18;
    v.gain.gain.cancelScheduledValues(now);
    v.gain.gain.setValueAtTime(Math.max(v.gain.gain.value, 0.0009), now);
    v.gain.gain.exponentialRampToValueAtTime(0.0008, now + rel);
    setTimeout(v.stop, rel * 1000 + 50);
  }

  allOff() {
    [...this.voices.keys()].forEach((m) => this.noteOff(m));
  }

  click(accent: boolean) {
    const ctx = this.ensure();
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = accent ? 1568 : 1046;
    g.gain.setValueAtTime(0.25, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    o.connect(g).connect(this.master);
    o.start(now);
    o.stop(now + 0.08);
  }
}

export const synth = new PianoSynth();
