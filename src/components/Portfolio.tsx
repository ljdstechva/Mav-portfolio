"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
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
  Aperture,
  X
} from "lucide-react";
import clsx from "clsx";
import ChromaGrid from "./ChromaGrid";
import { MenuItem } from "./FlowingMenu";
import GalleryCarousel from "./GalleryCarousel";
import Carousel, { CarouselItemData } from "./Carousel";
import StarBorder from "./StarBorder";
import { GlobalSpotlight, MagicStyles } from "./MagicBento";
import { PORTFOLIO_CATEGORIES, PortfolioCategory } from "@/data/portfolioData";

type PortfolioProject = {
  id: string;
  image: string;
  title: string;
  body?: string;
  clientName: string;
  clientOrder: number;
};

type PortfolioIndustry = {
  id: string;
  name: string;
  projects: PortfolioProject[];
};

type CarouselClient = {
  clientName: string;
  items: CarouselItemData[];
};

type ReelItem = {
  id: string;
  video_url: string;
  sort_order?: number | null;
};

type PhotoEditingItem = {
  id: string;
  title: string;
  before_image_url: string;
  after_image_url: string;
};

type GalleryItem = {
  image: string;
  text: string;
  fullImage?: string;
};

const getPreviewImageUrl = (rawUrl: string) => {
  if (!rawUrl || rawUrl.startsWith("/") || rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) {
    return rawUrl;
  }
  const encoded = encodeURIComponent(rawUrl);
  return `/_next/image?url=${encoded}&w=828&q=70`;
};

const getCanvaEmbedUrl = (rawUrl: string) => {
  try {
    const url = new URL(rawUrl);
    if (!url.hostname.endsWith("canva.com")) return null;
    if (!url.pathname.includes("/design/")) return null;
    url.searchParams.set("embed", "1");
    return url.toString();
  } catch {
    return null;
  }
};

export function Portfolio() {
  const [selectedCategory, setSelectedCategory] = useState<PortfolioCategory | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<PortfolioIndustry | null>(null);
  const [industries, setIndustries] = useState<PortfolioIndustry[]>([]);
  const [carouselClients, setCarouselClients] = useState<CarouselClient[]>([]);
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [stories, setStories] = useState<ReelItem[]>([]);
  const [photoEditing, setPhotoEditing] = useState<PhotoEditingItem[]>([]);
  const [copywritingIndustry, setCopywritingIndustry] = useState<PortfolioIndustry | null>(null);
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const [industriesError, setIndustriesError] = useState<string | null>(null);

  const goBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedIndustry(null);
  };

  const toggleIndustry = (industry: PortfolioIndustry) => {
    if (selectedIndustry?.id === industry.id) {
      setSelectedIndustry(null);
    } else {
      setSelectedIndustry(industry);
    }
  };

  useEffect(() => {
    let active = true;

    const loadIndustries = async () => {
      try {
        setIndustriesLoading(true);
        setIndustriesError(null);
        const response = await fetch("/api/portfolio-graphics", { cache: "no-store" });
        if (!response.ok) {
          let message = "Failed to load portfolio";
          try {
            const payload = await response.json();
            if (payload?.message) message = payload.message;
          } catch (error) {
            // ignore json parse errors
          }
          throw new Error(message);
        }

        const data = await response.json();
        const rawIndustries = (data.industries ?? []) as { id: string; name: string }[];
        const rawClients = (data.clients ?? []) as {
          id: string;
          industry_id: string;
          name: string;
          image_url?: string | null;
          sort_order?: number | null;
          created_at?: string | null;
        }[];
        const rawCarousels = (data.carousels ?? []) as {
          id: string;
          client: string;
          image_url: string;
          position: number;
          created_at: string;
        }[];
        const rawReels = (data.reels ?? []) as {
          id: string;
          client?: string;
          video_url: string;
          sort_order?: number | null;
          created_at?: string;
        }[];
        const rawStories = (data.stories ?? []) as Record<string, unknown>[];
        const rawPhotoEditing = (data.photoEditing ?? []) as {
          id: string;
          client: string;
          title: string;
          before_image_url: string;
          after_image_url: string;
          created_at: string;
        }[];
        const rawCopywriting = (data.copywriting ?? []) as {
          id: string;
          client?: string;
          title?: string;
          body?: string;
          image_url?: string;
          created_at?: string;
        }[];

        // Process Graphics
        const byIndustry = rawIndustries.map((industry) => {
          const clientsForIndustry = rawClients
            .filter((client) => client.industry_id === industry.id && client.image_url)
            .sort((a, b) => {
              const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return dateA - dateB;
            });

          const clientOrderMap = new Map<string, number>();
          clientsForIndustry.forEach((client) => {
            const key = client.name || "Untitled";
            if (!clientOrderMap.has(key)) {
              clientOrderMap.set(key, clientOrderMap.size);
            }
          });

          const projects = clientsForIndustry.map((client, index) => {
            const clientName = client.name || "Untitled";
            return {
              id: client.id || `${industry.id}-${index}`,
              image: client.image_url as string,
              title: client.name || "",
              clientName,
              clientOrder: clientOrderMap.get(clientName) ?? 0,
            };
          });

          return {
            id: industry.id,
            name: industry.name,
            projects,
          } satisfies PortfolioIndustry;
        });

        // Process Carousels
        const carouselMap = new Map<string, { position: number; item: CarouselItemData }[]>();
        rawCarousels.forEach((c) => {
          const client = c.client || "Untitled";
          if (!carouselMap.has(client)) carouselMap.set(client, []);
          carouselMap.get(client)!.push({
            position: c.position,
            item: {
              id: c.id,
              image: c.image_url,
              title: client,
            },
          });
        });

        const carousels = Array.from(carouselMap.entries()).map(([clientName, items]) => ({
          clientName,
          items: items.sort((a, b) => a.position - b.position).map((i) => i.item),
        })).sort((a, b) => a.clientName.localeCompare(b.clientName)); // Sort clients alphabetically

        // Process Reels
        const reelsData = rawReels.map(r => ({
          id: r.id,
          video_url: r.video_url,
          sort_order: r.sort_order ?? null,
        }));

        const storiesData = rawStories.map((story, index) => {
          const id = typeof story.id === "string" ? story.id : `story-${index}`;
          const title =
            (typeof story.title === "string" && story.title) ||
            (typeof story.client === "string" && story.client) ||
            (typeof story.name === "string" && story.name) ||
            "Untitled Story";
          const videoUrl =
            (typeof story.video_url === "string" && story.video_url) ||
            (typeof story.story_url === "string" && story.story_url) ||
            (typeof story.media_url === "string" && story.media_url) ||
            (typeof story.url === "string" && story.url) ||
            "";
          return {
            id,
            title,
            video_url: videoUrl,
          };
        });

        // Process Photo Editing
        const photoEditingData = rawPhotoEditing.map(p => ({
          id: p.id,
          title: p.title || p.client || "",
          before_image_url: p.before_image_url,
          after_image_url: p.after_image_url
        }));

        const copywritingProjects = rawCopywriting
          .map((item, index) => ({
            id: item.id,
            image: item.image_url || "/images/About.png", // Use a placeholder if image is missing
            title: item.title || item.client || "",
            body: item.body || undefined,
            clientName: item.client || "Client",
            clientOrder: index,
          }));

        const copyIndustryData: PortfolioIndustry = {
          id: "copywriting",
          name: "Copywriting",
          projects: copywritingProjects,
        };

        if (active) {
          setIndustries(byIndustry);
          setCarouselClients(carousels);
          setReels(reelsData);
          setStories(storiesData);
          setPhotoEditing(photoEditingData);
          setCopywritingIndustry(copyIndustryData);
        }
      } catch (error) {
        if (active) {
          setIndustriesError(error instanceof Error ? error.message : "Failed to load portfolio");
        }
      } finally {
        if (active) {
          setIndustriesLoading(false);
        }
      }
    };

    loadIndustries();

    return () => {
      active = false;
    };
  }, []);

  const { ref: contentRef, height } = useContentHeight();

  return (
    <section
      className="py-20 px-4 md:px-8 bg-white"
      id="portfolio"
    >
      <div className="container mx-auto">
        <div className="mb-12">
          {/* Breadcrumbs / Header */}
          <motion.div layout className="flex items-center gap-2 mb-4 text-sm text-ink/50">
            <span className={clsx("cursor-pointer hover:text-ink", !selectedCategory && "font-bold text-ink")} onClick={goBackToCategories}>Portfolio</span>

            {selectedCategory && (
              <>
                <span>/</span>
                <span
                  className={clsx("cursor-pointer hover:text-ink", "font-bold text-ink")}
                  onClick={selectedCategory.id === 'graphics' ? () => setSelectedIndustry(null) : undefined}
                >
                  {selectedCategory.name}
                </span>
              </>
            )}
          </motion.div>

          <motion.h2 layout className="text-4xl md:text-5xl font-bold text-ink mb-4">
            {selectedCategory
              ? selectedCategory.name
              : "Portfolio"}
          </motion.h2>

          <motion.p layout className="text-lg text-ink/60 max-w-2xl">
            {selectedCategory
              ? selectedCategory.description
              : "Explore my creative work across different disciplines."}
          </motion.p>
        </div>

        <motion.div
          animate={{ height }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="relative overflow-hidden"
        >
          <div ref={contentRef}>
            <AnimatePresence mode="popLayout" initial={false}>
              {!selectedCategory && (
                <motion.div
                  className="w-full"
                  key="categories"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <CategoryGrid
                    onSelect={setSelectedCategory}
                  />
                </motion.div>
              )}

              {selectedCategory?.id === 'graphics' && (
                <motion.div
                  className="w-full"
                  key="industries-list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <IndustryList
                    selectedIndustry={selectedIndustry}
                    onSelect={toggleIndustry}
                    onBack={goBackToCategories}
                    industries={industries}
                    loading={industriesLoading}
                    error={industriesError}
                  />
                </motion.div>
              )}

              {selectedCategory?.id === 'carousels' && (
                <motion.div
                  className="w-full"
                  key="carousels-list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <CarouselList
                    clients={carouselClients}
                    onBack={goBackToCategories}
                    loading={industriesLoading}
                  />
                </motion.div>
              )}

              {selectedCategory?.id === 'videos' && (
                <motion.div
                  className="w-full"
                  key="reels-list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ReelsList
                    reels={reels}
                    onBack={goBackToCategories}
                    loading={industriesLoading}
                  />
                </motion.div>
              )}

              {selectedCategory?.id === 'stories' && (
                <motion.div
                  className="w-full"
                  key="stories-list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ReelsList
                    reels={stories}
                    onBack={goBackToCategories}
                    loading={industriesLoading}
                    autoplay
                  />
                </motion.div>
              )}

              {selectedCategory?.id === 'photo-editing' && (
                <motion.div
                  className="w-full"
                  key="photo-editing-list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <PhotoEditingList
                    items={photoEditing}
                    onBack={goBackToCategories}
                    loading={industriesLoading}
                  />
                </motion.div>
              )}

              {selectedCategory?.id === 'copywriting' && copywritingIndustry && (
                <motion.div
                  className="w-full"
                  key="copywriting-list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="relative rounded-[28px] overflow-hidden bg-white flex flex-col">
                    <CopywritingGallery
                      industry={copywritingIndustry}
                      onBack={goBackToCategories}
                    />
                  </div>
                </motion.div>
              )}

              {/* Placeholders for other categories */}
              {selectedCategory && selectedCategory.id !== 'graphics' && selectedCategory.id !== 'carousels' && selectedCategory.id !== 'videos' && selectedCategory.id !== 'stories' && selectedCategory.id !== 'copywriting' && selectedCategory.id !== 'photo-editing' && (
                <motion.div
                  className="w-full"
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
                      I&apos;m currently curating my best {selectedCategory.name.toLowerCase()} work for this section. Check back soon!
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PhotoEditingList({
  items,
  onBack,
  loading
}: {
  items: PhotoEditingItem[];
  onBack: () => void;
  loading: boolean;
}) {
  const [selectedItem, setSelectedItem] = useState<PhotoEditingItem | null>(null);

  if (loading) return <div className="text-ink/50">Loading photo edits...</div>;

  return (
    <div className="w-full">
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
        <ArrowLeft size={20} /> Back to Categories
      </button>

      {items.length === 0 ? (
        <div className="p-8 text-center text-ink/50 bg-sand/20 rounded-3xl">No photo editing samples available yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-ink/5 hover:shadow-lg transition-all"
            >
              {item.title && <h3 className="text-xl font-bold text-ink mb-4">{item.title}</h3>}
              <div
                className="flex gap-4 h-64 md:h-80 cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-ink/40">Before</span>
                  <div className="relative flex-1 rounded-xl overflow-hidden bg-sand/20 group">
                    <img
                      src={item.before_image_url}
                      alt="Before"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-ink/40">After</span>
                  <div className="relative flex-1 rounded-xl overflow-hidden bg-sand/20 group">
                    <img
                      src={item.after_image_url}
                      alt="After"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-6xl flex flex-col items-center"
            >
              <div className="w-full flex items-center justify-between mb-6 text-white">
                {selectedItem.title && <h3 className="text-2xl font-bold">{selectedItem.title}</h3>}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors ml-auto"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="relative flex flex-col md:flex-row gap-8 md:gap-16 w-full h-[70vh]">
                <div className="flex-1 flex flex-col gap-2 relative">
                  <span className="absolute top-4 left-4 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">Before</span>
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-black/50">
                    <img
                      src={selectedItem.before_image_url}
                      alt="Before"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div className="flex md:hidden items-center justify-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 border border-white/20 text-white shadow-lg">
                    <ArrowRight size={22} className="rotate-90" />
                  </div>
                </div>
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center w-14 h-14 rounded-full bg-white/10 border border-white/20 text-white shadow-lg backdrop-blur-md">
                  <ArrowRight size={24} />
                </div>
                <div className="flex-1 flex flex-col gap-2 relative">
                  <span className="absolute top-4 left-4 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">After</span>
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-black/50">
                    <img
                      src={selectedItem.after_image_url}
                      alt="After"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReelsList({
  reels,
  onBack,
  loading,
  autoplay = false
}: {
  reels: ReelItem[];
  onBack: () => void;
  loading: boolean;
  autoplay?: boolean;
}) {
  const [visibleCount, setVisibleCount] = useState(3);
  const prevCountRef = useRef(3);

  useEffect(() => {
    const prevCount = prevCountRef.current;

    if (visibleCount > prevCount) {
      // Show More was clicked
      const timer = setTimeout(() => {
        const card = document.querySelector(".reel-card") as HTMLElement | null;
        if (card) {
          const step = card.offsetHeight + 24; // Height + gap
          window.scrollBy({ top: step, behavior: "smooth" });
        }
      }, 500);
      return () => clearTimeout(timer);
    } else if (visibleCount < prevCount) {
      // Show Less was clicked
      const portfolioSection = document.getElementById("portfolio");
      if (portfolioSection) {
        portfolioSection.scrollIntoView({ behavior: "smooth" });
      }
    }

    prevCountRef.current = visibleCount;
  }, [visibleCount]);

  const showMore = () => setVisibleCount(prev => prev + 3);
  const showLess = () => setVisibleCount(3);

  if (loading) return <div className="text-ink/50">Loading reels...</div>;

  const visibleReels = reels.slice(0, visibleCount);
  const hasMore = reels.length > visibleCount;
  const showLessButton = visibleCount > 3 && visibleCount >= reels.length;

  return (
    <div className="w-full">
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
        <ArrowLeft size={20} /> Back to Categories
      </button>

      {reels.length === 0 ? (
        <div className="p-8 text-center text-ink/50 bg-sand/20 rounded-3xl">No reels available yet.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleReels.map((reel) => {
              const canvaEmbedUrl = getCanvaEmbedUrl(reel.video_url);
              return (
                <motion.div
                  key={reel.id}
                  className="reel-card bg-black rounded-3xl overflow-hidden aspect-[9/16] relative shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {canvaEmbedUrl ? (
                    <iframe
                      src={canvaEmbedUrl}
                      title="Canva video"
                      className="w-full h-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  ) : (
                    <video
                      src={reel.video_url}
                      controls
                      className="w-full h-full object-cover"
                      playsInline
                      autoPlay={autoplay}
                      muted={autoplay}
                      loop={autoplay}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-12 flex justify-center">
            {hasMore ? (
              <button
                onClick={showMore}
                className="px-8 py-3 bg-ink text-white rounded-full font-medium hover:bg-ink/90 transition-colors"
              >
                Show More
              </button>
            ) : showLessButton ? (
              <button
                onClick={showLess}
                className="px-8 py-3 bg-sand text-ink rounded-full font-medium hover:bg-sand/80 transition-colors"
              >
                Show Less
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function CarouselList({
  clients,
  onBack,
  loading
}: {
  clients: CarouselClient[];
  onBack: () => void;
  loading: boolean;
}) {
  const [selectedClient, setSelectedClient] = useState<CarouselClient | null>(null);
  const [carouselWidth, setCarouselWidth] = useState(300);

  useEffect(() => {
    const handleResize = () => {
      const padding = 32; // Mobile padding
      const verticalPadding = 200; // Title + Button space
      const maxW = 500; // Target max width for desktop

      const availableWidth = window.innerWidth - padding;
      const availableHeight = window.innerHeight - verticalPadding;

      // Calculate max width that fits vertically with 4:5 ratio + 100px controls
      // height = width * 1.25 + 100
      // width = (height - 100) / 1.25
      const maxWidthFromHeight = (availableHeight - 100) / 1.25;

      const finalWidth = Math.min(maxW, availableWidth, maxWidthFromHeight);
      setCarouselWidth(Math.max(280, finalWidth)); // Min width 280
    };

    // Initial calculation
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) return <div className="text-ink/50">Loading carousels...</div>;

  return (
    <div className="w-full">
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
        <ArrowLeft size={20} /> Back to Categories
      </button>

      {clients.length === 0 ? (
        <div className="p-8 text-center text-ink/50 bg-sand/20 rounded-3xl">No carousels available yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <motion.div
              key={client.clientName}
              onClick={() => setSelectedClient(client)}
              className="group relative cursor-pointer bg-white rounded-3xl border border-ink/10 overflow-hidden hover:shadow-xl transition-all"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5 }}
            >
              <div className="aspect-[4/5] bg-sand/20 relative overflow-hidden">
                {client.items[0]?.image ? (
                  <img
                    src={client.items[0].image}
                    alt={client.clientName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-ink/40">No Image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <span className="text-white font-medium flex items-center gap-2">
                    View Carousel <ArrowLeft className="rotate-180" size={16} />
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-ink">{client.clientName}</h3>
                <p className="text-sm text-ink/50 mt-1">{client.items.length} Slides</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedClient && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedClient(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full flex flex-col items-center justify-center"
              style={{ maxWidth: '100%', maxHeight: '100vh' }}
            >
              <div className="mb-4 text-center text-white">
                <h3 className="text-3xl font-bold">{selectedClient.clientName}</h3>
                <p className="opacity-60">{selectedClient.items.length} slides</p>
              </div>

              <div className="relative">
                <Carousel
                  items={selectedClient.items}
                  baseWidth={carouselWidth}
                  autoplay={false}
                  round={false}
                />
              </div>

              <button
                onClick={() => setSelectedClient(null)}
                className="mt-4 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full text-sm font-medium transition-colors"
              >
                Close Carousel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function useContentHeight() {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useEffect(() => {
    if (!ref.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(ref.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return { ref, height };
}

// --- Sub-components ---

function CategoryGrid({ onSelect }: { onSelect: (c: PortfolioCategory) => void }) {
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full">
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
    </div>
  );
}

function IndustryList({
  selectedIndustry,
  onSelect,
  onBack,
  industries,
  loading,
  error,
}: {
  selectedIndustry: PortfolioIndustry | null;
  onSelect: (i: PortfolioIndustry) => void;
  onBack: () => void;
  industries: PortfolioIndustry[];
  loading: boolean;
  error: string | null;
}) {
  const [itemHeight, setItemHeight] = useState(100);

  useEffect(() => {
    const updateHeight = () => {
      // 70px for mobile, 100px for desktop
      setItemHeight(window.innerWidth < 768 ? 70 : 100);
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <div className="w-full">
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
        <ArrowLeft size={20} /> Back to Categories
      </button>

      <div className="relative rounded-[28px] border border-ink/10 overflow-hidden bg-white shadow-[0_25px_80px_-45px_rgba(6,0,16,0.25)] flex flex-col">
        {loading && (
          <div className="p-6 text-sm text-ink/50">Loading industries...</div>
        )}
        {error && !loading && (
          <div className="p-6 text-sm text-red-500">{error}</div>
        )}
        {!loading && !error && industries.length === 0 && (
          <div className="p-6 text-sm text-ink/50">No industries available yet.</div>
        )}
        {!loading && !error && industries.map((industry, index) => {
          const isSelected = selectedIndustry?.id === industry.id;
          return (
            <div key={industry.id} className="flex flex-col">
              <MenuItem
                link="#"
                text={industry.name}
                image={industry.projects[0]?.image ?? "/images/About.png"}
                speed={14}
                textColor="#b08968"
                marqueeBgColor="#7a563b"
                marqueeTextColor="#ffffff"
                borderColor="rgba(0,0,0,0.1)"
                itemHeight={itemHeight}
                isFirst={index === 0}
                onItemClick={() => onSelect(industry)}
              />
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden bg-sand/10"
                  >
                    <IndustryGallery
                      industry={industry}
                      // We don't need onBack here anymore as toggling closes it
                      onBack={() => onSelect(industry)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CopywritingGallery({ industry, onBack }: { industry: PortfolioIndustry, onBack: () => void }) {
  const [selectedImage, setSelectedImage] = useState<{ image: string } | null>(null);

  return (
    <div className="w-full">
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
        <ArrowLeft size={20} /> Back to Categories
      </button>

      {industry.projects.length === 0 ? (
        <div className="p-8 text-center text-ink/50 bg-sand/20 rounded-3xl">No copywriting samples available yet.</div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {industry.projects.map((project) => (
            <div
              key={project.id}
              className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => setSelectedImage({ image: project.image })}
            >
              <img
                src={project.image}
                alt={project.title || "Copywriting sample"}
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full bg-sand/20 relative">
                <img
                  src={selectedImage.image}
                  alt="Copywriting sample"
                  className="w-full h-full max-h-[85vh] object-contain p-4"
                />
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-white/50 hover:bg-white text-ink p-2 rounded-full transition-colors z-10"
              >
                <ArrowLeft className="rotate-180" size={24} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IndustryGallery({ industry, onBack }: { industry: PortfolioIndustry, onBack: () => void }) {
  const [selectedMedia, setSelectedMedia] = useState<{ image: string; text: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const selectedIndexRef = useRef<number>(0);

  const galleries = useMemo(
    () =>
      industry.projects.reduce((acc, project) => {
        const key = project.clientName || "Untitled";
        if (!acc.has(key)) acc.set(key, { order: project.clientOrder, items: [] as GalleryItem[] });
        acc.get(key)!.items.push({ image: project.image, text: project.title ?? "" });
        return acc;
      }, new Map<string, { order: number; items: GalleryItem[] }>()),
    [industry]
  );

  const galleryList = useMemo(
    () =>
      Array.from(galleries.entries())
        .map(([clientName, value]) => ({ clientName, items: value.items, order: value.order }))
        .sort((a, b) => a.order - b.order),
    [galleries]
  );

  useEffect(() => {
    if (selectedIndex !== null) {
      selectedIndexRef.current = selectedIndex;
    }
  }, [selectedIndex]);

  const getCurrentIndex = () => {
    if (selectedIndex !== null) return selectedIndex;
    if (selectedMedia) {
      const index = galleryList
        .flatMap((gallery) => gallery.items)
        .findIndex((item: GalleryItem) => item.image === selectedMedia.image);
      if (index >= 0) return index;
    }
    return selectedIndexRef.current;
  };

  const showNext = (direction: 1 | -1) => {
    const allItems = galleryList.flatMap((gallery) => gallery.items);
    if (allItems.length === 0) return;
    const currentIndex = getCurrentIndex();
    const nextIndex = (currentIndex + direction + allItems.length) % allItems.length;
    selectedIndexRef.current = nextIndex;
    setSelectedIndex(nextIndex);
    setSelectedMedia(allItems[nextIndex]);
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
  }, [selectedMedia, selectedIndex, galleryList]);

  return (
    <div className="w-full p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-ink">{industry.name} Gallery</h3>
          <p className="text-sm text-ink/60">Showcasing selected works from {industry.name}</p>
        </div>
        <div className="text-xs uppercase tracking-[0.25em] text-ink/50">
          {galleryList.reduce((count, gallery) => count + gallery.items.length, 0)} pieces
        </div>
      </div>
      {galleryList.length > 0 ? (
        <div className="space-y-8">
          {galleryList.map((gallery) => (
            <div key={gallery.clientName} className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-ink">{gallery.clientName}</h4>
                <span className="text-xs uppercase tracking-[0.2em] text-ink/50">
                  {gallery.items.length} images
                </span>
              </div>
              <div className="h-[320px] md:h-[420px] overflow-hidden rounded-[24px] border border-ink/10 bg-sand/60 flex items-center justify-center">
                <GalleryCarousel
                  items={gallery.items.map((item) => ({
                    ...item,
                    image: item.image,
                    fullImage: item.image
                  }))}
                  onItemClick={(item: GalleryItem, index: number) => {
                    if (gallery.items.length === 0) return;
                    setSelectedMedia({
                      image: item.fullImage ?? item.image,
                      text: item.text
                    });
                    const offset = galleryList
                      .slice(0, galleryList.findIndex((g) => g.clientName === gallery.clientName))
                      .reduce((count, g) => count + g.items.length, 0);
                    const total = galleryList.reduce((count, g) => count + g.items.length, 0);
                    const nextIndex = (offset + index) % Math.max(total, 1);
                    selectedIndexRef.current = nextIndex;
                    setSelectedIndex(nextIndex);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-[320px] items-center justify-center text-sm text-ink/60 rounded-[24px] border border-ink/10 bg-sand/60">
          No images available.
        </div>
      )}

      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onPointerUp={(event) => {
              event.stopPropagation();
              setSelectedMedia(null);
            }}
          >
            <motion.div
              className="group relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
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
                    <img
                      src={selectedMedia.image}
                      alt={selectedMedia.text}
                      className="h-full w-full object-contain"
                      loading="eager"
                      decoding="async"
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
    </div>
  );
}
