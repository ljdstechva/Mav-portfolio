import type Lenis from "lenis";

type ScrollTarget = "top" | "bottom" | number | string | HTMLElement;

let activeLenis: Lenis | null = null;

export function setSmoothScrollInstance(instance: Lenis | null) {
  activeLenis = instance;
}

export function scrollToTarget(target: ScrollTarget, offset = -24) {
  if (typeof window === "undefined") return;

  if (activeLenis) {
    activeLenis.resize();
    const resolvedTarget = resolveScrollTarget(target, offset);
    activeLenis.scrollTo(resolvedTarget, {
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    return;
  }

  if (target === "top") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (target === "bottom") {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    return;
  }

  if (typeof target === "number") {
    window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    return;
  }

  const element = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (!element) return;

  const top = Math.max(0, element.getBoundingClientRect().top + window.scrollY + offset);
  window.scrollTo({ top, behavior: "smooth" });
}

function resolveScrollTarget(target: ScrollTarget, offset: number): "top" | "bottom" | number {
  if (target === "top" || target === "bottom" || typeof target === "number") {
    return target;
  }

  const element = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (!element) return window.scrollY;

  return Math.max(0, element.getBoundingClientRect().top + window.scrollY + offset);
}

export function stopSmoothScroll() {
  activeLenis?.stop();
}

export function startSmoothScroll() {
  activeLenis?.start();
}
