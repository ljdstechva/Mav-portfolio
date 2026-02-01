"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface CalendlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export function CalendlyModal({ isOpen, onClose, url }: CalendlyModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
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
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-black/5 rounded-full transition-colors"
              >
                <X size={24} className="text-ink" />
              </button>
              
              <iframe
                src={url}
                width="100%"
                height="100%"
                frameBorder="0"
                title="Select a Date & Time - Calendly"
                className="w-full h-full"
              ></iframe>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
