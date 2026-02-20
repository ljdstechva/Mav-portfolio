"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";

export default function Magnet({ 
  children, 
  padding = 50, 
  disabled = false, 
  magnetStrength = 2 // Higher number = weaker pull (divisor)
}: { 
  children: React.ReactNode; 
  padding?: number; 
  disabled?: boolean; 
  magnetStrength?: number; 
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current!.getBoundingClientRect();
    
    // Calculate distance from center
    const deltaX = clientX - (left + width / 2);
    const deltaY = clientY - (top + height / 2);
    
    // Apply magnet strength (damping)
    // If strength is 1, it follows mouse exactly. If > 1, it lags/dampens.
    // We'll treat the passed prop as a divisor for subtle effect.
    // In Hero, we passed 30. That's a lot of damping. 
    // Let's adjust the logic: 
    // If we want it to "reach" for the mouse, we usually move it a fraction of the distance.
    const x = deltaX / (magnetStrength > 0 ? magnetStrength : 1);
    const y = deltaY / (magnetStrength > 0 ? magnetStrength : 1);
    
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`inline-block relative ${!disabled ? '!cursor-pointer' : ''}`}
      style={{
        touchAction: "none",
        padding: disabled ? 0 : padding,
        margin: disabled ? 0 : -padding,
      }} // Keep layout size stable while enlarging the magnetic hit area
    >
      {children}
    </motion.div>
  );
}
