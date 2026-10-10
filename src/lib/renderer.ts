import { engine, HIT, MISSED, useEngine } from "./engine";
import { emitNote } from "./midi";
import { useLook } from "./look";
import type { Hand } from "./song";

const BLACK = new Set([1, 3, 6, 8, 10]);

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}
const isBlack = (m: number) => BLACK.has(m % 12);

const VISIBLE_BEATS = 7;

interface Burn {
  hand: Hand;
  midi: number;
  index: number;
  x: number;
  bw: number;
  yt: number;
  bottom: number;
  perfect: boolean;
  along: number;
  ash: number;
}

interface MissDrop {
  x: number;
  w: number;
  y0: number;
  y1: number;
  hue: number;
  a: number;
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
  private perfect = new Map<number, boolean>();
  private burns: Burn[] = [];
  private burningKeys = new Map<number, number>();
  private drops: MissDrop[] = [];
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
      if (s.song !== p.song) {
        this.fitRange();
        this.perfect.clear();
        this.burns = [];
        this.burningKeys.clear();
      }
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

    const look = useLook.getState();
    const theme = look.notes;
    const stage = look.stage;
    const bg = ctx.createLinearGradient(0, 0, 0, top);
    bg.addColorStop(0, stage.bg0);
    bg.addColorStop(1, stage.bg1);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.lineWidth = 1;
    for (const [m, k] of this.keys) {
      if (k.black || m % 12 !== 5 && m % 12 !== 0) continue;
      ctx.fillStyle = stage.grid;
      ctx.fillRect(Math.round(k.x), 0, 1, top);
    }
    const firstBeat = Math.ceil(pos);
    for (let b = firstBeat; b < pos + VISIBLE_BEATS + 1; b++) {
      const y = Math.round(top - (b - pos) * ppb);
      const bar = b % beatsPerBar === 0;
      ctx.fillStyle = bar ? stage.bar : stage.grid;
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

    this.collectPerfect();
    this.burns = [];
    this.burningKeys.clear();
    this.drops.length = 0;

    const sounding = new Map<number, Hand>();
    const ashWindow = 0.28;
    ctx.globalCompositeOperation = "source-over";
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.start > pos + VISIBLE_BEATS) break;
      const end = n.start + n.dur;
      const past = pos - end;
      if (past > ashWindow) continue;
      const k = this.keys.get(n.midi);
      if (!k) continue;
      const st = engine.status[i];
      if (n.start <= pos && past <= 0) sounding.set(n.midi, n.hand);
      const c = theme.hands[n.hand];
      const inset = k.black ? 1 : 2;
      const x = k.x + inset;
      const bw = k.w - inset * 2;
      const yb = top - (n.start - pos) * ppb;
      const yt = Math.min(yb - n.dur * ppb, top);
      const bottom = Math.min(yb, top);
      if (st === MISSED && yb > top) {
        const span = this.keyH * 0.72;
        const travel = (yb - top) / span;
        const y0 = Math.max(top, yt);
        const y1 = Math.min(yb, top + span);
        if (travel < 1 && y1 - y0 > 1) this.drops.push({ x, w: bw, y0, y1, hue: c.hue, a: 0.34 * (1 - travel) });
      }
      const holding = st === HIT && n.start <= pos && past <= ashWindow;
      const perfect = this.perfect.get(i) ?? false;
      if (holding) {
        const along = n.dur <= 1e-4 ? 1 : Math.min(1, Math.max(0, (pos - n.start) / n.dur));
        const ash = past > 0 ? Math.min(1, past / ashWindow) : 0;
        this.burns.push({ hand: n.hand, midi: n.midi, index: i, x, bw, yt, bottom: top, perfect, along, ash });
        const strength = ash > 0 ? (1 - ash) * 0.85 : 1;
        if (strength > (this.burningKeys.get(n.midi) ?? 0)) this.burningKeys.set(n.midi, strength);
      }
      if (past > 0) continue;
      const hgt = bottom - yt;
      if (hgt < 1) continue;
      const ghost = !engine.isRequired(i);
      let l1 = c.l1;
      let l2 = c.l2;
      let a = ghost ? 0.38 : 1;
      let sat = c.sat;
      if (st === MISSED) {
        sat = 8;
        a = 0.3;
      }
      if (st === HIT) {
        l1 = c.hitL1;
        l2 = c.hitL2;
      }
      if (stage.light && l1 > 68) {
        l1 = Math.min(l1, 56);
        l2 = Math.min(l2, 42);
        sat = Math.max(sat, 46);
      }
      const radius = Math.min(6, bw / 3, hgt / 2);
      if (stage.light && st !== MISSED) {
        ctx.fillStyle = "rgba(40,28,18,0.14)";
        ctx.beginPath();
        ctx.roundRect(x + 1, yt + 2, bw, hgt, radius);
        ctx.fill();
      }
      const g = ctx.createLinearGradient(0, yt, 0, bottom);
      if (holding) {
        const eat = Math.min(0.82, 0.26 + (n.dur <= 1e-4 ? 1 : Math.min(1, Math.max(0, (pos - n.start) / n.dur))) * 0.5);
        g.addColorStop(0, `hsla(${c.hue},${sat}%,${l1}%,${a})`);
        g.addColorStop(Math.max(0, 1 - eat), `hsla(${c.hue},${sat}%,${l2}%,${a})`);
        g.addColorStop(1, `hsla(42,${perfect ? 100 : 90}%,${perfect ? 74 : 62}%,${a})`);
      } else {
        g.addColorStop(0, `hsla(${c.hue},${sat}%,${l1}%,${a})`);
        g.addColorStop(1, `hsla(${c.hue + 18},${sat}%,${l2}%,${a})`);
      }
      if (st === HIT && n.start > pos) {
        ctx.fillStyle = `hsla(${c.hue},100%,70%,0.22)`;
        ctx.fillRect(x - 4, yt, bw + 8, hgt);
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x, yt, bw, hgt, radius);
      ctx.fill();
      if (!ghost && st !== MISSED && hgt > 6) {
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(x + 2, yt + 1, bw - 4, 1.5);
      }
    }

    const grad = ctx.createLinearGradient(0, top - 36, 0, top);
    grad.addColorStop(0, stage.wash0);
    grad.addColorStop(1, stage.wash1);
    ctx.fillStyle = grad;
    ctx.fillRect(0, top - 36, w, 36);

    this.drawKeyboard(top, sounding, now);
    this.drawBurns(top, now, stage.light);
    this.drawMissDrops();
    this.drawHitLine(top);
    this.drawEchoCue(top, s.mode, s.finished, s.loop?.a ?? 0);
    this.drawJudgement(top, now);
    if (pos < 0) this.drawCountIn(top);
  }

  private collectPerfect() {
    for (const f of engine.fx) this.perfect.set(f.index, f.perfect);
    engine.fx.length = 0;
    if (this.perfect.size === 0) return;
    const notes = useEngine.getState().song.notes;
    const pos = engine.pos;
    for (const index of this.perfect.keys()) {
      const n = notes[index];
      if (!n || engine.status[index] !== HIT || n.start + n.dur + 0.4 < pos) this.perfect.delete(index);
    }
  }

  private drawBurns(top: number, now: number, light: boolean) {
    const ctx = this.ctx;
    const theme = useLook.getState().notes;
    for (const b of this.burns) {
      const c = theme.hands[b.hand];
      const fade = b.ash > 0 ? 1 - b.ash : 1;
      const ignite = b.ash > 0 ? 1 : Math.min(1, b.along / 0.05);
      const amp = (b.perfect ? 1 : 0.78) * fade * Math.max(ignite, 0.62);
      const hgt = Math.max(0, b.bottom - b.yt);
      const flicker = 0.86 + 0.14 * Math.sin(now * 0.02 + b.midi);
      const cx = b.x + b.bw / 2;

      ctx.globalCompositeOperation = "source-over";
      if (hgt > 2 && b.ash === 0) {
        const eat = Math.min(hgt, Math.max(22, hgt * (0.55 + b.along * 0.4)));
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(b.x, b.yt, b.bw, hgt, Math.min(6, b.bw / 3, hgt / 2));
        ctx.clip();
        const band = ctx.createLinearGradient(0, b.bottom - eat, 0, b.bottom);
        band.addColorStop(0, `hsla(${c.hue},90%,58%,0)`);
        band.addColorStop(0.28, `hsla(14,100%,48%,${0.45 * amp})`);
        band.addColorStop(0.62, `hsla(32,100%,56%,${0.92 * amp})`);
        band.addColorStop(1, `hsla(50,100%,86%,${amp})`);
        ctx.fillStyle = band;
        ctx.fillRect(b.x, b.bottom - eat, b.bw, eat);

        const tongues = b.perfect ? 4 : 3;
        for (let i = 0; i < tongues; i++) {
          const phase = now * 0.011 + i * 1.9 + b.index * 0.4;
          const sway = Math.sin(phase) * b.bw * 0.1;
          const th = Math.min(eat * (0.78 + 0.28 * Math.sin(phase * 1.3)) * flicker, hgt);
          const hw = Math.max(3, b.bw * (b.perfect ? 0.16 : 0.2));
          const tx = b.x + (b.bw * (i + 0.5)) / tongues + sway;
          this.flame(tx, b.bottom, hw, Math.max(12, th), amp, Math.sin(phase * 0.7) * hw * 0.45);
        }
        ctx.restore();
        ctx.fillStyle = `rgba(255,250,235,${0.85 * amp})`;
        ctx.fillRect(b.x + b.bw * 0.16, b.bottom - 3.5, b.bw * 0.68, 2.5);
      }

      const sparks = b.perfect ? 11 : 7;
      const riseMax = Math.max(22, Math.min(hgt > 2 ? hgt * 0.98 : 36, 170));
      for (let i = 0; i < sparks; i++) {
        const cycle = (b.perfect ? 540 : 760) + i * 60;
        const t = ((now + i * 137 + b.index * 53 + b.midi * 17) % cycle) / cycle;
        const spread = hash(b.index * 13 + i * 7 + b.midi);
        const ex = b.x + b.bw * (0.08 + 0.84 * spread) + Math.sin(now * 0.005 + i) * 1.6;
        const ey = b.bottom - t * riseMax * (b.ash > 0 ? 0.5 : 1);
        const a = Math.sin(t * Math.PI) * amp;
        if (a < 0.04) continue;
        const hot = i % 3 !== 2;
        const rad = (hot ? 2.4 : 3.1) * (1.15 - t * 0.4);
        ctx.fillStyle = hot ? `rgba(255,236,170,${a})` : `rgba(255,120,40,${a * 0.9})`;
        ctx.beginPath();
        ctx.arc(ex, ey, rad, 0, Math.PI * 2);
        ctx.fill();
        if (hot && a > 0.25) {
          ctx.fillStyle = `rgba(255,255,255,${a * 0.85})`;
          ctx.beginPath();
          ctx.arc(ex, ey, rad * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const rad = (this.keys.get(b.midi)?.w ?? b.bw) * (b.perfect ? 1.05 : 1.25);
      const bloom = amp * (b.perfect ? 0.85 : 0.5);
      ctx.globalCompositeOperation = light ? "source-over" : "lighter";
      const g = ctx.createRadialGradient(cx, top + 6, 1, cx, top + 18, rad);
      g.addColorStop(0, `hsla(50,100%,88%,${light ? bloom * 0.55 : bloom})`);
      g.addColorStop(0.4, `hsla(28,100%,58%,${bloom * 0.45})`);
      g.addColorStop(1, `hsla(12,100%,46%,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(cx - rad, top, rad * 2, this.keyH * 0.72);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  private flame(cx: number, base: number, hw: number, h: number, amp: number, lean: number) {
    const ctx = this.ctx;
    const tip = base - h;
    ctx.beginPath();
    ctx.moveTo(cx - hw, base);
    ctx.quadraticCurveTo(cx - hw * 0.15, base - h * 0.45, cx + lean, tip);
    ctx.quadraticCurveTo(cx + hw * 0.2, base - h * 0.4, cx + hw, base);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, tip, 0, base);
    g.addColorStop(0, `rgba(255,244,210,0)`);
    g.addColorStop(0.25, `rgba(255,186,48,${0.35 * amp})`);
    g.addColorStop(0.7, `rgba(255,92,18,${0.75 * amp})`);
    g.addColorStop(1, `rgba(255,236,180,${0.95 * amp})`);
    ctx.fillStyle = g;
    ctx.fill();
  }

  private drawMissDrops() {
    const ctx = this.ctx;
    for (const d of this.drops) {
      ctx.fillStyle = `hsla(${d.hue},8%,58%,${d.a})`;
      ctx.beginPath();
      ctx.roundRect(d.x, d.y0, d.w, d.y1 - d.y0, Math.min(6, d.w / 3, (d.y1 - d.y0) / 2));
      ctx.fill();
    }
  }

  private drawHitLine(top: number) {
    const { ctx } = this;
    const [a, b, c] = useLook.getState().notes.line;
    const line = ctx.createLinearGradient(0, 0, this.w, 0);
    line.addColorStop(0, a);
    line.addColorStop(0.5, b);
    line.addColorStop(1, c);
    ctx.fillStyle = line;
    ctx.fillRect(0, top, this.w, 2.5);
  }

  private drawKeyboard(top: number, sounding: Map<number, Hand>, now: number) {
    const { ctx, keyH } = this;
    const stage = useLook.getState().stage;
    ctx.fillStyle = stage.keyBed;
    ctx.fillRect(0, top, this.w, keyH);

    const paint = (m: number, k: KeyGeom) => {
      const hand = sounding.get(m);
      const held = engine.held.has(m);
      const burn = this.burningKeys.get(m) ?? 0;
      const wrongUntil = engine.wrong.get(m);
      const isWrong = wrongUntil !== undefined && wrongUntil > now;
      if (wrongUntil !== undefined && !isWrong) engine.wrong.delete(m);
      const kh = k.black ? keyH * 0.62 : keyH - 2;
      let top0: string;
      let bot: string;
      if (isWrong) {
        top0 = "#ff5d6c";
        bot = "#c2263a";
      } else if (burn > 0.2) {
        top0 = `hsl(48,100%,${k.black ? 34 + burn * 28 : 82 + burn * 12}%)`;
        bot = `hsl(16,100%,${k.black ? 18 + burn * 14 : 46 + burn * 8}%)`;
      } else if (held) {
        top0 = k.black ? stage.heldBlackTop : stage.heldWhiteTop;
        bot = k.black ? stage.heldBlackBot : stage.heldWhiteBot;
      } else if (hand) {
        const c = useLook.getState().notes.hands[hand];
        top0 = `hsl(${c.hue},${c.sat}%,${k.black ? 45 : 72}%)`;
        bot = `hsl(${c.hue + 18},${c.sat}%,${k.black ? 32 : 58}%)`;
      } else {
        top0 = k.black ? stage.blackTop : stage.whiteTop;
        bot = k.black ? stage.blackBot : stage.whiteBot;
      }
      const g = ctx.createLinearGradient(0, top, 0, top + kh);
      g.addColorStop(0, top0);
      g.addColorStop(1, bot);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(k.x + (k.black ? 0 : 1), top + 2, k.w - (k.black ? 0 : 2), kh - 2, [0, 0, 5, 5]);
      ctx.fill();
      if (!k.black && m % 12 === 0) {
        ctx.fillStyle = stage.cLabel;
        ctx.font = "600 10px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`C${Math.floor(m / 12) - 1}`, k.x + k.w / 2, top + keyH - 10);
      }
    };
    for (const [m, k] of this.keys) if (!k.black) paint(m, k);
    for (const [m, k] of this.keys) if (k.black) paint(m, k);
  }

  private drawEchoCue(top: number, mode: string, finished: boolean, origin: number) {
    if (mode !== "echo" || finished || engine.pos < origin) return;
    const ctx = this.ctx;
    const reply = engine.echoPhase === "reply";
    const light = useLook.getState().stage.light;
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = light ? (reply ? "#92400e" : "#0f766e") : reply ? "#fde68a" : "#a5f3fc";
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
    const light = useLook.getState().stage.light;
    ctx.globalAlpha = 1 - age;
    ctx.fillStyle = light ? (j.good ? "#0f766e" : "#be123c") : j.good ? "#a5f3fc" : "#fda4af";
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
    ctx.fillStyle = useLook.getState().stage.light ? "#3f2a1d" : "#fff";
    ctx.font = "800 120px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(n), this.w / 2, top / 2 + 40);
    ctx.globalAlpha = 1;
  }
}
