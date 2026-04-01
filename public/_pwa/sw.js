const CACHE_NAME = 'midinet-cache-v1';
const urlsToCache = [
  '/',
  '/_pwa/style.css',
  '/_pwa/index.html',
  '/_pwa/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Check if request is for the proxied content (root path)
  // We don't want to cache everything from the proxied site to keep it "ephemeral"
  // But we need to serve the shell files offline
  
  const url = new URL(event.request.url);
  
  if (urlsToCache.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  } else {
    // For other requests (mirrored content), fetch normally
    event.respondWith(fetch(event.request));
  }
});
