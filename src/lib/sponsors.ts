/** Change this to your Buy Me a Coffee page. */
export const COFFEE_URL = "https://buymeacoffee.com/mplulev";

export interface Sponsor {
  href: string;
  title: string;
  line: string;
}

/**
 * The one sponsor card shown on the welcome screen and in the corner.
 * Swap the link and copy for a real placement (affiliate or direct sponsor).
 * Set VITE_ADSENSE_CLIENT plus VITE_ADSENSE_SLOT_WELCOME and
 * VITE_ADSENSE_SLOT_DOCK to use AdSense in those slots instead.
 */
export const SPONSOR: Sponsor = {
  href: COFFEE_URL,
  title: "Keep the piano free",
  line: "A quiet sponsor keeps the falling notes in the browser.",
};
