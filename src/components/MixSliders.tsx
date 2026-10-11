import { useEngine } from "../lib/engine";
import { synth, useSound } from "../lib/audio";

function Fader({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex min-w-[9.5rem] flex-1 cursor-pointer flex-col gap-1" title={hint}>
      <span className="flex justify-between px-1 text-[10px] font-semibold uppercase tracking-widest text-white/35">
        {label}
        <span className="tabular-nums text-white/70">{Math.round(value * 100)}%</span>
      </span>
      <div className="flex h-[34px] items-center rounded-xl bg-black/25 px-3">
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
        />
      </div>
    </label>
  );
}

export function MixSliders() {
  const youVol = useSound((s) => s.youVol);
  const appVol = useSound((s) => s.appVol);
  const setMix = (patch: { youVol?: number; appVol?: number }) => {
    synth.unlock();
    useSound.setState(patch);
    const next = { ...useSound.getState(), ...patch };
    useEngine.setState({ appSound: next.appVol > 0.008 });
  };

  return (
    <div className="flex min-w-0 flex-wrap items-end gap-3">
      <Fader
        label="You"
        hint="Volume of notes you play on MIDI or the on-screen keys"
        value={youVol}
        onChange={(youVol) => setMix({ youVol })}
      />
      <Fader
        label="App"
        hint="Volume of the falling-note playback"
        value={appVol}
        onChange={(appVol) => setMix({ appVol })}
      />
    </div>
  );
}
