"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { startSmoothScroll, stopSmoothScroll } from "@/lib/smoothScroll";

interface CalendlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

function CalendlyFrame({ url }: { url: string }) {
  const [loading, setLoading] = useState(true);
  const [minimumWaitElapsed, setMinimumWaitElapsed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumWaitElapsed(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  const showLoading = loading || !minimumWaitElapsed;

  return (
    <>
      {showLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white text-center text-ink">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-ink/20 border-t-terracotta" />
          <div>
            <p className="font-semibold">Loading scheduler</p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-medium text-sienna hover:text-ink"
            >
              Open scheduler in a new tab
            </a>
          </div>
        </div>
      )}

      <iframe
        src={url}
        width="100%"
        height="100%"
        frameBorder="0"
        title="Book a discovery call - Calendly"
        className="w-full h-full"
        onLoad={() => setLoading(false)}
      />
    </>
  );
}

export function CalendlyModal({ isOpen, onClose, url }: CalendlyModalProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    if (isOpen) {
      stopSmoothScroll();
    } else {
      startSmoothScroll();
    }

    return () => {
      document.body.style.overflow = "unset";
      startSmoothScroll();
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 md:p-8 pointer-events-none"
          >
            <div className="relative w-full max-w-5xl h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
              <button
                type="button"
                aria-label="Close scheduling modal"
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-black/5 rounded-full transition-colors"
              >
                <X size={24} className="text-ink" />
              </button>

              <CalendlyFrame url={url} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
