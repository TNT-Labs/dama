const CACHE_NAME = 'dama-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  'https://cdn-icons-png.flaticon.com/512/3233/3233516.png'
];

// Installazione del Service Worker e salvataggio dei file in cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Gestione delle richieste: se offline, usa la cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});