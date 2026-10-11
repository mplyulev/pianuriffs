import { COFFEE_URL } from "../lib/sponsors";

export function CoffeeButton({ prominent = false }: { prominent?: boolean }) {
  return (
    <a
      href={COFFEE_URL}
      target="_blank"
      rel="noreferrer"
      className={
        prominent
          ? "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-amber-200/20 bg-amber-300/10 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20"
          : "inline-flex items-center gap-1.5 rounded-lg bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-300/20"
      }
      title="Buy me a coffee"
    >
      <Cup />
      {prominent ? "Buy me a coffee" : "Coffee"}
    </a>
  );
}

function Cup() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 8h10a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V10a2 2 0 0 1 2-2z" />
      <path d="M18 9h1.5A2.5 2.5 0 0 1 22 11.5 2.5 2.5 0 0 1 19.5 14H18" />
      <path d="M8 19h6" />
    </svg>
  );
}
