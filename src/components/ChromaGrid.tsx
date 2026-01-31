"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";

interface ChromaItem {
  id: string;
  image: string;
  title: string;
  category?: string;
  description?: string;
  onClick?: () => void;
}

interface ChromaGridProps {
  items: ChromaItem[];
}

function ChromaCard({ item }: { item: ChromaItem }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const xR = useTransform(springX, (val) => val * 1); // Red shift
  const yR = useTransform(springY, (val) => val * 1);
  
  const xB = useTransform(springX, (val) => val * -1); // Blue shift
  const yB = useTransform(springY, (val) => val * -1);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current!.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Calculate distance from center
    const valX = (e.clientX - rect.left - centerX) / 8;
    const valY = (e.clientY - rect.top - centerY) / 8;
    x.set(valX);
    y.set(valY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer bg-black"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      onClick={item.onClick}
    >
      {/* Red Channel */}
      <motion.div 
        className="absolute inset-0 mix-blend-screen z-10 pointer-events-none"
        style={{ x: xR, y: yR }}
      >
         <div className="relative w-full h-full">
            <Image 
              src={item.image} 
              alt={item.title} 
              fill 
              className="object-cover" 
            />
            <div className="absolute inset-0 bg-[#FF0000] mix-blend-multiply" />
         </div>
      </motion.div>

      {/* Green Channel (Base) */}
      <motion.div 
        className="absolute inset-0 mix-blend-screen z-10 pointer-events-none"
      >
         <div className="relative w-full h-full">
            <Image 
              src={item.image} 
              alt={item.title} 
              fill 
              className="object-cover" 
            />
            <div className="absolute inset-0 bg-[#00FF00] mix-blend-multiply" />
         </div>
      </motion.div>

      {/* Blue Channel */}
      <motion.div 
        className="absolute inset-0 mix-blend-screen z-10 pointer-events-none"
        style={{ x: xB, y: yB }}
      >
         <div className="relative w-full h-full">
            <Image 
              src={item.image} 
              alt={item.title} 
              fill 
              className="object-cover" 
            />
            <div className="absolute inset-0 bg-[#0000FF] mix-blend-multiply" />
         </div>
      </motion.div>

      {/* Content Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          {item.category && (
            <p className="text-xs font-bold text-pink-400 uppercase tracking-widest mb-1">
              {item.category}
            </p>
          )}
          <h3 className="text-xl font-bold">{item.title}</h3>
        </div>
      </div>
    </motion.div>
  );
}

export default function ChromaGrid({ items }: ChromaGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {items.map((item) => (
        <ChromaCard key={item.id} item={item} />
      ))}
    </div>
  );
}
