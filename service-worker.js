const CACHE_NAME = 'sigmovil-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './sigmovil.js',
  './sigmovil.css',
  './logo-sigmovil.png',
  './fondo-topo.png',
  './manifest.json',
  './libs/leaflet.js',
  './libs/leaflet.css',
  './libs/shpwrite.js',
  './libs/dxf.min.js',
  './sigmovil/politicas.html',
  './sigmovil/privacidad.html',
  // FontAwesome desde CDN no se cachea aquí, pero puedes copiarla local si lo necesitas.
  // Para PWA estrictamente offline, descarga y guarda tus íconos.
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', function(event) {
  // Limpiar caches viejos si actualizas la versión
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
