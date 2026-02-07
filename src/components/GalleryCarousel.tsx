"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export type GalleryItem = {
    image: string;
    text: string;
    fullImage?: string;
};

interface GalleryCarouselProps {
    items: GalleryItem[];
    onItemClick: (item: GalleryItem, index: number) => void;
}

export default function GalleryCarousel({ items, onItemClick }: GalleryCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerView, setItemsPerView] = useState(6);
    const [gap, setGap] = useState(16);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            // Mobile < 768px: 2 items
            // Tablet < 1024px: 3 items
            // Desktop >= 1024px: 6 items
            if (width < 768) {
                setItemsPerView(2);
                setGap(12);
            } else if (width < 1024) {
                setItemsPerView(3);
                setGap(16);
            } else {
                setItemsPerView(6);
                setGap(20);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Calculate maximum index to prevent empty space at the end
    const maxIndex = Math.max(0, items.length - itemsPerView);

    // If currentIndex exceeds maxIndex (e.g. after resize), clamp it
    useEffect(() => {
        const newMax = Math.max(0, items.length - itemsPerView);
        if (currentIndex > newMax) {
            setCurrentIndex(newMax);
        }
    }, [itemsPerView, items.length, currentIndex]);

    const nextSlide = () => {
        if (currentIndex >= maxIndex) {
            setCurrentIndex(0); // Optional: Loop back to start
        } else {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const prevSlide = () => {
        if (currentIndex <= 0) {
            setCurrentIndex(maxIndex); // Optional: Loop to end
        } else {
            setCurrentIndex(currentIndex - 1);
        }
    };

    return (
        <div className="relative group w-full px-12 md:px-20">
            {/* Container */}
            <div className="overflow-hidden w-full">
                <motion.div
                    className="flex"
                    style={{ gap: `${gap}px` }}
                    initial={false}
                    animate={{ x: `calc(-${currentIndex} * ((100% + ${gap}px) / ${itemsPerView}))` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    {items.map((item, index) => (
                        <motion.div
                            key={`${index}-${item.image}`}
                            className="relative shrink-0 cursor-pointer overflow-hidden rounded-xl bg-sand/20 aspect-[3/4] group/item"
                            style={{
                                // Calculate width dynamically based on itemsPerView and gap
                                width: `calc((100% - ${(itemsPerView - 1) * gap}px) / ${itemsPerView})`
                            }}
                            onClick={() => onItemClick(item, index)}
                            whileHover={{ y: -5 }}
                        >
                            <img
                                src={item.image}
                                alt={item.text}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover/item:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/20 transition-colors duration-300 flex items-end p-4">
                                <span className="text-white text-sm font-medium opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 truncate w-full">
                                    {item.text}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {items.length > itemsPerView && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 border border-ink/10 text-ink shadow-lg hover:bg-white hover:scale-110 transition-all z-10 cursor-pointer"
                        aria-label="Previous"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 border border-ink/10 text-ink shadow-lg hover:bg-white hover:scale-110 transition-all z-10 cursor-pointer"
                        aria-label="Next"
                    >
                        <ArrowRight size={20} />
                    </button>
                </>
            )}
        </div>
    );
}
