import { connectMidi, useMidi } from "../lib/midi";
import { synth } from "../lib/audio";

export function MidiHelp() {
  const midi = useMidi();
  if (midi.inputs.length > 0) return null;

  return (
    <div className="pointer-events-auto mt-2 max-w-xl rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
      <div className="font-semibold text-amber-100">MIDI is not a Windows setting</div>
      <p className="mt-1 text-[13px] leading-relaxed text-amber-50/80">
        The Allow box is a tiny popup in <span className="font-semibold text-white">Chrome</span>, just under the
        address bar, next to the lock icon. It often flashes and vanishes. Windows Settings has nothing for this.
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-amber-50/85">
        <li>Use Chrome or Edge at http://127.0.0.1:3000 (not the Cursor preview).</li>
        <li>
          In the address bar, paste{" "}
          <code className="rounded bg-black/30 px-1 text-[12px] text-white">chrome://settings/content/midiDevices</code>
          {" "}(Edge: <code className="rounded bg-black/30 px-1 text-[12px] text-white">edge://settings/content/midiDevices</code>).
        </li>
        <li>Set “Default behavior” to <span className="font-semibold text-white">Ask</span> (not Block).</li>
        <li>
          Back on Keystream, click the lock icon left of the URL → Site settings → <span className="font-semibold text-white">MIDI devices</span> →{" "}
          <span className="font-semibold text-white">Allow</span>.
        </li>
        <li>Then click Connect MIDI below. After that, play a key.</li>
      </ol>
      <button
        type="button"
        onClick={() => {
          synth.unlock();
          void connectMidi();
        }}
        className="mt-3 rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-bold text-slate-900"
      >
        Connect MIDI
      </button>
      {midi.detail && <p className="mt-2 text-[12px] text-amber-100/70">{midi.detail}</p>}
    </div>
  );
}
