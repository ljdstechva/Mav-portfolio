const CACHE_PREFIX = "portfolio-assets-";
const CACHE_NAME = "portfolio-assets-v5";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.headers.has("range")) return;

  const destination = request.destination;
  if (destination !== "image") return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Use exact request matching (including query string) so Next image optimizer
      // URLs never cross-map to the wrong asset.
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        if (response && (response.ok || response.type === "opaque")) {
          try {
            await cache.put(request, response.clone());
          } catch {
            // Some browser-managed or optimized image responses cannot be cached.
          }
        }
        return response;
      } catch (error) {
        if (cached) return cached;
        throw error;
      }
    })()
  );
});
