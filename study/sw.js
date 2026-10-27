const CACHE_NAME = 'lastudy-v1';
const ASSETS = [
  './',
  './index.html',
  './data.js',
  './stamp.png',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
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