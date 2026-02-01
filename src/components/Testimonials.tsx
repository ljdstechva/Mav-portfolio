"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import Image from "next/image";

const TESTIMONIALS = [
  {
    id: 1,
    name: "Sarah Jenkins",
    role: "Founder, Glow Skincare",
    text: "Mav completely transformed our Instagram presence. Her designs are not just beautiful; they tell our brand story perfectly. Engagement has doubled since we started working together!",
    avatar: "/avatars/avatar-1.png" // Placeholder
  },
  {
    id: 2,
    name: "David Chen",
    role: "Marketing Director, TechFlow",
    text: "The strategic approach Mav brings to social media is unmatched. She doesn't just post; she creates conversations. The graphics are always on-point and professional.",
    avatar: "/avatars/avatar-2.png"
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    role: "Lifestyle Coach",
    text: "I was struggling to find my visual identity until I met Mav. She captured my vibe instantly. My feed looks cohesive, professional, and authentically 'me' now.",
    avatar: "/avatars/avatar-3.png"
  },
  {
    id: 4,
    name: "James Wilson",
    role: "CEO, Urban Eatery",
    text: "Fast, reliable, and incredibly creative. Mav handles our social media so I can focus on running the restaurant. The food photography edits are mouth-watering!",
    avatar: "/avatars/avatar-4.png"
  },
  {
    id: 5,
    name: "Anita Patel",
    role: "Boutique Owner",
    text: "Hiring Mav was the best investment for my business this year. She understands the algorithm and the aesthetics. Highly recommended!",
    avatar: "/avatars/avatar-5.png"
  },
  {
    id: 6,
    name: "Marcus Johnson",
    role: "Fitness Trainer",
    text: "Her graphics stopped the scroll! I've gotten so many new clients just from the improved look of my promotional posts. She's a design wizard.",
    avatar: "/avatars/avatar-6.png"
  }
];

export function Testimonials() {
  return (
    <section className="py-24 px-4 md:px-8 bg-[#FDF8F5] relative overflow-hidden" id="testimonials">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-ink/10 to-transparent"></div>
      
      <div className="container mx-auto">
        <div className="mb-16 text-center">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
           >
             <div className="flex items-center justify-center gap-2 mb-4">
               <span className="p-2 bg-terracotta/10 rounded-full text-terracotta">
                 <HeartIcon />
               </span>
               <span className="text-sm font-bold tracking-widest text-ink/60 uppercase">
                 Client Stories
               </span>
             </div>
             
             <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-ink mb-6">
               Kind Words
             </h2>
             <p className="text-lg text-ink/60 max-w-2xl mx-auto">
               Don't just take my word for it. Here's what my amazing clients have to say about our collaboration.
             </p>
           </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {TESTIMONIALS.map((testimonial, index) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
          ))}
        </div>
        
        {/* Call to Action Mini-Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <div className="inline-block p-1 rounded-full border border-ink/10 bg-white shadow-sm">
             <div className="px-6 py-3 rounded-full bg-ink text-sand font-medium text-sm md:text-base flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span>Join 50+ Happy Clients</span>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial, index }: { testimonial: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white p-8 rounded-[2rem] border border-ink/5 shadow-sm hover:shadow-md transition-shadow relative group"
    >
      <div className="absolute top-8 right-8 text-ink/5">
        <Quote size={80} className="transform rotate-180" />
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
           <div className="flex gap-1 mb-6">
             {[...Array(5)].map((_, i) => (
               <Star key={i} size={14} className="fill-terracotta text-terracotta" />
             ))}
           </div>
           
           <p className="text-ink/80 leading-relaxed text-lg font-medium mb-8">
             "{testimonial.text}"
           </p>
        </div>

        <div className="flex items-center gap-4 pt-6 border-t border-ink/5">
           <div className="w-12 h-12 rounded-full bg-sand flex items-center justify-center text-ink font-bold text-lg overflow-hidden relative">
              {/* Fallback to initials if no image, or just use colored circle for now as generic */}
              {testimonial.name.charAt(0)}
           </div>
           <div>
              <h4 className="text-ink font-bold leading-tight">{testimonial.name}</h4>
              <p className="text-ink/50 text-xs uppercase tracking-wider font-semibold mt-1">{testimonial.role}</p>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function HeartIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="lucide lucide-heart"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  );
}
