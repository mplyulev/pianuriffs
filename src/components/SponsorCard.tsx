import { useEffect, useRef } from "react";
import { SPONSOR } from "../lib/sponsors";

type Slot = "welcome" | "dock";

function adsense(slot: Slot) {
  const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
  const id = (slot === "welcome" ? import.meta.env.VITE_ADSENSE_SLOT_WELCOME : import.meta.env.VITE_ADSENSE_SLOT_DOCK) as string | undefined;
  return client && id ? { client, id } : null;
}

export function SponsorCard({ slot, onDismiss }: { slot: Slot; onDismiss?: () => void }) {
  const ad = adsense(slot);
  if (ad) return <AdSense client={ad.client} id={ad.id} slot={slot} onDismiss={onDismiss} />;
  return (
    <div className={slot === "dock" ? "pointer-events-auto relative w-[220px]" : "w-full"}>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-white/10 text-[10px] text-white/50 hover:bg-white/20 hover:text-white"
          aria-label="Hide sponsor"
        >
          ×
        </button>
      )}
      <a
        href={SPONSOR.href}
        target="_blank"
        rel="sponsored noreferrer"
        className={`block rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-white/18 hover:bg-white/[0.07] ${
          slot === "welcome" ? "px-4 py-3.5" : "px-3 py-2.5"
        }`}
      >
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Sponsored</div>
        <div className={`font-semibold text-white/90 ${slot === "welcome" ? "mt-1 text-sm" : "mt-0.5 text-[13px]"}`}>{SPONSOR.title}</div>
        <div className="mt-0.5 text-xs leading-snug text-white/45">{SPONSOR.line}</div>
      </a>
    </div>
  );
}

function AdSense({ client, id, slot, onDismiss }: { client: string; id: string; slot: Slot; onDismiss?: () => void }) {
  const pushed = useRef(false);
  useEffect(() => {
    const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
    if (!document.querySelector(`script[src="${src}"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = src;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
    if (pushed.current) return;
    pushed.current = true;
    const ads = (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ?? [];
    (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle = ads;
    try {
      ads.push({});
    } catch {
      /* script not ready yet */
    }
  }, [client]);

  return (
    <div className={slot === "dock" ? "pointer-events-auto relative w-[220px]" : "w-full"}>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="absolute -right-1 -top-1 z-10 grid h-5 w-5 place-items-center rounded-full bg-black/50 text-[10px] text-white/70" aria-label="Hide sponsor">
          ×
        </button>
      )}
      <ins className="adsbygoogle block overflow-hidden rounded-2xl" style={{ display: "block", minHeight: slot === "welcome" ? 90 : 72 }} data-ad-client={client} data-ad-slot={id} data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}
