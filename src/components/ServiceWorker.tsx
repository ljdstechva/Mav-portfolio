"use client";

import { useEffect } from "react";

const CACHE_PREFIX = "portfolio-assets-";
const CURRENT_CACHE = "portfolio-assets-v2";
const LEGACY_CACHE = "portfolio-assets-v1";

export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          const hasLegacyCache = keys.includes(LEGACY_CACHE);

          if (hasLegacyCache) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));
          }

          await Promise.all(
            keys
              .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CURRENT_CACHE)
              .map((key) => caches.delete(key))
          );
        }
      } catch {
        // ignore cache cleanup errors
      }

      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        void registration.update();
      } catch {
        // ignore registration errors
      }
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener(
        "load",
        () => {
          void register();
        },
        { once: true }
      );
    }
  }, []);

  return null;
}
