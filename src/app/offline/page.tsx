"use client";

/** Service-worker navigation fallback (BRIEF §11) — shown when a page
 * that isn't already cached is requested with zero signal. Fully static,
 * no data dependencies, so it always renders from the SW cache. */
export default function OfflinePage() {
  return (
    <main className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-void px-6 text-center safe-x safe-top safe-bottom">
      <div className="glow-cyan flex size-16 items-center justify-center rounded-full border border-cyan/30 bg-cyan/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-cyan"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>
      <h1 className="font-heading text-2xl">Brak zasięgu</h1>
      <p className="text-sm text-fog">
        Roaming na Malcie potrafi zawodzić. Ostatni znany stan planszy
        zostaje na ekranie, a dowody wyślą się same, gdy sieć wróci.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 rounded-2xl border border-white/10 px-5 py-3 text-sm text-off-white"
      >
        Spróbuj ponownie
      </button>
    </main>
  );
}
