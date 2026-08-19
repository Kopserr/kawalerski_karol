// Hand-rolled service worker (BRIEF §1, §11 — "next-pwa lub ręczny manifest
// + service worker"). Deliberately small and easy to reason about: cache
// the app shell so the PWA can still *launch* with no signal, network-first
// for navigations with an offline fallback, cache-first for static assets.

const CACHE_NAME = "lfd-shell-v1";
const OFFLINE_URL = "/offline";
const APP_SHELL = ["/", "/gate", "/offline", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache Server Actions / RSC data fetches — they must always hit
  // the network to stay correct, and caching them would serve stale game
  // state.
  if (request.headers.get("Next-Action") || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        () => caches.match(OFFLINE_URL).then((cached) => cached ?? caches.match("/")),
      ),
    );
    return;
  }

  if (["script", "style", "image", "font"].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});
