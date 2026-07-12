const CACHE_NAME = "mathemator-v8";
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
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
