const CACHE_PREFIX = "portfolio-assets-";
const CACHE_NAME = "portfolio-assets-v2";

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

  const destination = request.destination;
  if (destination !== "image" && destination !== "video") return;

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
          cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        if (cached) return cached;
        throw error;
      }
    })()
  );
});
