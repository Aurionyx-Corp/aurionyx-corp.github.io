const CACHE_NAME = 'lastudy-v2'; // Обновили версию на v2!
const ASSETS = [
  './',
  './index.html',
  './data.js',
  './stamp.png',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Принудительно активируем новый Service Worker
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key); // Удаляем старый кэш
        })
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).then((response) => {
      const resClone = response.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(e.request, resClone);
      });
      return response;
    }).catch(() => caches.match(e.request))
  );
});
