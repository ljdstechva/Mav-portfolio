"use client";

import { motion, useAnimationFrame, useMotionValue, useSpring, useTransform, wrap } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, Star, MousePointer2 } from "lucide-react";
import Magnet from "./Magnet";
import { CalendlyModal } from "./CalendlyModal";

const TOOLS = [
  { name: "Canva", src: "/logos/canva.png" },
  { name: "ClickUp", src: "/logos/clickup.svg" },
  { name: "ChatGPT", src: "/logos/chatgpt.svg" },
  { name: "Trello", src: "/logos/trello.svg" },
  { name: "Google Workspace", src: "/logos/google-workspace.svg" },
  { name: "Gemini", src: "/logos/gemini.svg" },
  { name: "CapCut", src: "/logos/capcut.png" },
];

function Marquee({ children, baseVelocity = 100 }: { children: React.ReactNode; baseVelocity?: number }) {
  const baseX = useMotionValue(0);
  const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`);

  const directionFactor = useRef<number>(1);
  const velocitySpring = useSpring(baseVelocity, { stiffness: 50, damping: 20 });
  
  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * (velocitySpring.get() || 0) * (delta / 1000);
    if (velocitySpring.get() === 0) return; 
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div 
        className="overflow-hidden whitespace-nowrap flex flex-nowrap"
        onMouseEnter={() => velocitySpring.set(baseVelocity * 0.2)} 
        onMouseLeave={() => velocitySpring.set(baseVelocity)}       
    >
      <motion.div className="flex flex-nowrap gap-16 md:gap-24 px-8" style={{ x }}>
        {/* Render children multiple times to ensure seamless loop on wide screens */}
        {children}
        {children}
        {children}
        {children}
        {children}
        {children}
      </motion.div>
    </div>
  );
}

export function Hero() {
  const TITLES = [
    "Social Media Management",
    "Social Media Graphic Designer",
    "Social Media Content Creator",
  ];
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
      setIsDeleting(false);
      setTitleIndex((prev) => (prev + 1) % TITLES.length);
      return undefined;
    }

    const timer = setTimeout(() => {
      const nextLength = isDeleting ? typedText.length - 1 : typedText.length + 1;
      setTypedText(currentTitle.slice(0, Math.max(0, nextLength)));
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [TITLES, titleIndex, typedText, isDeleting]);

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
            Hi, I'm Mav
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
            <img
              src="/Hero.png"
              alt="Hero Portrait"
              width={550}
              height={700}
              className="object-contain max-h-[115%] drop-shadow-2xl"
              loading="eager"
              decoding="async"
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

      {/* Infinite Logo Marquee Section */}
      <div className="w-full mt-12 py-10 bg-[#F7F2EC] border-y border-ink/5 overflow-hidden">
        <div className="relative flex w-full overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F7F2EC] to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F7F2EC] to-transparent z-10" />
            
            <Marquee baseVelocity={-0.5}>
              {TOOLS.map((tool, idx) => (
                <div 
                    key={`${tool.name}-${idx}`}  
                    className="relative w-32 h-16 flex items-center justify-center shrink-0 group cursor-pointer hover:scale-110 transition-transform duration-300"
                    title={tool.name}
                >
                      <Image 
                        src={tool.src} 
                        alt={`${tool.name} logo`}
                        width={120}
                        height={60}
                        className="object-contain max-h-12 w-auto"
                      />
                </div>
              ))}
            </Marquee>
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
