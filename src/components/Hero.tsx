"use client";

import { motion } from "framer-motion";
import { memo, useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, Star, MousePointer2 } from "lucide-react";
import Magnet from "./Magnet";
import { CalendlyModal } from "./CalendlyModal";

const TITLES = [
  "Social Media Management",
  "Social Media Graphic Designer",
  "Social Media Content Creator",
];

type ToolItem = {
  id: string;
  name: string;
  src?: string;
  icon?: React.ReactNode;
};

const TOOLS: ToolItem[] = [
  { id: "clickup", name: "ClickUp", src: "/logos/Clickup.jpg" },
  { id: "chatgpt", name: "ChatGPT", src: "/logos/chatgpt.svg" },
  { id: "trello", name: "Trello", src: "/logos/Trello.jpg" },
  { id: "google-workspace", name: "Google Workspace", src: "/logos/google-workspace.svg" },
  { id: "gemini", name: "Gemini", src: "/logos/Gemini.webp" },
  { id: "nanobanana", name: "Nanobanana", src: "/logos/nanobanana.jpg" },
  { id: "canva", name: "Canva", src: "/logos/canva.svg" },
  { id: "capcut", name: "CapCut", src: "/logos/Capcut.jpg" },
  { id: "google-docs", name: "Google Docs", src: "/logos/google-docs.svg" },
  { id: "google-sheets", name: "Google Sheets", src: "/logos/google-sheets.png" },
  { id: "tiktok", name: "TikTok", src: "/logos/Tiktok.webp" },
  {
    id: "facebook",
    name: "Facebook",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-full h-full" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-full h-full">
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="25%" stopColor="#e6683c" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="75%" stopColor="#cc2366" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
        <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069M12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z" />
        <path fill="url(#ig-grad)" d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a3.999 3.999 0 110-7.998 3.999 3.999 0 010 7.998zM18.406 4.155a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-full h-full" fill="#0A66C2">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    id: "x",
    name: "X",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-full h-full" fill="#000000">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

const LogoCard = memo(function LogoCard({ tool }: { tool: ToolItem }) {
  return (
    <div
      className="relative w-24 h-24 bg-white rounded-3xl shrink-0 border border-black/5 shadow-sm flex items-center justify-center p-5 group cursor-pointer hover:scale-105 hover:shadow-md transition-all duration-300"
      title={tool.name}
    >
      {tool.src ? (
        <Image
          src={tool.src}
          alt={`${tool.name} logo`}
          width={100}
          height={100}
          sizes="96px"
          className="object-contain w-full h-full transition-all duration-300"
        />
      ) : (
        <div className="w-full h-full transition-all duration-300">
          {tool.icon}
        </div>
      )}
    </div>
  );
});

const MarqueeRow = memo(function MarqueeRow({ reverse = false }: { reverse?: boolean }) {
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <motion.div
        className="flex flex-nowrap gap-16 md:gap-24 w-max"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 30,
            ease: "linear",
          },
        }}
      >
        {[0, 1].map((loop) => (
          <div key={loop} className="flex flex-nowrap gap-16 md:gap-24 shrink-0">
            {TOOLS.map((tool) => (
              <LogoCard key={`${loop}-${tool.id}`} tool={tool} />
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
});


export function Hero() {
  const [titleIndex, setTitleIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const currentTitle = TITLES[titleIndex];
    const isComplete = typedText === currentTitle;
    const isEmpty = typedText.length === 0;
    const typingSpeed = isDeleting ? 40 : 85;
    const pauseDuration = 2200;

    if (isComplete && !isDeleting) {
      const pauseTimer = setTimeout(() => setIsDeleting(true), pauseDuration);
      return () => clearTimeout(pauseTimer);
    }

    if (isEmpty && isDeleting) {
      const resetTimer = setTimeout(() => {
        setIsDeleting(false);
        setTitleIndex((prev) => (prev + 1) % TITLES.length);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const timer = setTimeout(() => {
      const nextLength = isDeleting ? typedText.length - 1 : typedText.length + 1;
      setTypedText(currentTitle.slice(0, Math.max(0, nextLength)));
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [titleIndex, typedText, isDeleting]);

  return (
    <section className="relative min-h-[95vh] flex flex-col justify-center overflow-hidden bg-[#FDF8F5] pt-24 pb-0">
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-4 md:px-8 flex-grow">

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col space-y-8 z-10 lg:pr-10"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-semibold tracking-widest uppercase text-ink/60">
              Available for Hire
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-medium text-ink leading-[1.1] tracking-tight">
            Hi, I&apos;m Mav
          </h1>

          <div className="text-2xl md:text-3xl lg:text-4xl font-serif font-medium text-ink/90 tracking-tight min-h-[2.5rem] md:min-h-[3rem] lg:min-h-[3.5rem]">
            <span className="inline-flex items-center gap-2">
              {typedText}
              <span className="inline-block h-[1em] w-[2px] bg-ink/70 animate-[blink_1s_step-end_infinite]" aria-hidden="true" />
            </span>
          </div>

          <p className="text-xl text-ink/70 max-w-xl leading-relaxed">
            I help brands show up consistently with scroll-stopping visuals, strategic content,
            and social media management that turns attention into action.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Magnet padding={50} magnetStrength={5}>
              <button
                onClick={() => setIsModalOpen(true)}
                className="group relative px-8 py-4 bg-ink text-sand rounded-full font-medium transition-all hover:bg-ink/90 overflow-hidden cursor-pointer"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start a Project <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Magnet>

            <Magnet padding={50} magnetStrength={5}>
              <a
                href="#portfolio"
                className="px-8 py-4 bg-transparent border border-ink/20 text-ink rounded-full font-medium hover:bg-ink/5 transition-colors cursor-pointer inline-flex items-center justify-center"
              >
                View Portfolio
              </a>
            </Magnet>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-8 border-t border-ink/5">
            <span className="px-4 py-2 rounded-full bg-white/80 border border-ink/10 text-sm font-medium text-ink">
              Consistent posting
            </span>
            <span className="px-4 py-2 rounded-full bg-white/80 border border-ink/10 text-sm font-medium text-ink">
              Scroll-stopping design
            </span>
            <span className="px-4 py-2 rounded-full bg-white/80 border border-ink/10 text-sm font-medium text-ink">
              Strategy + execution
            </span>
          </div>

        </motion.div>

        {/* Image / Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="relative h-[500px] lg:h-[600px] w-full hidden lg:flex justify-center items-end"
        >
          {/* Massive Pulsing Glow Background */}
          <div className="absolute inset-x-4 bottom-0 h-[80%] bg-pink-500/30 blur-[120px] animate-pulse rounded-full z-[-10]"></div>

          {/* Glowing Animated Border Container */}
          <div className="absolute inset-x-3 bottom-[-3px] h-[calc(75%+6px)] rounded-t-[3.2rem] rounded-b-[2.2rem] overflow-hidden z-0">
            <div className="absolute inset-[-50%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(transparent_200deg,#ec4899_360deg)] blur-[80px] opacity-60"></div>
          </div>

          {/* Main Card Background */}
          <div className="absolute inset-x-4 bottom-0 h-[75%] bg-[#EFEAE4] rounded-t-[3rem] rounded-b-[2rem] border border-white/50 shadow-2xl overflow-hidden z-10">
            {/* Decorative grid or pattern inside card */}
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* Circle behind head */}
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-64 h-64 bg-white/40 rounded-full blur-2xl"></div>
          </div>

          {/* Hero Image */}
          <div className="relative z-10 w-full h-full flex justify-center items-end">
            <Image
              src="/Hero.png"
              alt="Hero Portrait"
              width={550}
              height={700}
              className="object-contain max-h-[115%] w-auto h-auto drop-shadow-2xl"
              priority
            />
          </div>

          {/* Floating UI Elements (Interactive) */}
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 2, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: [0.45, 0, 0.55, 1] // Custom smooth bezier
            }}
            className="absolute top-[30%] lg:top-[35%] xl:top-[25%] right-[-1rem] xl:right-[-1rem] 2xl:right-[10%] bg-white p-4 rounded-xl shadow-lg border border-ink/5 z-30 max-w-[180px]"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-green-100 rounded-full text-green-600">
                <Star size={12} fill="currentColor" />
              </div>
              <span className="text-xs font-bold text-ink">Social-First</span>
            </div>
            <p className="text-[10px] text-ink/60 leading-tight">
              Strategy-led content optimized for growth and engagement.
            </p>
          </motion.div>

          <motion.div
            animate={{
              y: [0, 10, 0],
              rotate: [0, -2, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 6,
              ease: [0.45, 0, 0.55, 1], // Custom smooth bezier
              delay: 1
            }}
            className="absolute bottom-[25%] left-[0%] md:left-[5%] bg-white/80 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/40 z-20 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-full bg-sienna/10 flex items-center justify-center text-sienna">
              <MousePointer2 size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-ink">Content Creator</p>
              <p className="text-[10px] text-ink/50">Social Media Management</p>
            </div>
          </motion.div>

        </motion.div>
      </div>

      {/* Double Marquee Section */}
      <div className="w-full mt-12 py-10 bg-[#F7F2EC] border-y border-ink/5 overflow-hidden flex flex-col gap-4">
        <div className="relative flex w-full flex-col gap-6 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F7F2EC] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F7F2EC] to-transparent z-10 pointer-events-none" />

          {/* Top row - Going Right */}
          <MarqueeRow />

          {/* Bottom row - Going Left */}
          <MarqueeRow reverse />
        </div>
      </div>

      <CalendlyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        url="https://calendly.com/smm-mavenicaann/30min"
      />
    </section>
  );
}
