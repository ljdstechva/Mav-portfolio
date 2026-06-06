"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import fluidCursor from "@/hooks/use-FluidCursor";

const FluidCursor = () => {
  const pathname = usePathname();
  const isLandingRoute = pathname === "/";

  useEffect(() => {
    if (!isLandingRoute) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (reducedMotion || coarsePointer) return;

    return fluidCursor();
  }, [isLandingRoute]);

  if (!isLandingRoute) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 z-2 pointer-events-none opacity-30">
      <canvas id="fluid" className="w-screen h-screen" />
    </div>
  );
};

export default FluidCursor;
