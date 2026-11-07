// ============================================================
// StormCheck — service worker
// Saves the app's files on the phone so it opens with no internet.
// IMPORTANT: change the version number every time you update files,
// so phones download the new version.
// ============================================================

const CACHE_NAME = "stormcheck-v4";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./engine.js",
  "./i18n.js",
  "./official.js",
  "./app.js",
  "./manifest.json",
  "./data/sample-alerts.json",
  "./data/demo-official-alerts.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// Save files when the app is first installed
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

// Delete old versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Try the network first; if it fails (offline), use the saved copy
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Only handle the app's own files. Official NWS data is saved by official.js instead.
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
