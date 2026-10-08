import { useEffect, useRef } from "react";
import { Renderer } from "./lib/renderer";
import { connectMidi, installComputerKeyboard } from "./lib/midi";
import { useEngine } from "./lib/engine";
import { synth } from "./lib/audio";
import { TopBar } from "./components/TopBar";
import { Controls } from "./components/Controls";
import { Stats } from "./components/Stats";
import { Results } from "./components/Results";
import { Library } from "./components/Library";

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
        useEngine.setState((s) => ({ playing: !s.playing }));
      }
    };
    const unlock = () => synth.unlock();
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => {
      r.destroy();
      off();
      window.removeEventListener("keydown", key);
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
    </div>
  );
}
