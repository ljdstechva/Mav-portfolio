"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";

const CRITICAL_ASSETS = ["/Hero.png", "/About.png"];
const ACTIONS = [
  "Curating visuals...",
  "Aligning pixels...",
  "Rendering aesthetics...",
  "Polishing interface...",
  "Starting experience...",
];

export default function Preloader() {
  const pathname = usePathname();
  const isLandingRoute = pathname === "/";
  const [isLoading, setIsLoading] = useState(true);
  const [percent, setPercent] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [currentAction, setCurrentAction] = useState("Initializing...");
  const percentRef = useRef(0);
  const isExiting = useRef(false);

  useEffect(() => {
    if (!isLandingRoute) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      const timer = window.setTimeout(() => setIsLoading(false), 0);
      return () => window.clearTimeout(timer);
    }

    document.body.style.overflow = "hidden";

    let handledAssets = 0;
    let completed = false;

    const updateProgress = (targetPercent: number) => {
      if (completed) return;

      setPercent((previous) => {
        if (previous >= 100) return 100;
        const next = Math.min(Math.max(previous + 1, targetPercent), 99);
        percentRef.current = next;
        return next;
      });

      const actionIndex = Math.min(Math.floor((targetPercent / 100) * ACTIONS.length), ACTIONS.length - 1);
      setCurrentAction(ACTIONS[actionIndex]);
    };

    const finish = () => {
      if (completed || isExiting.current) return;
      completed = true;
      isExiting.current = true;
      percentRef.current = 100;
      setPercent(100);
      setCurrentAction("Welcome");

      window.setTimeout(() => {
        setIsLoading(false);
        document.body.style.overflow = "";
      }, 450);
    };

    CRITICAL_ASSETS.forEach((src) => {
      const image = new Image();
      let settled = false;

      const markHandled = () => {
        if (settled || completed) return;
        settled = true;
        handledAssets += 1;
        setLoadedCount(handledAssets);
        updateProgress(Math.round((handledAssets / CRITICAL_ASSETS.length) * 100));

        if (handledAssets >= CRITICAL_ASSETS.length) {
          finish();
        }
      };

      const timeout = window.setTimeout(markHandled, 1600);
      image.onload = () => {
        window.clearTimeout(timeout);
        markHandled();
      };
      image.onerror = () => {
        window.clearTimeout(timeout);
        markHandled();
      };
      image.src = src;
    });

    const progressInterval = window.setInterval(() => {
      updateProgress(Math.min(percentRef.current + 4, 94));
    }, 120);

    const maxTime = window.setTimeout(finish, 2600);

    return () => {
      window.clearInterval(progressInterval);
      window.clearTimeout(maxTime);
      document.body.style.overflow = "";
    };
  }, [isLandingRoute]);

  if (!isLandingRoute) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-ink flex flex-col items-center justify-between py-12 px-4 md:px-12"
          initial={{ opacity: 1 }}
          exit={{
            y: "-100%",
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
          }}
        >
          <div className="w-full flex justify-between items-start text-sand/50 uppercase tracking-widest text-xs font-medium">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              Mav Studio
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-right hidden md:block"
            >
              Portfolio &copy; {new Date().getFullYear()}
            </motion.div>
          </div>

          <div className="flex flex-col items-center justify-center w-full max-w-4xl relative">
            <div className="relative inline-block">
              <motion.h1
                className="text-[20vw] md:text-[180px] leading-none font-display font-medium text-sand italic mix-blend-difference"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {percent}
              </motion.h1>
              <motion.div
                className="absolute top-0 -right-12 md:-right-16 text-terracotta"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Star size={48} strokeWidth={1.5} fill="currentColor" className="opacity-80" />
              </motion.div>
            </div>

            <div className="mt-4 md:mt-8 h-8 overflow-hidden flex flex-col items-center">
              <AnimatePresence mode="popLayout">
                <motion.p
                  key={currentAction}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-sand/70 font-sans text-sm md:text-lg tracking-wide uppercase"
                >
                  {currentAction}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <div className="w-full flex flex-col gap-4">
            <div className="flex justify-between items-end text-sand/60 text-xs md:text-sm font-mono mb-2">
              <span>ASSETS LOADED</span>
              <span>
                [{loadedCount.toString().padStart(2, "0")} / {CRITICAL_ASSETS.length.toString().padStart(2, "0")}]
              </span>
            </div>

            <div className="w-full h-[2px] bg-sand/10 relative overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 h-full bg-terracotta"
                initial={{ width: "0%" }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>
            <div className="w-full relative h-px">
              <motion.div
                className="absolute top-[-15px] w-24 h-8 bg-terracotta/40 blur-xl rounded-full"
                style={{
                  left: `${percent}%`,
                  x: "-50%",
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
