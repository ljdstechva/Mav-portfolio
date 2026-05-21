"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { setSmoothScrollInstance } from "@/lib/smoothScroll";

export default function SmoothScrolling() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") {
      setSmoothScrollInstance(null);
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setSmoothScrollInstance(null);
      return;
    }

    const isScrollableTarget = (node: EventTarget | null) => {
      let element = node instanceof HTMLElement ? node : null;

      while (element && element !== document.body && element !== document.documentElement) {
        const style = window.getComputedStyle(element);
        const overflowY = style.overflowY;
        const overflowX = style.overflowX;
        const canScrollY = (overflowY === "auto" || overflowY === "scroll") && element.scrollHeight > element.clientHeight;
        const canScrollX = (overflowX === "auto" || overflowX === "scroll") && element.scrollWidth > element.clientWidth;

        if (canScrollY || canScrollX) {
          return true;
        }

        element = element.parentElement;
      }

      return false;
    };

    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      gestureOrientation: "vertical",
      orientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
      prevent: (node) => isScrollableTarget(node),
    });

    setSmoothScrollInstance(lenis);

    return () => {
      setSmoothScrollInstance(null);
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}
