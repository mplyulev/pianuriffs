import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NOTE_THEMES, STAGES, useLook, type NoteTheme, type Stage } from "../lib/look";

const chip = (hue: number, sat: number, light: number) => `hsl(${hue} ${sat}% ${light}%)`;

function NoteMarks({ theme }: { theme: NoteTheme }) {
  const r = theme.hands.R;
  const l = theme.hands.L;
  return (
    <span className="flex h-7 items-end gap-1">
      <span className="w-2 rounded-t-md" style={{ height: 26, background: chip(r.hue, r.sat, r.l1) }} />
      <span className="w-2 rounded-t-md" style={{ height: 18, background: chip(l.hue, l.sat, l.l1) }} />
    </span>
  );
}

function StageTile({ stage, selected }: { stage: Stage; selected: boolean }) {
  return (
    <span
      className={`block h-11 w-full rounded-lg ${selected ? "ring-2 ring-white" : "ring-1 ring-white/15"}`}
      style={{ background: `linear-gradient(180deg, ${stage.bg0}, ${stage.bg1})` }}
    />
  );
}

export function LookPanel() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef(0);
  const picker = useRef(false);
  const [box, setBox] = useState<{ top: number; right: number } | null>(null);
  const notesId = useLook((s) => s.notesId);
  const stageId = useLook((s) => s.stageId);
  const custom = useLook((s) => s.custom);
  const notes = useLook((s) => s.notes);
  const stage = useLook((s) => s.stage);
  const setNotes = useLook((s) => s.setNotes);
  const setStage = useLook((s) => s.setStage);
  const setCustom = useLook((s) => s.setCustom);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (picker.current) return;
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
    if (picker.current) return;
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
        title="Note colors and background"
      >
        <span
          className="h-4 w-4 rounded-md ring-1 ring-white/25"
          style={{ background: `linear-gradient(180deg, ${stage.bg0}, ${stage.bg1})` }}
        />
        <span className="flex shrink-0 -space-x-1">
          <span className="h-4 w-4 rounded-full ring-1 ring-black/30" style={{ background: chip(notes.hands.R.hue, notes.hands.R.sat, notes.hands.R.l1) }} />
          <span className="h-4 w-4 rounded-full ring-1 ring-black/30" style={{ background: chip(notes.hands.L.hue, notes.hands.L.sat, notes.hands.L.l1) }} />
        </span>
        Look
      </button>
      {open && box && createPortal(
        <div
          ref={panel}
          className="glass fixed z-[80] max-h-[min(560px,calc(100vh-24px))] w-[300px] overflow-y-auto rounded-2xl p-3"
          style={{ top: box.top, right: box.right }}
          onMouseEnter={() => window.clearTimeout(leaveTimer.current)}
          onMouseLeave={scheduleClose}
        >
          <div className="px-0.5 pb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">Notes</div>
          <div className="grid grid-cols-2 gap-1.5">
            {NOTE_THEMES.map((p) => {
              const on = p.id === notesId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setNotes(p.id)}
                  className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                    on ? "bg-white/14 text-white ring-1 ring-white/30" : "bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <NoteMarks theme={p} />
                  <span className="text-sm font-semibold">{p.name}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3.5 px-0.5 pb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">Background</div>
          <div className="grid grid-cols-4 gap-1.5">
            {STAGES.map((s) => {
              const on = s.id === stageId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStage(s.id)}
                  className="flex flex-col gap-1 rounded-lg p-0.5 text-center"
                  title={s.name}
                >
                  <StageTile stage={s} selected={on} />
                  <span className={`text-[9px] font-semibold leading-none ${on ? "text-white" : "text-white/45"}`}>{s.name}</span>
                </button>
              );
            })}
          </div>

          <label
            className={`mt-2.5 flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 transition ${
              stageId === "custom" ? "bg-white/14 ring-1 ring-white/30" : "bg-white/5 hover:bg-white/10"
            }`}
          >
            <input
              type="color"
              value={custom}
              aria-label="Custom background color"
              className="look-color"
              onPointerDown={() => { picker.current = true; }}
              onFocus={() => { picker.current = true; }}
              onBlur={() => { picker.current = false; }}
              onInput={(e) => setCustom(e.currentTarget.value)}
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white">Custom</span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-white/40">{custom}</span>
            </span>
          </label>
        </div>,
        document.body,
      )}
    </div>
  );
}
