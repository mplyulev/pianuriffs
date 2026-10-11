import { useEffect, useRef, useState } from "react";
import { Renderer } from "./lib/renderer";
import { connectMidi, installComputerKeyboard } from "./lib/midi";
import { engine, useEngine } from "./lib/engine";
import { synth } from "./lib/audio";
import { TopBar } from "./components/TopBar";
import { Controls } from "./components/Controls";
import { Results } from "./components/Results";
import { Library } from "./components/Library";
import { Welcome } from "./components/Welcome";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [welcome, setWelcome] = useState(true);

  useEffect(() => {
    const r = new Renderer(canvasRef.current!);
    void connectMidi();
    const off = installComputerKeyboard();
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!e.repeat && (e.code === "Space" || e.code === "Enter") && engine.confirmEcho()) {
        e.preventDefault();
        synth.unlock();
        void connectMidi();
        return;
      }
      if (e.code === "Space" && tag !== "BUTTON") {
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
        </div>
      </div>
      <Controls />
      <Results />
      <Library />
      {welcome && <Welcome onEnter={() => setWelcome(false)} />}
    </div>
  );
}
