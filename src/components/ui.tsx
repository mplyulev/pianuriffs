import type { ReactNode } from "react";

export function Pill({
  active,
  onClick,
  children,
  title,
  tone = "indigo",
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
  tone?: "indigo" | "cyan" | "pink" | "amber";
}) {
  const tones = {
    indigo: "bg-indigo-500/25 text-indigo-100 ring-indigo-400/60",
    cyan: "bg-cyan-400/20 text-cyan-100 ring-cyan-300/60",
    pink: "bg-pink-500/20 text-pink-100 ring-pink-400/60",
    amber: "bg-amber-400/20 text-amber-100 ring-amber-300/60",
  };
  return (
    <button
      title={title}
      onClick={onClick}
      className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        active ? `${tones[tone]} ring-1` : "text-white/55 hover:bg-white/8 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export const Group = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1">
    <span className="px-1 text-[10px] font-semibold uppercase tracking-widest text-white/35">{label}</span>
    <div className="flex items-center gap-1 rounded-xl bg-black/25 p-1">{children}</div>
  </div>
);
