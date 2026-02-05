"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Magnet from "./Magnet";
import TiltedCard from "./TiltedCard";
import BookingModal from "./BookingModal";

export function About() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <section className="pb-24 pt-[150px] bg-white overflow-hidden" id="about">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Image Side - Redesigned with TiltedCard */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative w-full lg:w-1/2 flex justify-center"
          >
            <div className="relative w-full max-w-[400px] aspect-[4/5] sm:max-w-[450px]">
              <TiltedCard
                imageSrc="/About.png"
                altText="Portrait of Mav"
                captionText="Mav Studio - Creative Director"
                containerHeight="100%"
                containerWidth="100%"
                imageHeight="100%"
                imageWidth="100%"
                rotateAmplitude={10}
                scaleOnHover={1.05}
                showMobileWarning={false}
                showTooltip={true}
                displayOverlayContent={true}
                overlayContent={
                  <div className="absolute top-6 left-6 bg-white p-4 rounded-xl shadow-lg flex items-center gap-3 border border-ink/5 pointer-events-none">
                    <div>
                      <p className="text-2xl font-extrabold text-ink uppercase tracking-wider mb-0.5">Mav</p>
                      <p className="text-xs font-semibold text-ink/70 whitespace-nowrap">SMM & Graphic Designer</p>
                    </div>
                  </div>
                }
              />
            </div>
          </motion.div>

          {/* Text Side */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full lg:w-1/2 space-y-8"
          >
            <div className="space-y-2">
              <span className="text-sienna font-bold uppercase tracking-widest text-sm">About Me</span>
            <h2 className="text-4xl md:text-5xl font-serif text-ink leading-tight">
              Strategy-First Social <br />
              <span className="italic text-terracotta">That Looks Good.</span>
            </h2>
            </div>

            <p className="text-lg text-ink/70 leading-relaxed">
              Hi, I&apos;m Mav, a Social Media Manager and Graphic Design Content Creator who helps brands show up consistently with clear strategy and scroll-stopping visuals. I turn your message into content that feels cohesive, on-brand, and built for engagement.
            </p>

            <p className="text-ink/70 leading-relaxed">
              From content planning to design and publishing, I focus on audience-first storytelling, strong visual systems, and measurable growth. Whether you need a full content refresh or ongoing management, I create posts that look beautiful and perform.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {[
                "Content Strategy & Calendars",
                "Social Media Management",
                "Graphic Design & Templates",
                "Campaigns, Reels, & Carousels"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="text-sienna shrink-0" size={20} />
                  <span className="text-ink/80 font-medium">{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-6">
              <Magnet padding={50} magnetStrength={5}>
                <button 
                  onClick={() => setIsBookingOpen(true)}
                  className="px-8 py-3 bg-ink text-sand rounded-full font-medium hover:bg-ink/90 transition-all hover:shadow-lg transform hover:-translate-y-1 cursor-pointer"
                >
                  More About Me
                </button>
              </Magnet>
            </div>
          </motion.div>

        </div>
      </div>

      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </section>
  );
}
