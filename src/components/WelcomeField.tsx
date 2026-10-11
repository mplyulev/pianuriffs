import { useEffect, useRef } from "react";

const COLORS = ["#22d3ee", "#818cf8", "#f472b6", "#38bdf8", "#a78bfa", "#fb7185"];
const LEFT = [0.045, 0.115, 0.185, 0.255, 0.325];
const RIGHT = [0.675, 0.745, 0.815, 0.885, 0.955];
const HIT = 0.78;

type Brick = {
  x: number;
  w: number;
  h: number;
  color: string;
  dur: number;
  offset: number;
  sway: number;
  swayDur: number;
  lit: boolean;
};

type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number };
type Mote = { x: number; y: number; s: number; a: number; vx: number; vy: number };

function hexRgb(hex: string) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)] as const;
}

function makeBricks(): Brick[] {
  const lanes = [...LEFT, ...RIGHT];
  return lanes.flatMap((x, i) => {
    const extra = i % 2 === 0;
    const one: Brick = {
      x,
      w: 12 + ((i * 3) % 8),
      h: 56 + ((i * 37) % 100),
      color: COLORS[i % COLORS.length],
      dur: 7.5 + (i % 5) * 1.7,
      offset: (i * 0.17) % 1,
      sway: 5 + (i % 4) * 2,
      swayDur: 2.2 + (i % 3) * 0.6,
      lit: false,
    };
    if (!extra) return [one];
    return [
      one,
      {
        ...one,
        h: 42 + ((i * 19) % 50),
        w: one.w - 2,
        color: COLORS[(i + 2) % COLORS.length],
        dur: one.dur + 3.4,
        offset: (one.offset + 0.48) % 1,
        sway: one.sway * -0.7,
      },
    ];
  });
}

function makeMotes(n: number): Mote[] {
  return Array.from({ length: n }, (_, i) => ({
    x: (i * 0.137) % 1,
    y: (i * 0.271) % 1,
    s: 0.6 + (i % 4) * 0.4,
    a: 0.15 + (i % 5) * 0.08,
    vx: ((i % 7) - 3) * 0.004,
    vy: -0.012 - (i % 3) * 0.006,
  }));
}

export function WelcomeField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bricks = makeBricks();
    const motes = makeMotes(42);
    const sparks: Spark[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (x: number, y: number, color: string) => {
      for (let i = 0; i < 10; i++) {
        const ang = Math.PI * (0.15 + Math.random() * 0.7);
        const sp = 40 + Math.random() * 120;
        sparks.push({
          x,
          y,
          vx: Math.cos(ang) * sp * (Math.random() < 0.5 ? -1 : 1),
          vy: -Math.sin(ang) * sp,
          life: 0,
          max: 0.35 + Math.random() * 0.35,
          color,
          size: 1.2 + Math.random() * 2.2,
        });
      }
    };

    const drawBrick = (b: Brick, x: number, y: number, alpha: number, glow: number) => {
      const [r, g, bl] = hexRgb(b.color);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = `rgba(${r},${g},${bl},${0.55 + glow * 0.4})`;
      ctx.shadowBlur = 16 + glow * 18;
      const grd = ctx.createLinearGradient(x, y, x, y + b.h);
      grd.addColorStop(0, "#fff");
      grd.addColorStop(0.08, b.color);
      grd.addColorStop(1, `rgba(${r},${g},${bl},0.45)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.roundRect(x, y, b.w, b.h, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, b.w - 6, 3, 2);
      ctx.fill();
      ctx.restore();
    };

    const paint = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const hitY = h * HIT;

      ctx.fillStyle = "#07070f";
      ctx.fillRect(0, 0, w, h);

      const g1 = ctx.createRadialGradient(w * 0.12, h * 0.18, 0, w * 0.12, h * 0.18, w * 0.55);
      g1.addColorStop(0, "rgba(34,211,238,0.22)");
      g1.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);
      const g2 = ctx.createRadialGradient(w * 0.9, h * 0.82, 0, w * 0.9, h * 0.82, w * 0.5);
      g2.addColorStop(0, "rgba(244,114,182,0.18)");
      g2.addColorStop(1, "rgba(244,114,182,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
      const g3 = ctx.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.48, w * 0.38);
      g3.addColorStop(0, "rgba(99,102,241,0.14)");
      g3.addColorStop(1, "rgba(99,102,241,0)");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      for (const lane of [...LEFT, ...RIGHT]) {
        const x = Math.round(lane * w) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      const pulse = 0.35 + Math.sin(t * 3.2) * 0.2;
      ctx.save();
      ctx.strokeStyle = `rgba(103,232,249,${0.28 + pulse})`;
      ctx.shadowColor = "#67e8f9";
      ctx.shadowBlur = 12 + pulse * 18;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, hitY);
      ctx.lineTo(w, hitY);
      ctx.stroke();
      ctx.restore();

      for (const m of motes) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.y < -0.02) m.y = 1.02;
        if (m.x < -0.02) m.x = 1.02;
        if (m.x > 1.02) m.x = -0.02;
        const tw = 0.5 + 0.5 * Math.sin(t * 2 + m.x * 12);
        ctx.fillStyle = `rgba(255,255,255,${m.a * tw})`;
        ctx.beginPath();
        ctx.arc(m.x * w, m.y * h, m.s, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const b of bricks) {
        const cycle = ((t / b.dur + b.offset) % 1 + 1) % 1;
        const travel = h + b.h + 80;
        const y = cycle * travel - b.h - 40;
        const x = b.x * w - b.w / 2 + Math.sin(t * ((Math.PI * 2) / b.swayDur) + b.offset * 8) * b.sway;
        const near = 1 - Math.min(1, Math.abs(y + b.h - hitY) / 70);
        const glow = near * near;
        const fade = cycle < 0.06 ? cycle / 0.06 : cycle > 0.92 ? (1 - cycle) / 0.08 : 1;

        const [r, g, bl] = hexRgb(b.color);
        const trailH = 70 + b.h * 0.35;
        ctx.save();
        ctx.globalAlpha = fade * 0.55;
        const smear = ctx.createLinearGradient(x, y - trailH, x, y + 8);
        smear.addColorStop(0, `rgba(${r},${g},${bl},0)`);
        smear.addColorStop(0.7, `rgba(${r},${g},${bl},0.18)`);
        smear.addColorStop(1, `rgba(${r},${g},${bl},0.4)`);
        ctx.fillStyle = smear;
        ctx.shadowColor = `rgba(${r},${g},${bl},0.35)`;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(x, y - trailH, b.w, trailH + 10, 6);
        ctx.fill();
        ctx.restore();
        drawBrick(b, x, y, fade, glow);

        const bottom = y + b.h;
        if (!b.lit && bottom >= hitY - 6 && bottom <= hitY + 18 && fade > 0.4) {
          b.lit = true;
          spawn(x + b.w / 2, hitY, b.color);
        }
        if (bottom > hitY + 40) b.lit = false;
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 180 * dt;
        s.vx *= 0.98;
        const p = 1 - s.life / s.max;
        if (p <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        const [r, g, bl] = hexRgb(s.color);
        ctx.fillStyle = `rgba(${r},${g},${bl},${p})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * p, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (reduce) {
      paint(performance.now());
      return () => ro.disconnect();
    }

    const loop = (now: number) => {
      paint(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}
