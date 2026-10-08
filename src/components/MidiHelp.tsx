import { connectMidi, useMidi } from "../lib/midi";

export function MidiHelp() {
  const midi = useMidi();
  if (midi.inputs.length > 0) return null;

  return (
    <div className="pointer-events-auto mt-2 max-w-xl rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
      <div className="font-semibold text-amber-100">Chrome will not show a big Allow window</div>
      <p className="mt-1 text-[13px] leading-relaxed text-amber-50/85">
        There is no Windows toggle. Chrome’s MIDI Allow is a small chip under the address bar (lock icon).
        If it never appears, turn it on for this site:
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-amber-50/85">
        <li>
          Paste this in the Chrome address bar and press Enter:
          <div className="mt-1 select-all rounded bg-black/40 px-2 py-1 font-mono text-[12px] text-white">
            chrome://settings/content/siteDetails?site=http://127.0.0.1:3000
          </div>
        </li>
        <li>
          Find <span className="font-semibold text-white">MIDI devices</span> and set it to{" "}
          <span className="font-semibold text-white">Allow</span>.
        </li>
        <li>Come back to this tab, reload, click Connect MIDI, then play a key.</li>
      </ol>
      <p className="mt-2 text-[12px] text-amber-100/70">
        Also check chrome://settings/content/midiDevices → scroll to “Not allowed” and remove 127.0.0.1 if it’s listed.
      </p>
      <button
        type="button"
        onPointerDown={() => {
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
