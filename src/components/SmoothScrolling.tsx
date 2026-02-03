"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScrolling() {
  useEffect(() => {
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
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      prevent: (node) => isScrollableTarget(node),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return null;
}
