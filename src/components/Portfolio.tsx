"use client";

import { useMemo, useState, useEffect, useRef, useCallback, type MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ImageOff,
  Pause,
  Play,
  Video,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import clsx from "clsx";
import { gsap } from "gsap";
import GalleryCarousel from "./GalleryCarousel";
import Carousel, { CarouselItemData } from "./Carousel";
import { MediaImage } from "./MediaImage";
import StarBorder from "./StarBorder";
import { GlobalSpotlight, MagicStyles } from "./MagicBento";
import { scrollToTarget, startSmoothScroll, stopSmoothScroll } from "@/lib/smoothScroll";
import {
  applyPortfolioCategoryOrder,
  PORTFOLIO_CATEGORIES,
  type PortfolioCategory,
  type PortfolioCategoryOrderRow,
} from "@/data/portfolioData";

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
  title?: string;
  video_url: string;
  sort_order?: number | null;
};

type PhotoEditingItem = {
  id: string;
  title: string;
  before_image_url: string;
  after_image_url: string;
};

type AiImageItem = {
  id: string;
  title: string;
  description?: string | null;
  image_url: string;
  thumbnail_url?: string | null;
  alt_text?: string | null;
  sort_order?: number | null;
};

type AiVideoItem = {
  id: string;
  title: string;
  description?: string | null;
  video_url: string;
  thumbnail_url?: string | null;
  sort_order?: number | null;
};

type GalleryItem = {
  image: string;
  text: string;
  fullImage?: string;
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

const isKnownBrokenPortfolioVideoUrl = (rawUrl: string) => {
  try {
    const url = new URL(rawUrl);
    return url.hostname.endsWith("my.canva.site") && url.pathname.includes("/_assets/video/");
  } catch {
    return false;
  }
};

const normalizeDbLabel = (value: string | null | undefined, fallback: string) => {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized || fallback;
};

export function Portfolio() {
  const [selectedCategory, setSelectedCategory] = useState<PortfolioCategory | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<PortfolioIndustry | null>(null);
  const [industries, setIndustries] = useState<PortfolioIndustry[]>([]);
  const [carouselClients, setCarouselClients] = useState<CarouselClient[]>([]);
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [stories, setStories] = useState<ReelItem[]>([]);
  const [photoEditing, setPhotoEditing] = useState<PhotoEditingItem[]>([]);
  const [aiImages, setAiImages] = useState<AiImageItem[]>([]);
  const [aiVideos, setAiVideos] = useState<AiVideoItem[]>([]);
  const [portfolioCategories, setPortfolioCategories] = useState<PortfolioCategory[]>(PORTFOLIO_CATEGORIES);
  const [copywritingIndustry, setCopywritingIndustry] = useState<PortfolioIndustry | null>(null);
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const [industriesError, setIndustriesError] = useState<string | null>(null);

  const scrollPortfolioIntoView = useCallback(() => {
    const scrollToPortfolio = () => {
      scrollToTarget("#portfolio", -72);
    };

    window.requestAnimationFrame(scrollToPortfolio);
    window.setTimeout(scrollToPortfolio, 80);
  }, []);

  const selectCategory = (category: PortfolioCategory) => {
    setSelectedCategory(category);
    setSelectedIndustry(null);
  };

  const goBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedIndustry(null);
    scrollPortfolioIntoView();
  };

  useEffect(() => {
    if (selectedCategory) {
      scrollPortfolioIntoView();
    }
  }, [selectedCategory, scrollPortfolioIntoView]);

  const openIndustryModal = useCallback((industry: PortfolioIndustry) => {
    setSelectedIndustry(industry);
  }, []);

  const closeIndustryModal = useCallback(() => {
    setSelectedIndustry(null);
  }, []);

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
          } catch {
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
        const rawAiImages = (data.aiImages ?? []) as {
          id: string;
          title?: string | null;
          description?: string | null;
          image_url?: string | null;
          thumbnail_url?: string | null;
          alt_text?: string | null;
          sort_order?: number | null;
          created_at?: string | null;
        }[];
        const rawAiVideos = (data.aiVideos ?? []) as {
          id: string;
          title?: string | null;
          description?: string | null;
          video_url?: string | null;
          thumbnail_url?: string | null;
          sort_order?: number | null;
          created_at?: string | null;
        }[];
        const rawPortfolioCategoryOrder = (data.portfolioCategoryOrder ?? []) as PortfolioCategoryOrderRow[];

        // Process Graphics
        const byIndustry = rawIndustries.map((industry) => {
          const clientsForIndustry = rawClients
            .filter((client) => client.industry_id === industry.id && client.image_url)
            .sort((a, b) => {
              const orderA = typeof a.sort_order === "number" ? a.sort_order : Number.MAX_SAFE_INTEGER;
              const orderB = typeof b.sort_order === "number" ? b.sort_order : Number.MAX_SAFE_INTEGER;
              if (orderA !== orderB) return orderA - orderB;
              const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return dateA - dateB;
            });

          const clientOrderMap = new Map<string, number>();
          clientsForIndustry.forEach((client) => {
            const key = normalizeDbLabel(client.name, "Untitled");
            if (!clientOrderMap.has(key)) {
              clientOrderMap.set(key, clientOrderMap.size);
            }
          });

          const projects = clientsForIndustry.map((client, index) => {
            const clientName = normalizeDbLabel(client.name, "Untitled");
            return {
              id: client.id || `${industry.id}-${index}`,
              image: client.image_url as string,
              title: clientName,
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
        const reelsData = rawReels
          .filter((r) => r.video_url && !isKnownBrokenPortfolioVideoUrl(r.video_url))
          .map(r => ({
            id: r.id,
            title: r.client || "Reel",
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
            sort_order: typeof story.sort_order === "number" ? story.sort_order : index,
          };
        }).filter((story) => story.video_url);

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

        const aiImageData = rawAiImages
          .filter((item) => Boolean(item.image_url))
          .map((item, index) => ({
            id: item.id,
            title: item.title?.trim() || "AI Image",
            description: item.description ?? null,
            image_url: item.image_url as string,
            thumbnail_url: item.thumbnail_url ?? null,
            alt_text: item.alt_text ?? null,
            sort_order: item.sort_order ?? index,
          }));

        const aiVideoData = rawAiVideos
          .filter((item) => Boolean(item.video_url))
          .map((item, index) => ({
            id: item.id,
            title: item.title?.trim() || "AI Video",
            description: item.description ?? null,
            video_url: item.video_url as string,
            thumbnail_url: item.thumbnail_url ?? null,
            sort_order: item.sort_order ?? index,
          }));

        if (active) {
          setIndustries(byIndustry);
          setCarouselClients(carousels);
          setReels(reelsData);
          setStories(storiesData);
          setPhotoEditing(photoEditingData);
          setAiImages(aiImageData);
          setAiVideos(aiVideoData);
          setPortfolioCategories(applyPortfolioCategoryOrder(PORTFOLIO_CATEGORIES, rawPortfolioCategoryOrder));
          setCopywritingIndustry(copyIndustryData);
        }
      } catch (error) {
        if (active) {
          setIndustries([]);
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
      className="scroll-mt-24 bg-white px-4 py-16 pb-32 md:px-8"
      id="portfolio"
    >
      <div className="container mx-auto">
        <div className={clsx("mb-8", selectedCategory && "pt-8 md:pt-0")}>
          {/* Breadcrumbs / Header */}
          <motion.div layout className="flex items-center gap-2 mb-4 text-sm text-ink/50">
            <button
              type="button"
              className={clsx("no-scale hover:text-ink", !selectedCategory && "font-bold text-ink")}
              onClick={goBackToCategories}
            >
              Portfolio
            </button>

            {selectedCategory && (
              <>
                <span>/</span>
                <button
                  type="button"
                  className={clsx("no-scale hover:text-ink", "font-bold text-ink")}
                  onClick={selectedCategory.id === 'graphics' ? () => setSelectedIndustry(null) : undefined}
                  disabled={selectedCategory.id !== 'graphics'}
                >
                  {selectedCategory.name}
                </button>
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
                    onSelect={selectCategory}
                    categories={portfolioCategories}
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
                    onSelect={openIndustryModal}
                    onCloseModal={closeIndustryModal}
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

              {selectedCategory?.id === 'ai-images' && (
                <motion.div
                  className="w-full"
                  key="ai-images-list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <AiImagesList
                    items={aiImages}
                    onBack={goBackToCategories}
                    loading={industriesLoading}
                  />
                </motion.div>
              )}

              {selectedCategory?.id === 'ai-videos' && (
                <motion.div
                  className="w-full"
                  key="ai-videos-list"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <AiVideosList
                    items={aiVideos}
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
                    emptyLabel="No stories available yet."
                    itemLabel="story"
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
              {selectedCategory && selectedCategory.id !== 'graphics' && selectedCategory.id !== 'carousels' && selectedCategory.id !== 'videos' && selectedCategory.id !== 'ai-images' && selectedCategory.id !== 'ai-videos' && selectedCategory.id !== 'stories' && selectedCategory.id !== 'copywriting' && selectedCategory.id !== 'photo-editing' && (
                <motion.div
                  className="w-full"
                  key="placeholder"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <button type="button" onClick={goBackToCategories} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
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

function AiImagesList({
  items,
  onBack,
  loading,
}: {
  items: AiImageItem[];
  onBack: () => void;
  loading: boolean;
}) {
  if (loading) return <div className="text-ink/50">Loading AI images...</div>;
  if (items.length === 0) {
    return (
      <div className="w-full">
        <button type="button" onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
          <ArrowLeft size={20} /> Back to Categories
        </button>
        <div className="rounded-[28px] border border-ink/10 bg-sand/30 p-10 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-sienna">AI visual portfolio</p>
          <h3 className="text-2xl font-bold text-ink">AI Images are ready for new work</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink/55">
            Published AI image projects from Supabase will appear here automatically after they are uploaded in the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <button type="button" onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
        <ArrowLeft size={20} /> Back to Categories
      </button>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-sienna">AI visual portfolio</p>
          <h3 className="text-2xl font-bold text-ink md:text-3xl">Generated visuals, cleanly presented</h3>
        </div>
        <span className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
          {items.length} image{items.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <figure
            key={item.id}
            className="group overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-sm transition-all hover:border-ink/20 hover:shadow-xl"
          >
            <div className="aspect-[4/5] bg-sand/20">
              <MediaImage
                src={item.thumbnail_url || item.image_url}
                alt={item.alt_text || "AI portfolio image"}
                className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                loading={index < 3 ? "eager" : "lazy"}
                decoding="async"
              />
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}

function AiVideosList({
  items,
  onBack,
  loading,
}: {
  items: AiVideoItem[];
  onBack: () => void;
  loading: boolean;
}) {
  if (loading) return <div className="text-ink/50">Loading AI videos...</div>;
  if (items.length === 0) {
    return (
      <div className="w-full">
        <button type="button" onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
          <ArrowLeft size={20} /> Back to Categories
        </button>
        <div className="rounded-[28px] border border-ink/10 bg-sand/30 p-10 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-sienna">AI motion portfolio</p>
          <h3 className="text-2xl font-bold text-ink">AI Videos are ready for new work</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink/55">
            Published AI video projects from Supabase will appear here automatically after they are uploaded in the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <button type="button" onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
        <ArrowLeft size={20} /> Back to Categories
      </button>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-sienna">AI motion portfolio</p>
          <h3 className="text-2xl font-bold text-ink md:text-3xl">Motion samples that show concept, pacing, and polish</h3>
        </div>
        <span className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
          {items.length} video{items.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <AiVideoCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}

function AiVideoCard({ item, index }: { item: AiVideoItem; index: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const retryTimerRef = useRef<number | null>(null);
  const [errorUrl, setErrorUrl] = useState<string | null>(null);
  const [loadVersion, setLoadVersion] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const videoUrl = useMemo(() => {
    if (loadVersion === 0) return item.video_url;
    const separator = item.video_url.includes("?") ? "&" : "?";
    return `${item.video_url}${separator}retry=${loadVersion}`;
  }, [item.video_url, loadVersion]);
  const hasError = errorUrl === videoUrl;

  const playVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;
    video.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      playVideo();
      return;
    }

    video.pause();
    setIsPlaying(false);
  };

  const toggleMuted = () => {
    setIsMuted((current) => {
      const nextMuted = !current;
      const video = videoRef.current;

      if (video) {
        video.muted = nextMuted;
      }

      return nextMuted;
    });
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.load();

    const playTimer = window.setTimeout(() => {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }, 150 + index * 200);

    return () => {
      window.clearTimeout(playTimer);
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [videoUrl, index]);

  const handleReady = () => {
    setErrorUrl(null);
  };

  const retryVideo = () => {
    setErrorUrl(null);
    setLoadVersion((version) => version + 1);
  };

  const handleError = () => {
    setErrorUrl(videoUrl);
    setIsPlaying(false);

    if (loadVersion === 0 && retryTimerRef.current === null) {
      retryTimerRef.current = window.setTimeout(() => {
        retryTimerRef.current = null;
        setErrorUrl(null);
        setLoadVersion((version) => version + 1);
      }, 900 + index * 250);
    }
  };

  return (
    <div className="group overflow-hidden rounded-3xl bg-black text-left shadow-lg transition-all hover:shadow-xl">
      <div className="relative aspect-[9/16] overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={item.thumbnail_url || undefined}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          preload="metadata"
          onLoadedData={handleReady}
          onCanPlay={handleReady}
          onPlaying={() => {
            setErrorUrl(null);
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onError={handleError}
          className={clsx(
            "h-full w-full bg-black object-cover transition-opacity duration-300",
            hasError ? "opacity-0" : "opacity-100"
          )}
        />

        {hasError && (
          <button
            type="button"
            onClick={retryVideo}
            className="absolute inset-0 flex items-center justify-center bg-black/70 text-white/80 transition-colors hover:bg-black/80 hover:text-white"
            aria-label={`Retry ${item.title || "AI video"}`}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-sm">
              <Play size={20} fill="currentColor" />
            </span>
          </button>
        )}

        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/25 bg-ink/70 px-2 py-2 text-white shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label={isPlaying ? `Pause ${item.title || "AI video"}` : `Play ${item.title || "AI video"}`}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
          </button>
          <button
            type="button"
            onClick={toggleMuted}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label={isMuted ? `Turn sound on for ${item.title || "AI video"}` : `Mute ${item.title || "AI video"}`}
          >
            {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
        </div>
      </div>
    </div>
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

  useEffect(() => {
    if (!selectedItem) return;
    stopSmoothScroll();
    return () => startSmoothScroll();
  }, [selectedItem]);

  if (loading) return <div className="text-ink/50">Loading photo edits...</div>;

  return (
    <div className="w-full">
      <button type="button" onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
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
              <button
                type="button"
                className="flex w-full gap-4 h-64 md:h-80 cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-400"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-ink/40">Before</span>
                  <div className="relative flex-1 rounded-xl overflow-hidden bg-sand/20 group">
                    <MediaImage
                      src={item.before_image_url}
                      alt="Before"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-ink/40">After</span>
                  <div className="relative flex-1 rounded-xl overflow-hidden bg-sand/20 group">
                    <MediaImage
                      src={item.after_image_url}
                      alt="After"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
              </button>
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
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  aria-label="Close photo editing preview"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors ml-auto"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="relative flex flex-col md:flex-row gap-8 md:gap-16 w-full h-[70vh]">
                <div className="flex-1 flex flex-col gap-2 relative">
                  <span className="absolute top-4 left-4 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">Before</span>
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-black/50">
                    <MediaImage
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
                    <MediaImage
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
  autoplay = false,
  emptyLabel = "No reels available yet.",
  itemLabel = "video",
}: {
  reels: ReelItem[];
  onBack: () => void;
  loading: boolean;
  autoplay?: boolean;
  emptyLabel?: string;
  itemLabel?: "video" | "story";
}) {
  const [visibleCount, setVisibleCount] = useState(3);
  const prevCountRef = useRef(3);

  useEffect(() => {
    const prevCount = prevCountRef.current;

    if (visibleCount < prevCount) {
      scrollToTarget("#portfolio", -72);
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
      <button type="button" onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
        <ArrowLeft size={20} /> Back to Categories
      </button>

      {reels.length === 0 ? (
        <div className="p-8 text-center text-ink/50 bg-sand/20 rounded-3xl">{emptyLabel}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleReels.map((reel) => (
              <PortfolioVideoCard
                key={reel.id}
                item={reel}
                autoplay={autoplay}
                itemLabel={itemLabel}
              />
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            {hasMore ? (
              <button
                type="button"
                onClick={showMore}
                className="px-8 py-3 bg-ink text-white rounded-full font-medium hover:bg-ink/90 transition-colors"
              >
                Show More
              </button>
            ) : showLessButton ? (
              <button
                type="button"
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

function PortfolioVideoCard({
  item,
  autoplay,
  itemLabel,
}: {
  item: ReelItem;
  autoplay: boolean;
  itemLabel: "video" | "story";
}) {
  const canvaEmbedUrl = getCanvaEmbedUrl(item.video_url);
  const startsUnavailable = isKnownBrokenPortfolioVideoUrl(item.video_url);
  const [hasError, setHasError] = useState(startsUnavailable);

  const unavailableMessage =
    itemLabel === "story"
      ? "This story is saved, but its Canva asset link is unavailable. Please check the media source."
      : "This video link is unavailable.";

  return (
    <motion.div
      className="reel-card bg-black rounded-3xl overflow-hidden aspect-[9/16] relative shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {canvaEmbedUrl ? (
        <iframe
          src={canvaEmbedUrl}
          title={item.title || "Canva video"}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <video
          src={item.video_url}
          controls
          className={clsx("w-full h-full object-cover", hasError && "opacity-20")}
          playsInline
          autoPlay={autoplay && !hasError}
          muted={autoplay}
          loop={autoplay}
          preload="metadata"
          onError={() => setHasError(true)}
        />
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/85 p-6 text-center text-white">
          <Video size={28} className="text-white/80" />
          <p className="text-sm font-semibold">
            {itemLabel === "story" ? "Story Video Unavailable" : "Video Unavailable"}
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-white/70">{unavailableMessage}</p>
        </div>
      )}
    </motion.div>
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
    if (!selectedClient) return;
    stopSmoothScroll();
    return () => startSmoothScroll();
  }, [selectedClient]);

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
      <button type="button" onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
        <ArrowLeft size={20} /> Back to Categories
      </button>

      {clients.length === 0 ? (
        <div className="p-8 text-center text-ink/50 bg-sand/20 rounded-3xl">No carousels available yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <motion.button
              type="button"
              key={client.clientName}
              onClick={() => setSelectedClient(client)}
              className="group relative cursor-pointer bg-white rounded-3xl border border-ink/10 overflow-hidden hover:shadow-xl transition-all text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-400"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5 }}
            >
              <div className="aspect-[4/5] bg-sand/20 relative overflow-hidden">
                {client.items[0]?.image ? (
                  <MediaImage
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
            </motion.button>
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
                type="button"
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

function CategoryGrid({
  onSelect,
  categories,
}: {
  onSelect: (c: PortfolioCategory) => void;
  categories: PortfolioCategory[];
}) {
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full">
      <MagicStyles />
      <GlobalSpotlight gridRef={gridRef} />
      <div
        ref={gridRef}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-6"
      >
        {categories.map((category) => (
          <StarBorder
            as="button"
            key={category.id}
            onClick={() => onSelect(category)}
            className="w-full h-full"
            innerClassName="group relative min-h-[150px] p-5 sm:p-6 bg-sand/30 hover:bg-white text-left transition-all hover:shadow-xl overflow-hidden cursor-pointer w-full h-full flex flex-col items-start justify-start"
            color="rgb(255, 0, 128)" // Pink
            speed="5s"
          >
            <div className={clsx("relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center mb-4 text-2xl transition-colors", category.color)}>
              <category.icon size={25} />
            </div>

            <h3 className="relative z-10 text-xl font-bold text-ink mb-2">{category.name}</h3>
            <p className="relative z-10 text-sm leading-relaxed text-ink/60">{category.description}</p>

            <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all z-10">
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
  onCloseModal,
  onBack,
  industries,
  loading,
  error,
}: {
  selectedIndustry: PortfolioIndustry | null;
  onSelect: (i: PortfolioIndustry) => void;
  onCloseModal: () => void;
  onBack: () => void;
  industries: PortfolioIndustry[];
  loading: boolean;
  error: string | null;
}) {
  const [hoveredIndustryId, setHoveredIndustryId] = useState<string | null>(null);

  return (
    <div className="w-full">
      <button type="button" onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
        <ArrowLeft size={20} /> Back to Categories
      </button>

      <div className="relative">
        {loading && (
          <div className="rounded-[28px] border border-ink/10 bg-white p-6 text-sm text-ink/50 shadow-[0_25px_80px_-45px_rgba(6,0,16,0.25)]">
            Loading industries...
          </div>
        )}
        {error && !loading && (
          <div className="rounded-[28px] border border-red-200 bg-white p-6 text-sm text-red-500 shadow-[0_25px_80px_-45px_rgba(6,0,16,0.25)]">
            {error}
          </div>
        )}
        {!loading && !error && industries.length === 0 && (
          <div className="rounded-[28px] border border-ink/10 bg-white p-6 text-sm text-ink/50 shadow-[0_25px_80px_-45px_rgba(6,0,16,0.25)]">
            No industries available yet.
          </div>
        )}
        {!loading && !error && industries.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {industries.map((industry, index) => (
                <GraphicIndustryCard
                  key={industry.id}
                  industry={industry}
                  index={index}
                  isSelected={selectedIndustry?.id === industry.id}
                  isHovered={hoveredIndustryId === industry.id}
                  hoveredIndustryId={hoveredIndustryId}
                  onHoverStart={() => setHoveredIndustryId(industry.id)}
                  onHoverEnd={() => {
                    setHoveredIndustryId((currentId) => currentId === industry.id ? null : currentId);
                  }}
                  onSelect={() => onSelect(industry)}
                />
              ))}
            </div>

            <GraphicDesignModal industry={selectedIndustry} onClose={onCloseModal} />
          </>
        )}
      </div>
    </div>
  );
}

function GraphicIndustryCard({
  industry,
  index,
  isSelected,
  isHovered,
  hoveredIndustryId,
  onHoverStart,
  onHoverEnd,
  onSelect,
}: {
  industry: PortfolioIndustry;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  hoveredIndustryId: string | null;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onSelect: () => void;
}) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const marqueeAnimationRef = useRef<gsap.core.Tween | null>(null);
  const hoverTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const [repetitions, setRepetitions] = useState(3);

  const images = useMemo(() => {
    const projectImages = industry.projects
      .map((project) => project.image)
      .filter(Boolean);

    return projectImages.length > 0 ? projectImages.slice(0, 8) : [""];
  }, [industry.projects]);

  const pieceCount = industry.projects.length;

  const findClosestEdge = (mouseX: number, mouseY: number, width: number, height: number): "top" | "bottom" => {
    const topEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY, 2);
    const bottomEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - height, 2);
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };

  useEffect(() => {
    const calculateRepetitions = () => {
      if (!cardRef.current || !marqueeInnerRef.current) return;
      const marqueeContent = marqueeInnerRef.current.querySelector(".graphics-card-marquee-segment") as HTMLElement | null;
      if (!marqueeContent) return;

      const contentWidth = marqueeContent.offsetWidth;
      if (contentWidth === 0) return;

      const needed = Math.ceil(cardRef.current.offsetWidth / contentWidth) + 2;
      setRepetitions(Math.max(3, needed));
    };

    calculateRepetitions();
    window.addEventListener("resize", calculateRepetitions);
    return () => window.removeEventListener("resize", calculateRepetitions);
  }, [images]);

  useEffect(() => {
    const setupMarquee = () => {
      if (!marqueeInnerRef.current) return;
      const marqueeContent = marqueeInnerRef.current.querySelector(".graphics-card-marquee-segment") as HTMLElement | null;
      if (!marqueeContent) return;

      const contentWidth = marqueeContent.offsetWidth;
      if (contentWidth === 0) return;

      marqueeAnimationRef.current?.kill();
      marqueeAnimationRef.current = gsap.to(marqueeInnerRef.current, {
        x: -contentWidth,
        duration: 18,
        ease: "none",
        repeat: -1,
      });
    };

    const timer = window.setTimeout(setupMarquee, 60);
    return () => {
      window.clearTimeout(timer);
      marqueeAnimationRef.current?.kill();
      hoverTimelineRef.current?.kill();
    };
  }, [images, repetitions]);

  useEffect(() => {
    if (!marqueeRef.current || !marqueeInnerRef.current) return;

    if (isSelected) {
      gsap.to([marqueeRef.current, marqueeInnerRef.current], {
        y: "0%",
        duration: 0.45,
        ease: "expo.out",
      });
    } else {
      gsap.set(marqueeRef.current, { y: "101%" });
      gsap.set(marqueeInnerRef.current, { y: "-101%" });
    }
  }, [isSelected]);

  useEffect(() => {
    if (isSelected || isHovered || hoveredIndustryId === null) return;
    if (!marqueeRef.current || !marqueeInnerRef.current) return;

    hoverTimelineRef.current?.kill();
    hoverTimelineRef.current = null;
    gsap.set(marqueeRef.current, { y: "101%" });
    gsap.set(marqueeInnerRef.current, { y: "-101%" });
  }, [hoveredIndustryId, isHovered, isSelected]);

  const showMarquee = (event: MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    onHoverStart();
    const rect = cardRef.current.getBoundingClientRect();
    const edge = findClosestEdge(event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height);

    hoverTimelineRef.current?.kill();
    hoverTimelineRef.current = gsap
      .timeline({
        defaults: { duration: 0.6, ease: "expo.out" },
        onComplete: () => {
          hoverTimelineRef.current = null;
        },
      })
      .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .set(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0)
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" }, 0);
  };

  const hideMarquee = (event: MouseEvent<HTMLButtonElement>) => {
    onHoverEnd();
    if (isSelected || !cardRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const edge = findClosestEdge(event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height);

    hoverTimelineRef.current?.kill();
    hoverTimelineRef.current = gsap
      .timeline({
        defaults: { duration: 0.6, ease: "expo.out" },
        onComplete: () => {
          hoverTimelineRef.current = null;
        },
      })
      .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0);
  };

  return (
    <motion.button
      ref={cardRef}
      type="button"
      layout
      onClick={onSelect}
      onMouseEnter={showMarquee}
      onMouseLeave={hideMarquee}
      className={clsx(
        "no-scale group relative min-h-[268px] overflow-hidden rounded-[28px] border p-5 text-left shadow-[0_25px_70px_-50px_rgba(6,0,16,0.34)] transition-all duration-300 ease-out hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c98465] sm:min-h-[286px] sm:p-6",
        isSelected
          ? "border-[#7a563b]/70 bg-[#7a563b] text-white shadow-[0_30px_90px_-48px_rgba(122,86,59,0.72)]"
          : "border-ink/10 bg-white text-ink hover:border-[#7a563b]/50 hover:bg-[#7a563b] hover:text-white"
      )}
      aria-pressed={isSelected}
    >
      <div
        ref={marqueeRef}
        className="pointer-events-none absolute inset-0 overflow-hidden bg-[#7a563b] translate-y-[101%]"
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-x-0 top-6 h-px bg-white/20" />
        <div className="absolute inset-x-0 bottom-6 h-px bg-white/20" />
        <div
          ref={marqueeInnerRef}
          className="relative flex h-full w-fit items-center gap-4 px-4"
        >
          {Array.from({ length: repetitions }).map((_, repetitionIndex) => (
            <div
              className="graphics-card-marquee-segment flex shrink-0 items-center gap-4 pr-4"
              key={`marquee-${industry.id}-${repetitionIndex}`}
            >
              {images.map((image, imageIndex) => (
                <GraphicCardImage
                  key={`${image}-${imageIndex}`}
                  src={image}
                  alt=""
                  className="h-28 w-20 shrink-0 rounded-2xl border border-white/20 object-cover shadow-[0_18px_35px_-24px_rgba(0,0,0,0.9)] sm:h-36 sm:w-24"
                  loading={repetitionIndex === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              ))}
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#3f2818]/80 via-[#7a563b]/35 to-[#7a563b]/20" />
      </div>

      <div className="relative z-10 flex min-h-[228px] flex-col justify-between sm:min-h-[238px]">
        <div className="flex items-start justify-between gap-4">
          <span className={clsx(
            "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] transition-colors",
            isSelected
              ? "border-white/35 bg-white/10 text-white"
              : "border-ink/10 bg-sand/60 text-ink/55 group-hover:border-white/35 group-hover:bg-white/10 group-hover:text-white/85"
          )}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className={clsx(
            "text-xs font-semibold uppercase tracking-[0.2em] transition-colors",
            isSelected ? "text-white/75" : "text-ink/45 group-hover:text-white/75"
          )}>
            {pieceCount} {pieceCount === 1 ? "piece" : "pieces"}
          </span>
        </div>

        <div>
          <h3 className="max-w-[12ch] text-3xl font-bold leading-[1.05] sm:text-4xl">{industry.name}</h3>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className={clsx(
            "text-sm font-semibold transition-colors",
            isSelected ? "text-white" : "text-[#7a563b] group-hover:text-white"
          )}>
            View Samples
          </span>
          <span className={clsx(
            "flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300",
            isSelected
              ? "bg-white text-[#7a563b]"
              : "bg-ink text-white group-hover:bg-white group-hover:text-[#7a563b]"
          )}>
            <ArrowLeft className={clsx("transition-transform", isSelected ? "-rotate-90" : "rotate-180 group-hover:translate-x-0.5")} size={18} />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function GraphicDesignModal({
  industry,
  onClose,
}: {
  industry: PortfolioIndustry | null;
  onClose: () => void;
}) {
  const modalTitleId = industry ? `graphic-design-modal-${industry.id}` : "graphic-design-modal-title";
  const heroImages = useMemo(() => {
    if (!industry) return [];

    const seen = new Set<string>();
    return industry.projects
      .map((project) => project.image)
      .filter((image) => {
        if (!image || seen.has(image)) return false;
        seen.add(image);
        return true;
      })
      .slice(0, 6);
  }, [industry]);

  const clientCount = useMemo(() => {
    if (!industry) return 0;
    return new Set(industry.projects.map((project) => project.clientName || project.title || project.id)).size;
  }, [industry]);

  useEffect(() => {
    if (!industry) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    stopSmoothScroll();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      startSmoothScroll();
    };
  }, [industry, onClose]);

  return (
    <AnimatePresence>
      {industry && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-ink/70 p-3 backdrop-blur-md sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] bg-[#fbf7f2] text-ink shadow-[0_32px_120px_-42px_rgba(0,0,0,0.75)] sm:max-h-[calc(100vh-3rem)]"
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="relative shrink-0 overflow-hidden bg-[#7a563b] px-5 py-6 text-white sm:px-7 md:px-8 md:py-7">
              <div className="absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden opacity-55 md:block">
                <div className="flex h-full translate-x-16 items-center gap-4">
                  {heroImages.map((image, index) => (
                    <GraphicCardImage
                      key={`modal-hero-${image}-${index}`}
                      src={image}
                      alt=""
                      className="h-40 w-28 shrink-0 rounded-[22px] border border-white/20 object-cover shadow-[0_24px_50px_-32px_rgba(0,0,0,0.85)]"
                      loading="lazy"
                      decoding="async"
                    />
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#7a563b] via-[#7a563b]/80 to-transparent" />
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close graphic design samples"
                className="no-scale absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/12 text-white shadow-lg backdrop-blur transition-colors hover:bg-white hover:text-[#7a563b]"
              >
                <X size={19} />
              </button>

              <div className="relative z-10 max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">Graphic Design Samples</p>
                <h3 id={modalTitleId} className="mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                  {industry.name}
                </h3>
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/78">
                  <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5">
                    {industry.projects.length} {industry.projects.length === 1 ? "piece" : "pieces"}
                  </span>
                  <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5">
                    {clientCount} {clientCount === 1 ? "collection" : "collections"}
                  </span>
                </div>
              </div>
            </div>

            <div className="min-h-0 overflow-y-auto px-4 py-5 sm:px-6 md:px-8 md:py-7">
              <IndustryGallery industry={industry} variant="modal" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GraphicCardImage({
  src,
  alt,
  className,
  loading,
  decoding,
}: {
  src: string;
  alt: string;
  className: string;
  loading?: "eager" | "lazy";
  decoding?: "async" | "sync" | "auto";
}) {
  const [hasError, setHasError] = useState(!src);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt ? `${alt} image source unavailable` : "Image source unavailable"}
        title="Source image unavailable"
        className={clsx(
          className,
          "relative flex flex-col items-center justify-center overflow-hidden bg-[#f3e7dc] text-center text-[#7a563b]"
        )}
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(122,86,59,0.18)_0%,rgba(255,255,255,0.42)_48%,rgba(201,132,101,0.2)_100%)]" />
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_1px_1px,rgba(122,86,59,0.25)_1px,transparent_0)] [background-size:12px_12px]" />
        <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#7a563b]/20 bg-white/70 shadow-sm">
          <ImageOff size={15} />
        </div>
        <span className="relative z-10 mt-2 max-w-[8rem] px-2 text-[9px] font-bold uppercase leading-tight tracking-[0.12em]">
          Source unavailable
        </span>
      </div>
    );
  }

  return (
    <MediaImage
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={() => setHasError(true)}
    />
  );
}

function CopywritingGallery({ industry, onBack }: { industry: PortfolioIndustry, onBack: () => void }) {
  const [selectedImage, setSelectedImage] = useState<{ image: string } | null>(null);

  useEffect(() => {
    if (!selectedImage) return;
    stopSmoothScroll();
    return () => startSmoothScroll();
  }, [selectedImage]);

  return (
    <div className="w-full">
      <button type="button" onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
        <ArrowLeft size={20} /> Back to Categories
      </button>

      {industry.projects.length === 0 ? (
        <div className="p-8 text-center text-ink/50 bg-sand/20 rounded-3xl">No copywriting samples available yet.</div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {industry.projects.map((project) => (
            <div
              key={project.id}
              role="button"
              tabIndex={0}
              className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-400"
              onClick={() => setSelectedImage({ image: project.image })}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedImage({ image: project.image });
                }
              }}
            >
              <MediaImage
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
                <MediaImage
                  src={selectedImage.image}
                  alt="Copywriting sample"
                  className="w-full h-full max-h-[85vh] object-contain p-4"
                />
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                aria-label="Close copywriting preview"
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

function IndustryGallery({
  industry,
  variant = "section",
}: {
  industry: PortfolioIndustry;
  variant?: "section" | "modal";
}) {
  const [selectedMedia, setSelectedMedia] = useState<{ image: string; text: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>("all");
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const selectedIndexRef = useRef<number>(0);
  const isModal = variant === "modal";

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

  const flatGalleryItems = useMemo(
    () =>
      galleryList.flatMap((gallery) =>
        gallery.items.map((item) => ({ ...item, clientName: gallery.clientName }))
      ),
    [galleryList]
  );

  const activeClientName =
    selectedClientName === "all" || galleryList.some((gallery) => gallery.clientName === selectedClientName)
      ? selectedClientName
      : "all";

  const activeGalleryItems = useMemo(() => {
    if (activeClientName === "all") {
      return flatGalleryItems;
    }

    const activeGallery = galleryList.find((gallery) => gallery.clientName === activeClientName);
    if (!activeGallery) {
      return flatGalleryItems;
    }

    return activeGallery.items.map((item) => ({ ...item, clientName: activeGallery.clientName }));
  }, [activeClientName, flatGalleryItems, galleryList]);

  const activePieceCount = activeGalleryItems.length;

  useEffect(() => {
    if (selectedIndex !== null) {
      selectedIndexRef.current = selectedIndex;
    }
  }, [selectedIndex]);

  const getCurrentIndex = useCallback(() => {
    if (selectedIndex !== null) return selectedIndex;
    if (selectedMedia) {
      const index = galleryList
        .flatMap((gallery) => gallery.items)
        .findIndex((item: GalleryItem) => item.image === selectedMedia.image);
      if (index >= 0) return index;
    }
    return selectedIndexRef.current;
  }, [galleryList, selectedIndex, selectedMedia]);

  const showNext = useCallback((direction: 1 | -1) => {
    const allItems = galleryList.flatMap((gallery) => gallery.items);
    if (allItems.length === 0) return;
    const currentIndex = getCurrentIndex();
    const nextIndex = (currentIndex + direction + allItems.length) % allItems.length;
    selectedIndexRef.current = nextIndex;
    setSelectedIndex(nextIndex);
    setSelectedMedia(allItems[nextIndex]);
  }, [galleryList, getCurrentIndex]);

  const openGalleryItem = useCallback((galleryClientName: string, item: GalleryItem, index: number) => {
    setSelectedMedia({
      image: item.fullImage ?? item.image,
      text: item.text,
    });

    const galleryIndex = galleryList.findIndex((gallery) => gallery.clientName === galleryClientName);
    const offset = galleryList
      .slice(0, galleryIndex >= 0 ? galleryIndex : 0)
      .reduce((count, gallery) => count + gallery.items.length, 0);
    const total = galleryList.reduce((count, gallery) => count + gallery.items.length, 0);
    const nextIndex = (offset + index) % Math.max(total, 1);
    selectedIndexRef.current = nextIndex;
    setSelectedIndex(nextIndex);
  }, [galleryList]);

  const openFlatGalleryItem = useCallback((item: GalleryItem & { clientName?: string }, index: number) => {
    setSelectedMedia({
      image: item.fullImage ?? item.image,
      text: item.text,
    });
    const flatIndex = flatGalleryItems.findIndex((flatItem) =>
      flatItem.image === item.image &&
      flatItem.text === item.text &&
      flatItem.clientName === item.clientName
    );
    const nextIndex = flatIndex >= 0 ? flatIndex : index;
    selectedIndexRef.current = nextIndex;
    setSelectedIndex(nextIndex);
  }, [flatGalleryItems]);

  useEffect(() => {
    if (!selectedMedia) return;
    stopSmoothScroll();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") showNext(1);
      if (event.key === "ArrowLeft") showNext(-1);
      if (event.key === "Escape") setSelectedMedia(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (!isModal) {
        startSmoothScroll();
      }
    };
  }, [isModal, selectedMedia, showNext]);

  return (
    <div className={clsx("w-full", isModal ? "p-0" : "p-4 md:p-8")}>
      {!isModal && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold text-ink">{industry.name} Gallery</h3>
            <p className="text-sm text-ink/60">Showcasing selected works from {industry.name}</p>
          </div>
          <div className="text-xs uppercase tracking-[0.25em] text-ink/50">
            {galleryList.reduce((count, gallery) => count + gallery.items.length, 0)} pieces
          </div>
        </div>
      )}
      {galleryList.length > 0 ? (
        isModal ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 border-b border-ink/10 pb-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/45">Client Selection</p>
                  <h4 className="mt-1 text-xl font-bold text-ink">Choose a client collection</h4>
                </div>
                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
                  {activePieceCount} {activePieceCount === 1 ? "piece" : "pieces"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClientName("all")}
                  className={clsx(
                    "no-scale shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    activeClientName === "all"
                      ? "border-[#7a563b] bg-[#7a563b] text-white"
                      : "border-ink/10 bg-white text-ink/65 hover:border-[#7a563b]/35 hover:text-[#7a563b]"
                  )}
                >
                  All Clients
                </button>
                {galleryList.map((gallery) => (
                  <button
                    type="button"
                    key={`client-filter-${gallery.clientName}`}
                    onClick={() => setSelectedClientName(gallery.clientName)}
                    className={clsx(
                      "no-scale shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                      activeClientName === gallery.clientName
                        ? "border-[#7a563b] bg-[#7a563b] text-white"
                        : "border-ink/10 bg-white text-ink/65 hover:border-[#7a563b]/35 hover:text-[#7a563b]"
                    )}
                  >
                    {gallery.clientName}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {activeGalleryItems.map((item, index) => (
                <button
                  type="button"
                  key={`${item.clientName}-${item.image}-${index}`}
                  className="no-scale group relative aspect-[4/5] overflow-hidden rounded-2xl border border-ink/10 bg-white text-left shadow-[0_18px_45px_-36px_rgba(6,0,16,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-[#7a563b]/35 hover:shadow-xl"
                  onClick={() => openFlatGalleryItem(item, index)}
                >
                  <GraphicCardImage
                    src={item.image}
                    alt={item.text}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading={isModal ? "eager" : "lazy"}
                    decoding="async"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-3 pt-12">
                    {activeClientName === "all" && (
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                        {item.clientName}
                      </span>
                    )}
                    <span className="line-clamp-2 text-sm font-semibold leading-tight text-white">{item.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {galleryList.map((gallery) => (
              <div key={gallery.clientName} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-ink">{gallery.clientName}</h4>
                  <span className="text-xs uppercase tracking-[0.2em] text-ink/50">
                    {gallery.items.length} images
                  </span>
                </div>
                <div className="h-[320px] overflow-hidden rounded-[24px] border border-ink/10 bg-sand/60 flex items-center justify-center md:h-[420px]">
                  <GalleryCarousel
                    items={gallery.items.map((item) => ({
                      ...item,
                      image: item.image,
                      fullImage: item.image
                    }))}
                    onItemClick={(item: GalleryItem, index: number) => {
                      if (gallery.items.length === 0) return;
                      openGalleryItem(gallery.clientName, item, index);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className={clsx(
          "flex items-center justify-center text-sm text-ink/60 rounded-[24px] border border-ink/10 bg-sand/60",
          isModal ? "h-[260px]" : "h-[320px]"
        )}>
          No images available.
        </div>
      )}

      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 sm:p-6"
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
                type="button"
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-3 text-ink opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 focus-visible:opacity-100 hover:scale-110 cursor-pointer"
                onClick={() => showNext(-1)}
                aria-label="Previous image"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-3 text-ink opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 focus-visible:opacity-100 hover:scale-110 cursor-pointer"
                onClick={() => showNext(1)}
                aria-label="Next image"
              >
                <ArrowLeft size={18} className="rotate-180" />
              </button>
              <button
                type="button"
                className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-3 text-ink shadow-lg transition-all duration-200 hover:bg-white hover:scale-105 cursor-pointer"
                onClick={() => setSelectedMedia(null)}
                aria-label="Close image preview"
              >
                <X size={18} />
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
                    <GraphicCardImage
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
