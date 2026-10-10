import { useEffect, useRef } from "react";
import { Renderer } from "./lib/renderer";
import { connectMidi, installComputerKeyboard, useMidi } from "./lib/midi";
import { useEngine } from "./lib/engine";
import { synth } from "./lib/audio";
import { TopBar } from "./components/TopBar";
import { Controls } from "./components/Controls";
import { Stats } from "./components/Stats";
import { Results } from "./components/Results";
import { Library } from "./components/Library";

function MidiDebug() {
  const lines = useMidi((s) => s.debug);
  if (!lines.length) return null;
  return (
    <pre className="pointer-events-none absolute bottom-3 left-3 z-30 max-h-48 max-w-[min(36rem,calc(100%-1.5rem))] overflow-hidden rounded-lg bg-black/80 p-2 text-[10px] leading-snug whitespace-pre-wrap text-emerald-200">
      {lines.join("\n")}
    </pre>
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const r = new Renderer(canvasRef.current!);
    void connectMidi();
    const off = installComputerKeyboard();
    const key = (e: KeyboardEvent) => {
      if (e.code === "Space" && (e.target as HTMLElement).tagName !== "BUTTON") {
        e.preventDefault();
        synth.unlock();
        void connectMidi();
        useEngine.setState((s) => ({ playing: !s.playing }));
      }
    };
    const wake = () => {
      synth.unlock();
      void connectMidi();
    };
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", wake);
    window.addEventListener("focus", wake);
    return () => {
      r.destroy();
      off();
      window.removeEventListener("keydown", key);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("focus", wake);
    };
  }, []);

  return (
    <div className="relative flex h-full flex-col">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <TopBar />
          <div className="flex justify-end">
            <Stats />
          </div>
        </div>
      </div>
      <Controls />
      <Results />
      <Library />
      <MidiDebug />
    </div>
  );
}
