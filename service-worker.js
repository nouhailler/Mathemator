const CACHE_NAME = "mathemator-v15";
const RUNTIME_CACHE = "mathemator-runtime-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/src/content.js",
  "/src/styles.css",
  "/src/app.js",
  "/manifest.webmanifest",
  "/assets/icon-192.svg",
  "/assets/icon-512.svg",
  "/data/books.json",
  "/data/daily.json",
  "/data/domains.json",
  "/data/entries.json",
  "/data/exercises.json",
  "/data/formulas.json",
  "/data/glossary.json",
  "/data/mathematicians.json",
  "/data/media.json",
  "/data/modes.json",
  "/data/modules.json",
  "/data/objects.json",
  "/data/places.json",
  "/data/problems.json",
  "/data/quiz.json",
  "/data/quotes.json",
  "/data/theorems.json",
  "/data/timeline.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE).map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Portraits Wikimedia : mise en cache runtime (cache-first) pour l'hors ligne.
  if (url.hostname === "upload.wikimedia.org") {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(event.request).then(
          (cached) =>
            cached ||
            fetch(event.request)
              .then((resp) => {
                if (resp && (resp.ok || resp.type === "opaque")) cache.put(event.request, resp.clone());
                return resp;
              })
              .catch(() => cached)
        )
      )
    );
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
