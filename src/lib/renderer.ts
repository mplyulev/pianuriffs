import { engine, HIT, HIT_WINDOW_SEC, MISSED, useEngine } from "./engine";
import { emitNote } from "./midi";
import { useLook, type HitStyleId } from "./look";
import type { Hand } from "./song";

const BLACK = new Set([1, 3, 6, 8, 10]);

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function hitHue(style: HitStyleId) {
  if (style === "pulse") return 168;
  if (style === "data") return 268;
  if (style === "beam") return 196;
  if (style === "phase") return 312;
  return 188;
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

interface MissAnim {
  x: number;
  bw: number;
  yt: number;
  yb: number;
  hue: number;
  t: number;
  index: number;
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
  private misses: MissAnim[] = [];
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
        this.misses = [];
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
    this.misses = [];

    const sounding = new Map<number, Hand>();
    const ashWindow = 0.28;
    ctx.globalCompositeOperation = "source-over";
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.start > pos + VISIBLE_BEATS) break;
      const end = n.start + n.dur;
      const past = pos - end;
      const st = engine.status[i];
      if (past > (st === MISSED ? 0.85 : ashWindow)) continue;
      const k = this.keys.get(n.midi);
      if (!k) continue;
      if (n.start <= pos && past <= 0 && st !== MISSED) sounding.set(n.midi, n.hand);
      const c = theme.hands[n.hand];
      const inset = k.black ? 1 : 2;
      const x = k.x + inset;
      const bw = k.w - inset * 2;
      const yb = top - (n.start - pos) * ppb;
      const yt = Math.min(yb - n.dur * ppb, top);
      const bottom = Math.min(yb, top);
      const holding = st === HIT && n.start <= pos && past <= ashWindow;
      const perfect = this.perfect.get(i) ?? false;
      if (holding) {
        const along = n.dur <= 1e-4 ? 1 : Math.min(1, Math.max(0, (pos - n.start) / n.dur));
        const ash = past > 0 ? Math.min(1, past / ashWindow) : 0;
        this.burns.push({ hand: n.hand, midi: n.midi, index: i, x, bw, yt, bottom: top, perfect, along, ash });
        const strength = ash > 0 ? (1 - ash) * 0.85 : 1;
        if (strength > (this.burningKeys.get(n.midi) ?? 0)) this.burningKeys.set(n.midi, strength);
      }
      if (st === MISSED && yb > top - 4) {
        const since = Math.max(0, pos - n.start);
        const fadeT = Math.min(1, since / Math.max(n.dur, 0.45));
        this.misses.push({ x, bw, yt, yb, hue: c.hue, t: fadeT, index: i });
        continue;
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
      g.addColorStop(0, `hsla(${c.hue},${sat}%,${l1}%,${a})`);
      g.addColorStop(1, `hsla(${c.hue + 18},${sat}%,${l2}%,${a})`);
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
    this.drawHitFx(top, now, stage.light);
    this.drawMissFx(top, now);
    this.drawHitLine(top);
    this.drawEchoCue(top, s.mode, s.finished, s.loop?.a ?? 0, now);
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

  private drawHitFx(top: number, now: number, light: boolean) {
    const ctx = this.ctx;
    const style = useLook.getState().hitFx;
    const theme = useLook.getState().notes;
    for (const b of this.burns) {
      const c = theme.hands[b.hand];
      const fade = b.ash > 0 ? 1 - b.ash : 1;
      const amp = (b.perfect ? 1 : 0.7) * fade;
      if (amp < 0.03) continue;
      const hgt = Math.max(0, b.bottom - b.yt);
      const cx = b.x + b.bw / 2;
      if (style === "lock") this.fxLock(b, hgt, now, amp);
      else if (style === "pulse") this.fxPulse(b, hgt, cx, now, amp);
      else if (style === "data") this.fxData(b, c.hue, hgt, now, amp);
      else if (style === "beam") this.fxBeam(b, hgt, cx, now, amp);
      else this.fxPhase(b, hgt, now, amp);
      this.keyGlow(cx, top, (this.keys.get(b.midi)?.w ?? b.bw) * 1.15, amp, hitHue(style), light);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  private fxLock(b: Burn, hgt: number, now: number, amp: number) {
    const ctx = this.ctx;
    if (hgt < 3 || b.ash > 0) return;
    const sweep = (now * 0.00115 + b.index * 0.17) % 1;
    const y = b.yt + sweep * hgt;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(b.x, b.yt, b.bw, hgt, Math.min(6, b.bw / 3, hgt / 2));
    ctx.clip();
    ctx.fillStyle = `hsla(188,100%,72%,${0.22 * amp})`;
    ctx.fillRect(b.x, y - 8, b.bw, 16);
    ctx.fillStyle = `rgba(255,255,255,${0.92 * amp})`;
    ctx.fillRect(b.x, y - 1, b.bw, 2);
    ctx.fillStyle = `hsla(188,100%,74%,${0.7 * amp})`;
    ctx.fillRect(b.x, b.yt, 1.6, hgt);
    ctx.fillRect(b.x + b.bw - 1.6, b.yt, 1.6, hgt);
    ctx.restore();
    const br = Math.min(11, hgt * 0.28, b.bw * 0.4);
    ctx.strokeStyle = `rgba(214,252,255,${0.95 * amp})`;
    ctx.lineWidth = 1.5;
    this.bracket(b.x, b.yt, br, 1, 1);
    this.bracket(b.x + b.bw, b.yt, br, -1, 1);
    this.bracket(b.x, b.bottom, br, 1, -1);
    this.bracket(b.x + b.bw, b.bottom, br, -1, -1);
  }

  private fxPulse(b: Burn, hgt: number, cx: number, now: number, amp: number) {
    const ctx = this.ctx;
    const reach = Math.max(hgt, 28);
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const u = (now * 0.00135 + i * 0.25 + b.index * 0.05) % 1;
      const y = b.bottom - u * reach;
      const a = Math.sin(u * Math.PI) * amp * 0.85;
      ctx.strokeStyle = `hsla(168,100%,${70 + u * 15}%,${a})`;
      ctx.beginPath();
      ctx.ellipse(cx, y, Math.max(4, b.bw * (0.28 + u * 0.85)), 4 + u * 7, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (hgt > 4 && b.ash === 0) {
      ctx.fillStyle = `hsla(168,100%,80%,${0.16 * amp})`;
      ctx.fillRect(b.x, b.yt, b.bw, hgt);
    }
  }

  private fxData(b: Burn, hue: number, hgt: number, now: number, amp: number) {
    const ctx = this.ctx;
    const reach = Math.max(hgt, 24);
    const bits = b.perfect ? 12 : 8;
    for (let i = 0; i < bits; i++) {
      const cycle = 420 + (i % 5) * 50;
      const u = ((now + i * 97 + b.index * 41) % cycle) / cycle;
      const ex = b.x + b.bw * (0.12 + 0.76 * hash(b.index * 5 + i * 3));
      const ey = b.bottom - u * reach;
      const a = Math.sin(u * Math.PI) * amp;
      if (a < 0.04) continue;
      const w = Math.max(2, b.bw * 0.2);
      ctx.fillStyle = i % 2 === 0 ? `rgba(206,255,255,${a})` : `hsla(${hue},85%,68%,${a})`;
      ctx.fillRect(ex, ey, w, i % 3 === 0 ? 5 : 3);
    }
  }

  private fxBeam(b: Burn, hgt: number, cx: number, now: number, amp: number) {
    const ctx = this.ctx;
    const y0 = b.ash > 0 ? b.bottom - 18 : b.yt;
    const wob = 0.72 + 0.28 * Math.sin(now * 0.018 + b.midi);
    const half = Math.max(2, b.bw * 0.16 * wob);
    const beam = ctx.createLinearGradient(cx - half * 2, 0, cx + half * 2, 0);
    beam.addColorStop(0, `hsla(196,100%,70%,0)`);
    beam.addColorStop(0.5, `hsla(190,100%,82%,${0.72 * amp})`);
    beam.addColorStop(1, `hsla(196,100%,70%,0)`);
    ctx.fillStyle = beam;
    ctx.fillRect(cx - half * 2, y0, half * 4, b.bottom - y0);
    ctx.fillStyle = `rgba(255,255,255,${0.88 * amp})`;
    ctx.fillRect(cx - 1, y0, 2, b.bottom - y0);
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) {
      const u = (now * 0.0011 + i * 0.25) % 1;
      const y = y0 + u * Math.max(8, b.bottom - y0);
      ctx.strokeStyle = `rgba(220,255,255,${(1 - u) * amp * 0.9})`;
      ctx.beginPath();
      ctx.moveTo(cx - b.bw * 0.42, y - 5);
      ctx.lineTo(cx, y + 3);
      ctx.lineTo(cx + b.bw * 0.42, y - 5);
      ctx.stroke();
    }
  }

  private fxPhase(b: Burn, hgt: number, now: number, amp: number) {
    const ctx = this.ctx;
    if (hgt < 3 || b.ash > 0) return;
    const jx = Math.sin(now * 0.028 + b.index) * (1.4 + (b.perfect ? 1.2 : 2));
    const r = Math.min(6, b.bw / 3, hgt / 2);
    ctx.globalAlpha = 0.42 * amp;
    ctx.fillStyle = "#67f7ff";
    ctx.beginPath();
    ctx.roundRect(b.x + jx, b.yt, b.bw, hgt, r);
    ctx.fill();
    ctx.fillStyle = "#ff4ad2";
    ctx.beginPath();
    ctx.roundRect(b.x - jx, b.yt, b.bw, hgt, r);
    ctx.fill();
    ctx.globalAlpha = 0.9 * amp;
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.roundRect(b.x, b.yt, b.bw, hgt, r);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private bracket(x: number, y: number, len: number, sx: number, sy: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + sx * len, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * len);
    ctx.stroke();
  }

  private keyGlow(cx: number, top: number, rad: number, amp: number, hue: number, light: boolean) {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = light ? "source-over" : "lighter";
    const g = ctx.createRadialGradient(cx, top + 8, 1, cx, top + 18, rad);
    g.addColorStop(0, `hsla(${hue},100%,78%,${amp * (light ? 0.42 : 0.72)})`);
    g.addColorStop(1, `hsla(${hue},100%,60%,0)`);
    ctx.fillStyle = g;
    ctx.fillRect(cx - rad, top, rad * 2, this.keyH * 0.62);
    ctx.globalCompositeOperation = "source-over";
  }

  private drawMissFx(top: number, now: number) {
    const style = useLook.getState().missFx;
    for (const m of this.misses) {
      if (style === "dissolve") this.missDissolve(m, top);
      else if (style === "glitch") this.missGlitch(m, top, now);
      else if (style === "pixel") this.missPixel(m, top);
      else if (style === "drift") this.missDrift(m, top);
      else this.missWipe(m, top);
    }
    this.ctx.globalAlpha = 1;
  }

  private missDissolve(m: MissAnim, top: number) {
    const ctx = this.ctx;
    const live = Math.min(m.yb, top) - m.yt;
    const a = 0.78 * (1 - m.t);
    if (live > 1 && a > 0.02) {
      ctx.globalAlpha = a;
      ctx.fillStyle = `hsla(${m.hue},10%,62%,1)`;
      ctx.beginPath();
      ctx.roundRect(m.x, m.yt, m.bw, live, Math.min(6, m.bw / 3, live / 2));
      ctx.fill();
    }
    this.missTail(m, top, 0, 0.4 * (1 - m.t));
  }

  private missGlitch(m: MissAnim, top: number, now: number) {
    const ctx = this.ctx;
    const y1 = Math.min(m.yb, top);
    const live = y1 - m.yt;
    if (live > 2) {
      const bands = 6;
      const bh = live / bands;
      for (let i = 0; i < bands; i++) {
        if (hash(m.index * 9 + i) < m.t * 0.72) continue;
        const shift = Math.sin(now * 0.02 + i * 1.7 + m.index) * (3 + m.t * 16);
        ctx.globalAlpha = 0.8 * (1 - m.t * 0.75);
        ctx.fillStyle = i % 2 ? `hsla(${m.hue},18%,64%,1)` : `hsla(${m.hue},6%,48%,1)`;
        ctx.fillRect(m.x + shift, m.yt + i * bh, m.bw, Math.max(1, bh - 1));
      }
    }
    this.missTail(m, top, Math.sin(now * 0.01 + m.index) * 10 * m.t, 0.32 * (1 - m.t));
    ctx.globalAlpha = 1;
  }

  private missPixel(m: MissAnim, top: number) {
    const ctx = this.ctx;
    const y1 = Math.min(m.yb, top);
    const live = y1 - m.yt;
    const cell = Math.max(4, Math.min(8, m.bw / 2.4));
    if (live > 2) {
      const cols = Math.max(1, Math.round(m.bw / cell));
      const rows = Math.max(1, Math.ceil(live / cell));
      for (let row = 0; row < rows; row++) {
        if (m.t > (row + 1) / rows) continue;
        for (let col = 0; col < cols; col++) {
          if (hash(m.index * 13 + row * 5 + col) < m.t * 0.35) continue;
          ctx.globalAlpha = 0.85 * (1 - m.t);
          ctx.fillStyle = (row + col) % 2 ? `hsla(${m.hue},14%,66%,1)` : `hsla(${m.hue},6%,46%,1)`;
          ctx.fillRect(m.x + col * (m.bw / cols), y1 - (row + 1) * (live / rows), m.bw / cols - 1, live / rows - 1);
        }
      }
    }
    const span = this.keyH * 0.55;
    const n = 4;
    for (let i = 0; i < n; i++) {
      const u = Math.min(1, m.t + i * 0.08);
      ctx.globalAlpha = 0.45 * (1 - u);
      ctx.fillStyle = `hsla(${m.hue},8%,60%,1)`;
      const s = 3 + (i % 2);
      ctx.fillRect(m.x + m.bw * hash(m.index + i), top + u * span, s, s);
    }
    ctx.globalAlpha = 1;
  }

  private missDrift(m: MissAnim, top: number) {
    const ctx = this.ctx;
    const live = Math.min(m.yb, top) - m.yt;
    const dx = (hash(m.index) - 0.5) * 36 * m.t;
    const dy = m.t * 26;
    if (live > 1) {
      ctx.globalAlpha = 0.22 * (1 - m.t);
      ctx.fillStyle = `hsla(${m.hue},8%,60%,1)`;
      ctx.beginPath();
      ctx.roundRect(m.x + dx * 0.45, m.yt + dy * 0.45, m.bw, live, 4);
      ctx.fill();
      ctx.globalAlpha = 0.72 * (1 - m.t);
      ctx.beginPath();
      ctx.roundRect(m.x + dx, m.yt + dy, m.bw, live, 4);
      ctx.fill();
    }
    this.missTail(m, top, dx, 0.28 * (1 - m.t));
  }

  private missWipe(m: MissAnim, top: number) {
    const ctx = this.ctx;
    const y1 = Math.min(m.yb, top);
    const live = y1 - m.yt;
    if (live > 1) {
      const keep = live * (1 - m.t);
      if (keep > 1) {
        ctx.globalAlpha = 0.75 * (1 - m.t * 0.35);
        ctx.fillStyle = `hsla(${m.hue},12%,58%,1)`;
        ctx.beginPath();
        ctx.roundRect(m.x, m.yt, m.bw, keep, Math.min(6, m.bw / 3, keep / 2));
        ctx.fill();
      }
      const edge = m.yt + keep;
      ctx.globalAlpha = 0.9 * (1 - m.t);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(m.x, edge - 1.5, m.bw, 2);
    }
    this.missTail(m, top, 0, 0.34 * (1 - m.t));
    ctx.globalAlpha = 1;
  }

  private missTail(m: MissAnim, top: number, dx: number, alpha: number) {
    if (m.yb <= top || alpha < 0.02) return;
    const span = this.keyH * 0.62;
    const y1 = Math.min(m.yb, top + span);
    const h = y1 - top;
    if (h < 1) return;
    const travel = (m.yb - top) / span;
    const ctx = this.ctx;
    ctx.globalAlpha = alpha * Math.max(0, 1 - travel);
    ctx.fillStyle = `hsla(${m.hue},8%,58%,1)`;
    ctx.beginPath();
    ctx.roundRect(m.x + dx, top, m.bw, h, Math.min(6, m.bw / 3, h / 2));
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawHitLine(top: number) {
    const { ctx } = this;
    const line = ctx.createLinearGradient(0, 0, this.w, 0);
    line.addColorStop(0, "#22d3ee");
    line.addColorStop(0.5, "#818cf8");
    line.addColorStop(1, "#f472b6");
    ctx.save();
    ctx.shadowColor = "rgba(34,211,238,0.85)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = line;
    ctx.fillRect(0, top - 1, this.w, 5);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(0, top + 1, this.w, 1.2);
    ctx.restore();

    const j = engine.judgement;
    const err = engine.lastError;
    if (!j || err === null || j.bias === "wrong") return;
    const age = (performance.now() - j.at) / 700;
    if (age >= 1) return;
    const x = this.w / 2 - (err / HIT_WINDOW_SEC) * Math.min(110, this.w * 0.18);
    ctx.save();
    ctx.globalAlpha = 1 - age;
    ctx.fillStyle = j.bias === "perfect" ? "#a5f3fc" : j.bias === "early" ? "#c4b5fd" : "#fda4af";
    ctx.beginPath();
    ctx.moveTo(x, top - 11);
    ctx.lineTo(x + 6, top - 1);
    ctx.lineTo(x - 6, top - 1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
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
      } else if (burn > 0.2 || held) {
        top0 = k.black ? "#5eead4" : "#a5f3fc";
        bot = k.black ? "#6366f1" : "#f472b6";
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

  private drawEchoCue(top: number, mode: string, finished: boolean, origin: number, now: number) {
    if (mode !== "echo" || finished || engine.pos < origin) return;
    if (engine.echoPhase === "next") {
      this.drawNextPart(top, now);
      return;
    }
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

  private drawNextPart(top: number, now: number) {
    const ctx = this.ctx;
    const light = useLook.getState().stage.light;
    const t = now / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * 4.2);
    const cx = this.w / 2;
    const cy = top * 0.42 + Math.sin(t * 2.1) * 5;

    ctx.fillStyle = light ? "rgba(255,250,242,0.62)" : "rgba(4,8,16,0.5)";
    ctx.fillRect(0, 0, this.w, top);

    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const u = (t * 0.42 + i / 3) % 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 36 + u * 108, 0, Math.PI * 2);
      ctx.strokeStyle = light ? `rgba(15,118,110,${(1 - u) * 0.4})` : `rgba(165,243,252,${(1 - u) * 0.5})`;
      ctx.stroke();
    }

    const bw = Math.min(300, this.w - 40);
    const bh = 104;
    ctx.fillStyle = light ? "rgba(255,252,247,0.96)" : "rgba(10,14,26,0.9)";
    ctx.beginPath();
    ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, 20);
    ctx.fill();
    ctx.strokeStyle = light ? "rgba(15,118,110,0.35)" : "rgba(165,243,252,0.45)";
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy - 14);
    ctx.scale(1 + pulse * 0.04, 1 + pulse * 0.04);
    ctx.fillStyle = light ? "#134e4a" : "#ecfeff";
    ctx.font = "800 30px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Next part", 0, 0);
    ctx.restore();

    ctx.globalAlpha = 0.7 + pulse * 0.3;
    ctx.fillStyle = light ? "#0f766e" : "#a5f3fc";
    ctx.font = "600 14px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Press Space or Enter", cx, cy + 24);
    ctx.globalAlpha = 1;
    ctx.textBaseline = "alphabetic";
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
