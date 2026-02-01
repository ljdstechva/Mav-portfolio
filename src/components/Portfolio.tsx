"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Sparkles, 
  Heart, 
  Cpu, 
  Utensils, 
  ShoppingBag, 
  Building2,
  Palette,
  Layers,
  Video,
  FileText,
  Aperture
} from "lucide-react";
import clsx from "clsx";
import NextImage from "next/image";
import ChromaGrid from "./ChromaGrid";
import FlowingMenu from "./FlowingMenu";
import CircularGallery from "./CircularGallery";
import StarBorder from "./StarBorder";
import { GlobalSpotlight, MagicStyles } from "./MagicBento";
import { PORTFOLIO_CATEGORIES, INDUSTRIES, Industry, PortfolioCategory } from "@/data/portfolioData";

export function Portfolio() {
  const [selectedCategory, setSelectedCategory] = useState<PortfolioCategory | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);

  const goBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedIndustry(null);
  };

  const goBackToIndustries = () => {
    setSelectedIndustry(null);
  };

  return (
    <section className="py-20 px-4 md:px-8 min-h-screen bg-white" id="portfolio">
      <div className="container mx-auto">
        <div className="mb-12">
           {/* Breadcrumbs / Header */}
           <motion.div layout className="flex items-center gap-2 mb-4 text-sm text-ink/50">
             <span className={clsx("cursor-pointer hover:text-ink", !selectedCategory && "font-bold text-ink")} onClick={goBackToCategories}>Portfolio</span>
             
             {selectedCategory && (
                <>
                  <span>/</span>
                  <span 
                    className={clsx("cursor-pointer hover:text-ink", !selectedIndustry && "font-bold text-ink")} 
                    onClick={selectedCategory.id === 'graphics' ? goBackToIndustries : undefined}
                  >
                    {selectedCategory.name}
                  </span>
                </>
             )}

             {selectedIndustry && (
                <>
                  <span>/</span>
                  <span className="font-bold text-ink">{selectedIndustry.name}</span>
                </>
             )}
           </motion.div>
           
           <motion.h2 layout className="text-4xl md:text-5xl font-bold text-ink mb-4">
              {selectedIndustry 
                ? selectedIndustry.name 
                : selectedCategory 
                  ? selectedCategory.name 
                  : "Portfolio"}
           </motion.h2>
           
           <motion.p layout className="text-lg text-ink/60 max-w-2xl">
              {selectedIndustry 
                ? "Explore project gallery."
                : selectedCategory
                  ? selectedCategory.description
                  : "Explore my creative work across different disciplines."}
           </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {!selectedCategory && (
            <CategoryGrid 
              key="categories" 
              onSelect={setSelectedCategory} 
            />
          )}

          {selectedCategory?.id === 'graphics' && !selectedIndustry && (
            <IndustryGrid 
              key="industries" 
              onSelect={setSelectedIndustry} 
              onBack={goBackToCategories}
            />
          )}

          {selectedCategory?.id === 'graphics' && selectedIndustry && (
            <IndustryGallery 
              key="gallery" 
              industry={selectedIndustry} 
              onBack={goBackToIndustries}
            />
          )}

          {/* Placeholders for other categories */}
          {selectedCategory && selectedCategory.id !== 'graphics' && (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <button onClick={goBackToCategories} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
                 <ArrowLeft size={20} /> Back to Categories
              </button>

              <div className="py-20 text-center bg-sand/30 rounded-3xl">
                <div className={clsx("w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl", selectedCategory.color)}>
                  <selectedCategory.icon size={40} />
                </div>
                <h3 className="text-2xl font-bold text-ink mb-2">Coming Soon</h3>
                <p className="text-ink/60 mb-8 max-w-md mx-auto">
                  I'm currently curating my best {selectedCategory.name.toLowerCase()} work for this section. Check back soon!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// --- Sub-components ---

function CategoryGrid({ onSelect }: { onSelect: (c: PortfolioCategory) => void }) {
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <MagicStyles />
      <GlobalSpotlight gridRef={gridRef} />
      <div 
        ref={gridRef} 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {PORTFOLIO_CATEGORIES.map((category, index) => (
          <StarBorder
            as="button"
            key={category.id}
            onClick={() => onSelect(category)}
            className="w-full h-full"
            innerClassName="group relative p-8 bg-sand/30 hover:bg-white text-left transition-all hover:shadow-xl overflow-hidden cursor-pointer w-full h-full flex flex-col items-start justify-start"
            color="rgb(255, 0, 128)" // Pink
            speed="5s"
          >
             <div className={clsx("relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-2xl transition-colors", category.color)}>
                <category.icon size={28} />
             </div>
             
             <h3 className="relative z-10 text-2xl font-bold text-ink mb-2">{category.name}</h3>
             <p className="relative z-10 text-ink/60 mb-6">{category.description}</p>
             
             <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all z-10">
               <div className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center">
                 <ArrowLeft className="rotate-180" size={20} />
               </div>
             </div>
          </StarBorder>
        ))}
      </div>
    </motion.div>
  );
}

function IndustryGrid({ onSelect, onBack }: { onSelect: (i: Industry) => void, onBack: () => void }) {
  const menuItems = INDUSTRIES.map((industry) => ({
    link: "#",
    text: industry.name,
    image: industry.projects[0]?.image ?? "/images/About.png",
  }));
  const itemHeight = 100;
  const menuHeight = menuItems.length * itemHeight;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
         <ArrowLeft size={20} /> Back to Categories
      </button>

      <div
         className="relative rounded-[28px] border border-ink/10 overflow-hidden bg-white shadow-[0_25px_80px_-45px_rgba(6,0,16,0.25)]"
         style={{ height: menuHeight }}
       >
         <FlowingMenu
           items={menuItems}
           speed={14}
           textColor="#1a1511"
           bgColor="#ffffff"
           marqueeBgColor="#0b0b0b"
           marqueeTextColor="#ffffff"
           borderColor="rgba(0,0,0,0.1)"
           itemHeight={itemHeight}
           onItemClick={(item) => {
             const selected = INDUSTRIES.find((ind) => ind.name === item.text);
             if (selected) {
               onSelect(selected);
             }
           }}
         />
       </div>
    </motion.div>
  );
}

function IndustryGallery({ industry, onBack }: { industry: Industry, onBack: () => void }) {
  const [selectedMedia, setSelectedMedia] = useState<{ image: string; text: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const selectedIndexRef = useRef<number>(0);

  const galleryItems = useMemo(
    () =>
      industry.projects.map((project) => ({
        image: project.image,
        text: "", // Removed text
      })) ?? [],
    [industry]
  );

  useEffect(() => {
    if (selectedIndex !== null) {
      selectedIndexRef.current = selectedIndex;
    }
  }, [selectedIndex]);

  const getCurrentIndex = () => {
    if (selectedIndex !== null) return selectedIndex;
    if (selectedMedia) {
      const index = galleryItems.findIndex((item) => item.image === selectedMedia.image);
      if (index >= 0) return index;
    }
    return selectedIndexRef.current;
  };

  const showNext = (direction: 1 | -1) => {
    if (galleryItems.length === 0) return;
    const currentIndex = getCurrentIndex();
    const nextIndex = (currentIndex + direction + galleryItems.length) % galleryItems.length;
    selectedIndexRef.current = nextIndex;
    setSelectedIndex(nextIndex);
    setSelectedMedia(galleryItems[nextIndex]);
  };

  useEffect(() => {
    if (!selectedMedia) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") showNext(1);
      if (event.key === "ArrowLeft") showNext(-1);
      if (event.key === "Escape") setSelectedMedia(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedMedia, selectedIndex, galleryItems.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
       <button onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
         <ArrowLeft size={20} /> Back to Industries
       </button>

       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: 20 }}
         transition={{ duration: 0.4, ease: "easeOut" }}
         className="mt-6 rounded-[28px] border border-ink/10 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(6,0,16,0.25)]"
       >
         <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
           <div>
             <h3 className="text-2xl font-bold text-ink">{industry.name} Gallery</h3>
             <p className="text-sm text-ink/60">Showcasing selected works from {industry.name}</p>
           </div>
           <div className="text-xs uppercase tracking-[0.25em] text-ink/50">
             {galleryItems.length} pieces
           </div>
         </div>

          <div className="h-[360px] md:h-[500px] overflow-hidden rounded-[24px] border border-ink/10 bg-sand/60">
            {galleryItems.length > 0 ? (
              <CircularGallery
                items={galleryItems}
                bend={1}
                borderRadius={0.06}
                scrollSpeed={2}
                scrollEase={0.05}
                textColor="#1f1a15"
                onItemClick={(item, index) => {
                  if (galleryItems.length === 0) return;
                  setSelectedMedia(item);
                  const nextIndex = index % galleryItems.length;
                  selectedIndexRef.current = nextIndex;
                  setSelectedIndex(nextIndex);
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink/60">
                No images available.
              </div>
            )}
          </div>
       </motion.div>

       <AnimatePresence>
         {selectedMedia && (
           <motion.div
             className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={() => setSelectedMedia(null)}
           >
             <motion.div
               className="group relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
               initial={{ scale: 0.96, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.98, opacity: 0 }}
               transition={{ duration: 0.25, ease: "easeOut" }}
               onClick={(event) => event.stopPropagation()}
             >
               <button
                 className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-3 text-ink opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 hover:scale-110 cursor-pointer"
                 onClick={() => showNext(-1)}
                 aria-label="Previous image"
               >
                 <ArrowLeft size={18} />
               </button>
               <button
                 className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-3 text-ink opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 hover:scale-110 cursor-pointer"
                 onClick={() => showNext(1)}
                 aria-label="Next image"
               >
                 <ArrowLeft size={18} className="rotate-180" />
               </button>
               <div
                 className="relative w-full bg-sand"
                 style={{ aspectRatio: "4 / 5" }} // Adjusted aspect ratio for gallery view
                 onTouchStart={(event) => {
                   const touch = event.touches[0];
                   swipeStartX.current = touch.clientX;
                   swipeStartY.current = touch.clientY;
                 }}
                 onTouchEnd={(event) => {
                   if (swipeStartX.current === null || swipeStartY.current === null) return;
                   const touch = event.changedTouches[0];
                   const deltaX = touch.clientX - swipeStartX.current;
                   const deltaY = touch.clientY - swipeStartY.current;
                   swipeStartX.current = null;
                   swipeStartY.current = null;
                   if (Math.abs(deltaX) < 40 || Math.abs(deltaY) > 80) return;
                   showNext(deltaX < 0 ? 1 : -1);
                 }}
               >
                 <AnimatePresence mode="wait" initial={false}>
                   <motion.div
                     key={selectedMedia.image}
                     className="absolute inset-0"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 0.25, ease: "easeOut" }}
                   >
                      <NextImage
                        src={selectedMedia.image}
                        alt={selectedMedia.text}
                        fill
                        sizes="(max-width: 768px) 100vw, 80vw"
                        className="object-contain"
                      />
                   </motion.div>
                 </AnimatePresence>
               </div>
               <div className="bg-white p-4 text-center hidden">
                  <h4 className="text-xl font-bold text-ink">{selectedMedia.text}</h4>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
    </motion.div>
  );
}
