/* Textmask Studio V13.9: fresh HTML and versioned assets, offline fallback. */
const CACHE_NAME = "textmask-studio-v13-9-20261114";
const OFFLINE_FILES = [
  "./", "./index.html",
  "./mobile-ui.css?v=20261114-9",
  "./mobile-ui.js?v=20261114-9",
  "./batch-workspace.css?v=20261114-9",
  "./batch-workspace.js?v=20261114-9",
  "./icon.svg", "./icon-180.png", "./icon-192.png", "./icon-512.png",
  "./manifest.webmanifest"
];
const INDEX_FALLBACK = new URL("./index.html", self.registration.scope).href;
const SCOPE_PATH = new URL(self.registration.scope).pathname;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((name) =>
        name.startsWith("textmask-studio-") && name !== CACHE_NAME
      ).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE_PATH)) return;

  const isDocument = request.mode === "navigate" || /\/index\.html$/.test(url.pathname);
  const isAppAsset = /\.(?:css|js)$/.test(url.pathname);
  event.respondWith((async () => {
    try {
      // Bypass the HTTP disk cache for HTML / JS / CSS on Safari PWA.
      const response = await fetch(request, {
        cache: (isDocument || isAppAsset) ? "no-store" : "default"
      });
      if (response.ok && response.type === "basic") {
        const copy = response.clone();
        const key = isDocument ? INDEX_FALLBACK : request;
        event.waitUntil(caches.open(CACHE_NAME)
          .then((cache) => cache.put(key, copy))
          .catch(() => {}));
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (isDocument) {
        const offline = await caches.match(INDEX_FALLBACK);
        if (offline) return offline;
      }
      return Response.error();
    }
  })());
});
