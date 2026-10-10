import { engine, HIT, MISSED, useEngine } from "./engine";
import { emitNote } from "./midi";
import type { Hand } from "./song";

const BLACK = new Set([1, 3, 6, 8, 10]);
const isBlack = (m: number) => BLACK.has(m % 12);

const COLORS: Record<Hand, { hue: number; sat: number }> = {
  R: { hue: 190, sat: 95 },
  L: { hue: 320, sat: 90 },
};
const VISIBLE_BEATS = 7;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  hue: number;
  size: number;
}

interface KeyGeom {
  x: number;
  w: number;
  black: boolean;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private raf = 0;
  private keys = new Map<number, KeyGeom>();
  private lo = 48;
  private hi = 84;
  private keyH = 0;
  private particles: Particle[] = [];
  private pointerNote: number | null = null;
  private ro: ResizeObserver;
  private unsub: () => void;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
    this.fitRange();
    this.unsub = useEngine.subscribe((s, p) => {
      if (s.song !== p.song) this.fitRange();
    });
    canvas.addEventListener("pointerdown", this.down);
    window.addEventListener("pointerup", this.up);
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.unsub();
    this.canvas.removeEventListener("pointerdown", this.down);
    window.removeEventListener("pointerup", this.up);
  }

  private fitRange() {
    const { notes } = useEngine.getState().song;
    let min = 127;
    let max = 0;
    for (const n of notes) {
      min = Math.min(min, n.midi);
      max = Math.max(max, n.midi);
    }
    let lo = min - (min % 12);
    let hi = max + (12 - (max % 12)) - 1;
    while (hi - lo < 47) {
      if (lo > 21) lo -= 12;
      if (hi - lo < 47 && hi < 108) hi += 12;
      if (lo <= 21 && hi >= 108) break;
    }
    this.lo = Math.max(21, lo);
    this.hi = Math.min(108, hi);
    this.layout();
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    this.layout();
  }

  private layout() {
    this.keys.clear();
    let whites = 0;
    for (let m = this.lo; m <= this.hi; m++) if (!isBlack(m)) whites++;
    const ww = this.w / whites;
    this.keyH = Math.max(90, Math.min(190, this.h * 0.2));
    this.canvas.parentElement?.style.setProperty("--keyh", `${this.keyH}px`);
    let wi = 0;
    for (let m = this.lo; m <= this.hi; m++) {
      if (isBlack(m)) {
        const bw = ww * 0.62;
        this.keys.set(m, { x: wi * ww - bw / 2, w: bw, black: true });
      } else {
        this.keys.set(m, { x: wi * ww, w: ww, black: false });
        wi++;
      }
    }
  }

  private pitchAt(x: number, y: number): number | null {
    const top = this.h - this.keyH;
    if (y < top) return null;
    let found: number | null = null;
    for (const [m, k] of this.keys) {
      if (x < k.x || x > k.x + k.w) continue;
      if (k.black) {
        if (y <= top + this.keyH * 0.62) return m;
      } else found = m;
    }
    return found;
  }

  private down = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect();
    const m = this.pitchAt(e.clientX - r.left, e.clientY - r.top);
    if (m === null) return;
    this.pointerNote = m;
    emitNote(m, 0.75, e.timeStamp, true);
  };

  private up = (e: PointerEvent) => {
    if (this.pointerNote === null) return;
    emitNote(this.pointerNote, 0, e.timeStamp, false);
    this.pointerNote = null;
  };

  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame);
    engine.tick(now);
    this.draw(now);
  };

  private draw(now: number) {
    const { ctx, w, h } = this;
    const s = useEngine.getState();
    const { notes, beatsPerBar } = s.song;
    const pos = engine.pos;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const top = h - this.keyH;
    const ppb = top / VISIBLE_BEATS;

    const bg = ctx.createLinearGradient(0, 0, 0, top);
    bg.addColorStop(0, "#07070f");
    bg.addColorStop(1, "#10102a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.lineWidth = 1;
    for (const [m, k] of this.keys) {
      if (k.black || m % 12 !== 5 && m % 12 !== 0) continue;
      ctx.fillStyle = "rgba(255,255,255,0.035)";
      ctx.fillRect(Math.round(k.x), 0, 1, top);
    }
    const firstBeat = Math.ceil(pos);
    for (let b = firstBeat; b < pos + VISIBLE_BEATS + 1; b++) {
      const y = Math.round(top - (b - pos) * ppb);
      const bar = b % beatsPerBar === 0;
      ctx.fillStyle = bar ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.035)";
      ctx.fillRect(0, y, w, 1);
    }

    if (s.loop) {
      const ya = top - (s.loop.a - pos) * ppb;
      const yb = top - (s.loop.b - pos) * ppb;
      ctx.fillStyle = "rgba(250,204,21,0.07)";
      ctx.fillRect(0, yb, w, ya - yb);
      ctx.fillStyle = "rgba(250,204,21,0.6)";
      ctx.fillRect(0, ya - 1, w, 2);
      ctx.fillRect(0, yb - 1, w, 2);
    }

    const sounding = new Map<number, Hand>();
    ctx.globalCompositeOperation = "source-over";
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.start > pos + VISIBLE_BEATS) break;
      if (n.start + n.dur < pos) continue;
      const k = this.keys.get(n.midi);
      if (!k) continue;
      const st = engine.status[i];
      const required = engine.isRequired(i);
      const yb = top - (n.start - pos) * ppb;
      const yt = Math.min(yb - n.dur * ppb, top);
      const bottom = Math.min(yb, top);
      const hgt = bottom - yt;
      if (hgt < 1) continue;
      if (n.start <= pos) sounding.set(n.midi, n.hand);

      const c = COLORS[n.hand];
      const inset = k.black ? 1 : 2;
      const x = k.x + inset;
      const bw = k.w - inset * 2;
      const ghost = !required;
      let l1 = 62;
      let l2 = 48;
      let a = ghost ? 0.38 : 1;
      let sat = c.sat;
      if (st === MISSED) {
        sat = 8;
        a = 0.3;
      }
      if (st === HIT) {
        l1 = 78;
        l2 = 62;
      }
      const g = ctx.createLinearGradient(0, yt, 0, bottom);
      g.addColorStop(0, `hsla(${c.hue},${sat}%,${l1}%,${a})`);
      g.addColorStop(1, `hsla(${c.hue + 18},${sat}%,${l2}%,${a})`);
      if (st === HIT && n.start <= pos) {
        ctx.fillStyle = `hsla(${c.hue},100%,70%,0.22)`;
        ctx.fillRect(x - 4, yt, bw + 8, hgt);
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x, yt, bw, hgt, Math.min(6, bw / 3, hgt / 2));
      ctx.fill();
      if (!ghost && st !== MISSED && hgt > 6) {
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(x + 2, yt + 1, bw - 4, 1.5);
      }
    }

    const grad = ctx.createLinearGradient(0, top - 36, 0, top);
    grad.addColorStop(0, "rgba(120,140,255,0)");
    grad.addColorStop(1, "rgba(120,140,255,0.22)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, top - 36, w, 36);

    this.spawnParticles(top);
    this.drawParticles(top);
    this.drawKeyboard(top, sounding, now);
    this.drawEchoCue(top, s.mode, s.finished, s.loop?.a ?? 0);
    this.drawJudgement(top, now);
    if (pos < 0) this.drawCountIn(top);
  }

  private spawnParticles(top: number) {
    for (const f of engine.fx) {
      const k = this.keys.get(f.midi);
      if (!k) continue;
      const hue = COLORS[f.hand].hue;
      const count = f.perfect ? 12 : 7;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: k.x + k.w / 2 + (Math.random() - 0.5) * k.w * 0.6,
          y: top,
          vx: (Math.random() - 0.5) * 180,
          vy: -60 - Math.random() * 260,
          life: 1,
          hue,
          size: 1.5 + Math.random() * 2.5,
        });
      }
    }
    engine.fx.length = 0;
    if (this.particles.length > 600) this.particles.splice(0, this.particles.length - 600);
  }

  private drawParticles(top: number) {
    const ctx = this.ctx;
    const dt = 1 / 60;
    ctx.globalCompositeOperation = "lighter";
    let j = 0;
    for (const p of this.particles) {
      p.life -= dt * 1.8;
      if (p.life <= 0) continue;
      p.vy += 520 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y > top) p.y = top;
      ctx.fillStyle = `hsla(${p.hue},100%,68%,${p.life * 0.9})`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      this.particles[j++] = p;
    }
    this.particles.length = j;
    ctx.globalCompositeOperation = "source-over";
  }

  private drawKeyboard(top: number, sounding: Map<number, Hand>, now: number) {
    const { ctx, keyH } = this;
    ctx.fillStyle = "#0b0b18";
    ctx.fillRect(0, top, this.w, keyH);

    const paint = (m: number, k: KeyGeom) => {
      const hand = sounding.get(m);
      const held = engine.held.has(m);
      const wrongUntil = engine.wrong.get(m);
      const isWrong = wrongUntil !== undefined && wrongUntil > now;
      if (wrongUntil !== undefined && !isWrong) engine.wrong.delete(m);
      const kh = k.black ? keyH * 0.62 : keyH - 2;
      let top0: string;
      let bot: string;
      if (isWrong) {
        top0 = "#ff5d6c";
        bot = "#c2263a";
      } else if (held) {
        top0 = k.black ? "#8aa0ff" : "#c9d4ff";
        bot = k.black ? "#4559d6" : "#8ea2ff";
      } else if (hand) {
        const c = COLORS[hand];
        top0 = `hsl(${c.hue},${c.sat}%,${k.black ? 45 : 72}%)`;
        bot = `hsl(${c.hue + 18},${c.sat}%,${k.black ? 32 : 58}%)`;
      } else {
        top0 = k.black ? "#2a2a3d" : "#f4f5fb";
        bot = k.black ? "#0d0d16" : "#d5d8e6";
      }
      const g = ctx.createLinearGradient(0, top, 0, top + kh);
      g.addColorStop(0, top0);
      g.addColorStop(1, bot);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(k.x + (k.black ? 0 : 1), top + 2, k.w - (k.black ? 0 : 2), kh - 2, [0, 0, 5, 5]);
      ctx.fill();
      if (!k.black && m % 12 === 0) {
        ctx.fillStyle = "rgba(20,20,40,0.45)";
        ctx.font = "600 10px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`C${Math.floor(m / 12) - 1}`, k.x + k.w / 2, top + keyH - 10);
      }
    };
    for (const [m, k] of this.keys) if (!k.black) paint(m, k);
    for (const [m, k] of this.keys) if (k.black) paint(m, k);

    const line = ctx.createLinearGradient(0, 0, this.w, 0);
    line.addColorStop(0, "#22d3ee");
    line.addColorStop(0.5, "#818cf8");
    line.addColorStop(1, "#f472b6");
    ctx.fillStyle = line;
    ctx.fillRect(0, top, this.w, 2.5);
  }

  private drawEchoCue(top: number, mode: string, finished: boolean, origin: number) {
    if (mode !== "echo" || finished || engine.pos < origin) return;
    const ctx = this.ctx;
    const reply = engine.echoPhase === "reply";
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = reply ? "#fde68a" : "#a5f3fc";
    ctx.font = "700 16px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(reply ? "Your turn" : "Listen", this.w / 2, top - 56);
    ctx.globalAlpha = 1;
  }

  private drawJudgement(top: number, now: number) {
    const j = engine.judgement;
    if (!j) return;
    const age = (now - j.at) / 700;
    if (age >= 1) return;
    const ctx = this.ctx;
    ctx.globalAlpha = 1 - age;
    ctx.fillStyle = j.good ? "#a5f3fc" : "#fda4af";
    ctx.font = "700 22px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(j.text, this.w / 2, top - 28 - age * 22);
    ctx.globalAlpha = 1;
  }

  private drawCountIn(top: number) {
    const ctx = this.ctx;
    const n = Math.ceil(-engine.pos);
    const frac = -engine.pos - Math.floor(-engine.pos);
    ctx.globalAlpha = 0.25 + 0.75 * (1 - frac);
    ctx.fillStyle = "#fff";
    ctx.font = "800 120px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(n), this.w / 2, top / 2 + 40);
    ctx.globalAlpha = 1;
  }
}
