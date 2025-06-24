// service-worker.js (sin caché)
self.addEventListener("install", event => {
  self.skipWaiting();  // Activación inmediata
});

self.addEventListener("activate", event => {
  event.waitUntil(clients.claim());  // Tomar control inmediato de todas las pestañas
});

self.addEventListener("fetch", event => {
  // Manejar todas las solicitudes directamente desde la red, sin caché
  event.respondWith(fetch(event.request));
});
