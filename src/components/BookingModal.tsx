"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar } from "lucide-react";
import { useState } from "react";

export default function BookingModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);

  // Reset loading state when modal opens - using key prop on iframe instead of effect
  const iframeKey = isOpen ? "open" : "closed";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none"
          >
            <div 
              className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col pointer-events-auto relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-ink/5 bg-sand/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-terracotta/10 text-terracotta rounded-full">
                    <Calendar size={20} />
                  </div>
                  <h3 className="font-bold text-lg text-ink">Book a Consultation</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-ink/5 rounded-full transition-colors text-ink/60 hover:text-ink"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 bg-white relative">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-sand/10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta"></div>
                  </div>
                )}
                <iframe
                  key={iframeKey}
                  src="https://calendly.com/smm-mavenicaann/30min"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  onLoad={() => setLoading(false)}
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
