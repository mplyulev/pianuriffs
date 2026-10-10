import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PALETTES, useLook, type Palette } from "../lib/look";

const chip = (hue: number, sat: number, light: number) =>
  `hsl(${hue} ${sat}% ${light}%)`;

function Swatch({ palette }: { palette: Palette }) {
  return (
    <span className="flex shrink-0 -space-x-1">
      <span className="h-4 w-4 rounded-full ring-1 ring-black/30" style={{ background: chip(palette.hands.R.hue, palette.hands.R.sat, palette.hands.R.l1) }} />
      <span className="h-4 w-4 rounded-full ring-1 ring-black/30" style={{ background: chip(palette.hands.L.hue, palette.hands.L.sat, palette.hands.L.l1) }} />
    </span>
  );
}

export function LookPanel() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef(0);
  const [box, setBox] = useState<{ top: number; right: number } | null>(null);
  const id = useLook((s) => s.id);
  const setId = useLook((s) => s.setId);
  const current = PALETTES.find((p) => p.id === id) ?? PALETTES[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (root.current?.contains(t) || panel.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    document.body.dataset.look = open ? "open" : "";
    return () => {
      document.body.dataset.look = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = root.current?.getBoundingClientRect();
      if (!r || r.height < 2) return;
      const next = { top: r.bottom + 10, right: Math.max(12, window.innerWidth - r.right) };
      setBox((prev) => (prev && Math.abs(prev.top - next.top) < 0.5 && Math.abs(prev.right - next.right) < 0.5 ? prev : next));
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("pointermove", place);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("pointermove", place);
    };
  }, [open]);

  const scheduleClose = () => {
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setOpen(false), 220);
  };

  return (
    <div ref={root} className="relative" onMouseEnter={() => window.clearTimeout(leaveTimer.current)} onMouseLeave={scheduleClose}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          open ? "bg-white/18 text-white" : "bg-white/8 text-white/80 hover:bg-white/15"
        }`}
        title="Note colors"
      >
        <Swatch palette={current} />
        Look
      </button>
      {open && box && createPortal(
        <div
          ref={panel}
          className="glass fixed z-[80] w-56 rounded-2xl p-2"
          style={{ top: box.top, right: box.right }}
          onMouseEnter={() => window.clearTimeout(leaveTimer.current)}
          onMouseLeave={scheduleClose}
        >
          <div className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">Color</div>
          <div className="flex flex-col gap-1">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setId(p.id)}
                className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold transition ${
                  p.id === id ? "bg-white/14 text-white ring-1 ring-white/25" : "text-white/75 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Swatch palette={p} />
                {p.name}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
