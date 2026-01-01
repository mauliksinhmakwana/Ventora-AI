const CACHE_NAME = 'ventora-v1';
const ASSETS = [
  './',
  './index.html',
  './vdiv.js',
  './visualizer/vdiv.css'
];

// Install Service Worker
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Fetch Assets
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
