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
import Image from "next/image";
import ChromaGrid from "./ChromaGrid";
import FlowingMenu from "./FlowingMenu";
import CircularGallery from "./CircularGallery";
import StarBorder from "./StarBorder";
import { GlobalSpotlight, MagicStyles } from "./MagicBento";

// --- Types ---
type PortfolioCategory = {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
};

type Project = {
  id: string;
  title: string;
  image: string;
  category: string;
};

type Client = {
  id: string;
  name: string;
  description: string;
  logo?: string;
  projects: Project[];
};

type Industry = {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  clients: Client[];
};

// --- Mock Data ---
const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  { 
    id: "graphics", 
    name: "Graphic Designs", 
    icon: Palette, 
    description: "Brand identity, logos, and marketing materials.", 
    color: "bg-purple-100 text-purple-600" 
  },
  { 
    id: "carousels", 
    name: "Carousels", 
    icon: Layers, 
    description: "Engaging scrollable social media content.", 
    color: "bg-blue-100 text-blue-600" 
  },
  { 
    id: "videos", 
    name: "Videos", 
    icon: Video, 
    description: "Motion graphics and video editing.", 
    color: "bg-red-100 text-red-600" 
  },
  { 
    id: "copywriting", 
    name: "Copywriting", 
    icon: FileText, 
    description: "Compelling copy for brands and campaigns.", 
    color: "bg-green-100 text-green-600" 
  },
  { 
    id: "photo-editing", 
    name: "Photo Editing", 
    icon: Aperture, 
    description: "Professional retouching and color grading.", 
    color: "bg-orange-100 text-orange-600" 
  },
];

const INDUSTRIES: Industry[] = [
  {
    id: "beauty",
    name: "Beauty & Wellness",
    icon: Sparkles,
    color: "bg-pink-100 text-pink-600",
    clients: [
      {
        id: "glow-cosmetics",
        name: "Glow Cosmetics",
        description: "Organic skincare brand focusing on natural radiance.",
        projects: [
          { id: "p1", title: "Social Media Campaign", image: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop", category: "Social Media" },
          { id: "p2", title: "Product Packaging", image: "https://images.unsplash.com/photo-1556228720-1957be982260?q=80&w=600&auto=format&fit=crop", category: "Packaging" },
          { id: "p3", title: "Website Redesign", image: "https://images.unsplash.com/photo-1596462502278-27bfdd403cc2?q=80&w=600&auto=format&fit=crop", category: "Web Design" },
        ]
      },
      {
        id: "serene-spa",
        name: "Serene Spa",
        description: "Luxury spa and wellness center.",
        projects: [
          { id: "p4", title: "Brand Identity", image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=600&auto=format&fit=crop", category: "Branding" },
          { id: "p5", title: "Brochure Design", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&auto=format&fit=crop", category: "Print" },
        ]
      }
    ]
  },
  {
    id: "healthcare",
    name: "Healthcare",
    icon: Heart,
    color: "bg-blue-100 text-blue-600",
    clients: [
      {
        id: "med-plus",
        name: "MedPlus Clinics",
        description: "Modern family health clinics.",
        projects: [
          { id: "p6", title: "App Interface", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop", category: "UI/UX" },
          { id: "p7", title: "Informational Posters", image: "https://images.unsplash.com/photo-1584036561566-b93a945cd3e5?q=80&w=600&auto=format&fit=crop", category: "Print" },
        ]
      }
    ]
  },
  {
    id: "tech",
    name: "Technology",
    icon: Cpu,
    color: "bg-indigo-100 text-indigo-600",
    clients: [
      {
        id: "next-gen",
        name: "NextGen Systems",
        description: "AI software solutions.",
        projects: [
          { id: "p8", title: "Dashboard UI", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop", category: "UI/UX" },
        ]
      }
    ]
  },
  {
    id: "food",
    name: "Food & Beverage",
    icon: Utensils,
    color: "bg-orange-100 text-orange-600",
    clients: [
      {
        id: "bistro",
        name: "The Urban Bistro",
        description: "Farm-to-table dining experience.",
        projects: [
          { id: "p9", title: "Menu Design", image: "https://images.unsplash.com/photo-1514362545857-3bc16549766b?q=80&w=600&auto=format&fit=crop", category: "Print" },
        ]
      }
    ]
  },
  {
    id: "retail",
    name: "Retail",
    icon: ShoppingBag,
    color: "bg-emerald-100 text-emerald-600",
    clients: []
  },
  {
    id: "realestate",
    name: "Real Estate",
    icon: Building2,
    color: "bg-slate-100 text-slate-600",
    clients: []
  },
];

export function Portfolio() {
  const [selectedCategory, setSelectedCategory] = useState<PortfolioCategory | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const goBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedIndustry(null);
    setSelectedClient(null);
  };

  const goBackToIndustries = () => {
    setSelectedClient(null);
    setSelectedIndustry(null);
  };

  const goBackToClients = () => {
    setSelectedClient(null);
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
                  <span className={clsx("cursor-pointer hover:text-ink", !selectedClient && "font-bold text-ink")} onClick={goBackToClients}>{selectedIndustry.name}</span>
                </>
             )}
             {selectedClient && (
                <>
                  <span>/</span>
                  <span className="font-bold text-ink">{selectedClient.name}</span>
                </>
             )}
           </motion.div>
           
           <motion.h2 layout className="text-4xl md:text-5xl font-bold text-ink mb-4">
              {selectedClient 
                ? selectedClient.name 
                : selectedIndustry 
                  ? selectedIndustry.name 
                  : selectedCategory 
                    ? selectedCategory.name 
                    : "Portfolio"}
           </motion.h2>
           
           <motion.p layout className="text-lg text-ink/60 max-w-2xl">
              {selectedClient 
                ? selectedClient.description 
                : selectedIndustry 
                  ? "Explore the clients I've worked with in this sector." 
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

          {selectedCategory?.id === 'graphics' && selectedIndustry && !selectedClient && (
            <ClientList 
              key="clients" 
              industry={selectedIndustry} 
              onSelect={setSelectedClient} 
              onBack={goBackToIndustries}
            />
          )}

          {selectedCategory?.id === 'graphics' && selectedClient && (
            <ProjectShowcase 
              key="projects" 
              client={selectedClient} 
              onBack={goBackToClients}
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
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <MagicStyles />
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
         <ArrowLeft size={20} /> Back to Categories
      </button>

      <GlobalSpotlight gridRef={gridRef} />
      <div 
        ref={gridRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {INDUSTRIES.map((industry, index) => (
          <StarBorder
            as="button"
            key={industry.id}
            onClick={() => onSelect(industry)}
            className="w-full h-full"
            innerClassName="group relative p-8 bg-sand/30 hover:bg-white text-left transition-all hover:shadow-xl overflow-hidden cursor-pointer w-full h-full flex flex-col items-start justify-start"
            color="rgb(255, 0, 128)"
            speed="5s"
          >
             <div className={clsx("relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-2xl transition-colors", industry.color)}>
                <industry.icon size={28} />
             </div>
             
             <h3 className="relative z-10 text-2xl font-bold text-ink mb-2">{industry.name}</h3>
             <p className="relative z-10 text-ink/60 mb-6">{industry.clients.length} Clients</p>
             
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

function ClientList({ industry, onSelect, onBack }: { industry: Industry, onSelect: (c: Client) => void, onBack: () => void }) {
  const menuItems = industry.clients.map((client) => ({
    link: "#",
    text: client.name,
    image: client.projects[0]?.image ?? client.logo ?? "/images/About.png",
  }));
  const itemHeight = 100;
  const menuHeight = menuItems.length * itemHeight;
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{ image: string; text: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const selectedIndexRef = useRef<number>(0);

  const galleryItems = useMemo(
    () =>
      activeClient?.projects.map((project) => ({
        image: project.image,
        text: project.title,
      })) ??
      [],
    [activeClient]
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

       {industry.clients.length === 0 ? (
          <div className="text-center py-20 bg-sand/30 rounded-3xl">
            <p className="text-xl text-ink/50 mb-6">No clients added to this category yet.</p>
          </div>
       ) : (
        <>
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
                 const selected = industry.clients.find((client) => client.name === item.text);
                 if (selected) {
                   setActiveClient(selected);
                 }
               }}
             />
           </div>

           <AnimatePresence>
             {activeClient && (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 20 }}
                 transition={{ duration: 0.4, ease: "easeOut" }}
                 className="mt-10 rounded-[28px] border border-ink/10 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(6,0,16,0.25)]"
               >
                 <div className="flex flex-wrap items-center justify-between gap-4">
                   <div>
                     <h3 className="text-2xl font-bold text-ink">{activeClient.name}</h3>
                     <p className="text-sm text-ink/60">{activeClient.description}</p>
                   </div>
                   <div className="text-xs uppercase tracking-[0.25em] text-ink/50">
                     {galleryItems.length} pieces
                   </div>
                 </div>

                  <div className="mt-6 h-[360px] md:h-[440px] overflow-hidden rounded-[24px] border border-ink/10 bg-sand/60">
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
                        No project images yet.
                      </div>
                    )}
                  </div>
               </motion.div>
             )}
           </AnimatePresence>

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
                   className="group relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
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
                     style={{ aspectRatio: "4 / 5" }}
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
                         <Image
                           src={selectedMedia.image}
                           alt={selectedMedia.text}
                           fill
                           sizes="(max-width: 768px) 100vw, 80vw"
                           className="object-contain"
                         />
                       </motion.div>
                     </AnimatePresence>
                   </div>
                 </motion.div>
               </motion.div>
             )}
           </AnimatePresence>
        </>
       )}
    </motion.div>
  );
}

function ProjectShowcase({ client, onBack }: { client: Client, onBack: () => void }) {
  const items = client.projects.map(p => ({
    id: p.id,
    image: p.image,
    title: p.title,
    category: p.category
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
         <ArrowLeft size={20} /> Back to Clients
      </button>

      <ChromaGrid items={items} />
    </motion.div>
  );
}
