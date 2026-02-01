'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [percent, setPercent] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentAction, setCurrentAction] = useState("Initializing...");
  
  // Ref to track if we've already started the exit sequence
  const isExiting = useRef(false);

  useEffect(() => {
    // Lock scroll
    document.body.style.overflow = 'hidden';

    // List of critical assets to manually preload (e.g. Hero image)
    const criticalAssets = [
      '/Hero.png',
      // Add other critical large assets here
    ];

    let imagesLoaded = 0;
    let totalImages = 0;
    
    // Actions for the "terminal" text
    const actions = [
      "Curating visuals...",
      "Aligning pixels...",
      "Rendering aesthetics...",
      "Polishing interface...",
      "Starting experience..."
    ];

    // Helper to update progress
    const updateProgress = () => {
      if (isExiting.current) return;

      const allImages = Array.from(document.images);
      // Filter out standard spacers or tracking pixels if needed, mainly focus on content
      const contentImages = allImages.filter(img => img.src && !img.src.includes('data:image'));
      
      totalImages = contentImages.length + criticalAssets.length;
      setTotalCount(totalImages);
      
      // Count DOM images
      const domLoaded = contentImages.filter(img => img.complete && img.naturalHeight !== 0).length;
      
      // Calculate realistic percentage
      // We give 20% weight to "time/app init" and 80% to assets
      const assetProgress = totalImages > 0 ? (domLoaded + imagesLoaded) / totalImages : 1;
      const targetPercent = Math.min(Math.round(assetProgress * 100), 100);
      
      // Smoothly animate the number up, don't jump
      setPercent(prev => {
        if (prev >= 100) return 100;
        // Move towards target, but at least increment by 1 if behind
        const diff = targetPercent - prev;
        return diff > 0 ? prev + Math.ceil(diff * 0.1) : prev;
      });

      setLoadedCount(domLoaded + imagesLoaded);
      
      // Cycle action text based on percentage
      const actionIndex = Math.min(Math.floor((percent / 100) * actions.length), actions.length - 1);
      setCurrentAction(actions[actionIndex]);
    };

    // Preload critical assets manually
    criticalAssets.forEach(src => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imagesLoaded++;
        updateProgress();
      };
      img.onerror = () => {
        imagesLoaded++; // Count as handled even if failed
        updateProgress();
      };
    });

    // Interval to poll DOM for new images (Next.js hydrates dynamically)
    const interval = setInterval(updateProgress, 100);

    // Safety fallback: Ensure we finish eventually even if assets hang
    const maxTime = setTimeout(() => {
       setPercent(100);
    }, 5000); // 5s max load time

    // Completion check
    const checkCompletion = setInterval(() => {
      if (percent >= 100 || (document.readyState === 'complete' && percent > 90)) {
        // Ensure we hit 100 visual
        setPercent(100);
        setCurrentAction("Welcome");
        
        clearInterval(interval);
        clearInterval(checkCompletion);
        clearTimeout(maxTime);
        
        if (!isExiting.current) {
          isExiting.current = true;
          // Small delay at 100% for satisfaction
          setTimeout(() => {
            setIsLoading(false);
            document.body.style.overflow = '';
          }, 800);
        }
      }
    }, 200);

    return () => {
      clearInterval(interval);
      clearInterval(checkCompletion);
      clearTimeout(maxTime);
      document.body.style.overflow = '';
    };
  }, [percent]);

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-ink flex flex-col items-center justify-between py-12 px-4 md:px-12"
          initial={{ opacity: 1 }}
          exit={{ 
            y: "-100%", 
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
          }}
        >
          {/* Top Bar: Brand */}
          <div className="w-full flex justify-between items-start text-sand/50 uppercase tracking-widest text-xs font-medium">
            <motion.div 
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
            >
              Mav Studio
            </motion.div>
            <motion.div 
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="text-right hidden md:block"
            >
               Portfolio © {new Date().getFullYear()}
            </motion.div>
          </div>

          {/* Center: Percentage & Action */}
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

          {/* Bottom: Progress Bar & Info */}
          <div className="w-full flex flex-col gap-4">
             <div className="flex justify-between items-end text-sand/60 text-xs md:text-sm font-mono mb-2">
                <span>ASSETS LOADED</span>
                <span>[{loadedCount.toString().padStart(2, '0')} / {totalCount.toString().padStart(2, '0')}]</span>
             </div>
             
             <div className="w-full h-[2px] bg-sand/10 relative overflow-hidden">
                <motion.div 
                    className="absolute top-0 left-0 h-full bg-terracotta"
                    initial={{ width: "0%" }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.1, ease: "linear" }}
                />
             </div>
             {/* Decorative glow following the bar */}
             <div className="w-full relative h-px">
                 <motion.div 
                     className="absolute top-[-15px] w-24 h-8 bg-terracotta/40 blur-xl rounded-full"
                     style={{ 
                        left: `${percent}%`, 
                        x: "-50%" 
                     }}
                 />
             </div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
