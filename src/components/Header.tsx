"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    
    // Check initial scroll position
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 pointer-events-none"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={clsx(
          "transition-all duration-500 ease-in-out pointer-events-auto cursor-pointer",
          isScrolled
            ? "px-8 py-2 bg-sand/90 backdrop-blur-md shadow-sm rounded-full border border-ink/5"
            : "px-4 py-2 bg-transparent border-transparent"
        )}
      >
        <div className="font-bold text-3xl md:text-4xl tracking-wider text-ink">
          MAV<span className="font-normal opacity-60">STUDIO</span>
        </div>
      </div>
    </motion.header>
  );
}
