import { engine, HIT, MISSED, useEngine } from "./engine";
import { emitNote } from "./midi";
import { useLook } from "./look";
import type { Hand } from "./song";

const BLACK = new Set([1, 3, 6, 8, 10]);
const isBlack = (m: number) => BLACK.has(m % 12);

const VISIBLE_BEATS = 7;

interface ExitAnim {
  index: number;
  midi: number;
  hand: Hand;
  perfect: boolean;
  born: number;
  x: number;
  bw: number;
  h: number;
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
  private armed = new Map<number, boolean>();
  private exits: ExitAnim[] = [];
  private spent = new Set<number>();
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
        this.armed.clear();
        this.exits = [];
        this.spent.clear();
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

    const pal = useLook.getState().palette;
    const bg = ctx.createLinearGradient(0, 0, 0, top);
    bg.addColorStop(0, pal.bg0);
    bg.addColorStop(1, pal.bg1);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.lineWidth = 1;
    for (const [m, k] of this.keys) {
      if (k.black || m % 12 !== 5 && m % 12 !== 0) continue;
      ctx.fillStyle = pal.grid;
      ctx.fillRect(Math.round(k.x), 0, 1, top);
    }
    const firstBeat = Math.ceil(pos);
    for (let b = firstBeat; b < pos + VISIBLE_BEATS + 1; b++) {
      const y = Math.round(top - (b - pos) * ppb);
      const bar = b % beatsPerBar === 0;
      ctx.fillStyle = bar ? pal.bar : pal.grid;
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

    this.collectHits(now, top, ppb);
    const exiting = new Set(this.exits.map((e) => e.index));
    this.drops.length = 0;

    const sounding = new Map<number, Hand>();
    ctx.globalCompositeOperation = "source-over";
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.start > pos + VISIBLE_BEATS) break;
      const leaving = exiting.has(i) || this.spent.has(i);
      if (!leaving && n.start + n.dur < pos) continue;
      const k = this.keys.get(n.midi);
      if (!k) continue;
      if (n.start <= pos && n.start + n.dur >= pos) sounding.set(n.midi, n.hand);
      if (leaving) continue;
      const st = engine.status[i];
      const required = engine.isRequired(i);
      const yb = top - (n.start - pos) * ppb;
      const yt = Math.min(yb - n.dur * ppb, top);
      const bottom = Math.min(yb, top);
      const hgt = bottom - yt;
      const c = pal.hands[n.hand];
      const inset = k.black ? 1 : 2;
      const x = k.x + inset;
      const bw = k.w - inset * 2;
      if (st === MISSED && yb > top) {
        const span = this.keyH * 0.72;
        const travel = (yb - top) / span;
        const y0 = Math.max(top, yt);
        const y1 = Math.min(yb, top + span);
        if (travel < 1 && y1 - y0 > 1) this.drops.push({ x, w: bw, y0, y1, hue: c.hue, a: 0.34 * (1 - travel) });
      }
      if (hgt < 1) continue;
      const ghost = !required;
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
    grad.addColorStop(0, pal.wash0);
    grad.addColorStop(1, pal.wash1);
    ctx.fillStyle = grad;
    ctx.fillRect(0, top - 36, w, 36);

    this.drawExits(top, now);
    this.drawKeyboard(top, sounding, now);
    this.drawExitBloom(top, now);
    this.drawMissDrops();
    this.drawHitLine(top);
    this.drawEchoCue(top, s.mode, s.finished, s.loop?.a ?? 0);
    this.drawJudgement(top, now);
    if (pos < 0) this.drawCountIn(top);
  }

  private collectHits(now: number, top: number, ppb: number) {
    for (const f of engine.fx) this.armed.set(f.index, f.perfect);
    engine.fx.length = 0;
    for (const index of this.armed.keys()) {
      if (engine.status[index] !== HIT) this.armed.delete(index);
    }
    const notes = useEngine.getState().song.notes;
    const pos = engine.pos;
    const ready: number[] = [];
    for (const [index] of this.armed) {
      const n = notes[index];
      if (n && n.start <= pos + 0.02) ready.push(index);
    }
    for (const index of ready) {
      const perfect = this.armed.get(index) ?? false;
      this.armed.delete(index);
      const n = notes[index];
      const k = this.keys.get(n.midi);
      if (!k) continue;
      const yb = top - (n.start - pos) * ppb;
      const yt = yb - n.dur * ppb;
      const visible = Math.min(yb, top) - Math.min(yt, top);
      const inset = k.black ? 1 : 2;
      this.exits.push({
        index,
        midi: n.midi,
        hand: n.hand,
        perfect,
        born: now,
        x: k.x + inset,
        bw: Math.max(2, k.w - inset * 2),
        h: Math.max(16, visible),
      });
    }
    const notesLeft = useEngine.getState().song.notes;
    const posNow = engine.pos;
    this.exits = this.exits.filter((e) => {
      const alive = engine.status[e.index] === HIT && now - e.born < (e.perfect ? 280 : 440);
      if (!alive && engine.status[e.index] === HIT) this.spent.add(e.index);
      return alive;
    });
    for (const index of this.spent) {
      const n = notesLeft[index];
      if (!n || engine.status[index] !== HIT || n.start + n.dur < posNow) this.spent.delete(index);
    }
  }

  private drawExits(top: number, now: number) {
    const ctx = this.ctx;
    const pal = useLook.getState().palette;
    for (const e of this.exits) {
      const life = e.perfect ? 280 : 440;
      const t = Math.min(1, (now - e.born) / life);
      const ease = 1 - (1 - t) ** 3;
      const h = e.h * (1 - ease);
      if (h < 1) continue;
      const c = pal.hands[e.hand];
      const squeeze = 1 - ease * (e.perfect ? 0.7 : 0.38);
      const bw = e.bw * squeeze;
      const x = e.x + (e.bw - bw) / 2;
      const fade = t < 0.62 ? 1 : 1 - (t - 0.62) / 0.38;
      ctx.globalAlpha = fade;
      const g = ctx.createLinearGradient(0, top - h, 0, top);
      g.addColorStop(0, `hsla(${c.hue},${c.sat}%,${c.hitL1}%,1)`);
      g.addColorStop(1, `hsla(${c.hue + 18},${c.sat}%,${c.hitL2}%,1)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x, top - h, bw, h, Math.min(6, bw / 3, h / 2));
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  private drawExitBloom(top: number, now: number) {
    const ctx = this.ctx;
    const pal = useLook.getState().palette;
    ctx.globalCompositeOperation = "lighter";
    for (const e of this.exits) {
      const life = e.perfect ? 280 : 440;
      const t = Math.min(1, (now - e.born) / life);
      const ease = 1 - (1 - t) ** 3;
      const h = e.h * (1 - ease);
      const c = pal.hands[e.hand];
      const cx = e.x + e.bw / 2;
      const reach = (e.perfect ? 12 : 20) * (1 - t * 0.35);
      const streakA = (1 - t) * (e.perfect ? 0.95 : 0.5);
      const sw = e.perfect ? 2 : 4.5;
      const y0 = top - Math.max(h, 4);
      ctx.fillStyle = `hsla(${c.hue},100%,${e.perfect ? 78 : 66}%,${streakA})`;
      ctx.fillRect(cx - sw / 2, y0, sw, top + reach - y0);
      ctx.fillStyle = `rgba(255,255,255,${streakA * (e.perfect ? 0.75 : 0.3)})`;
      ctx.fillRect(cx - 0.6, y0, e.perfect ? 1.2 : 1.5, (top + reach - y0) * 0.8);

      const k = this.keys.get(e.midi);
      const rad = (k?.w ?? e.bw) * (e.perfect ? 0.62 : 1.35);
      const bloom = (1 - t) * (e.perfect ? 0.9 : 0.42);
      const g = ctx.createRadialGradient(cx, top + 8, 1, cx, top + 12, rad);
      g.addColorStop(0, `hsla(${c.hue},100%,${e.perfect ? 84 : 70}%,${bloom})`);
      g.addColorStop(1, `hsla(${c.hue},100%,60%,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(cx - rad, top, rad * 2, rad * 0.85);
    }
    ctx.globalCompositeOperation = "source-over";
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
    const [a, b, c] = useLook.getState().palette.line;
    const line = ctx.createLinearGradient(0, 0, this.w, 0);
    line.addColorStop(0, a);
    line.addColorStop(0.5, b);
    line.addColorStop(1, c);
    ctx.fillStyle = line;
    ctx.fillRect(0, top, this.w, 2.5);
  }

  private drawKeyboard(top: number, sounding: Map<number, Hand>, now: number) {
    const { ctx, keyH } = this;
    const pal = useLook.getState().palette;
    ctx.fillStyle = pal.keyBed;
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
        top0 = k.black ? pal.heldBlackTop : pal.heldWhiteTop;
        bot = k.black ? pal.heldBlackBot : pal.heldWhiteBot;
      } else if (hand) {
        const c = pal.hands[hand];
        top0 = `hsl(${c.hue},${c.sat}%,${k.black ? 45 : 72}%)`;
        bot = `hsl(${c.hue + 18},${c.sat}%,${k.black ? 32 : 58}%)`;
      } else {
        top0 = k.black ? pal.blackTop : pal.whiteTop;
        bot = k.black ? pal.blackBot : pal.whiteBot;
      }
      const g = ctx.createLinearGradient(0, top, 0, top + kh);
      g.addColorStop(0, top0);
      g.addColorStop(1, bot);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(k.x + (k.black ? 0 : 1), top + 2, k.w - (k.black ? 0 : 2), kh - 2, [0, 0, 5, 5]);
      ctx.fill();
      if (!k.black && m % 12 === 0) {
        ctx.fillStyle = pal.cLabel;
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
