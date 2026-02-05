"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { getSupabaseClient, getSupabaseConfigError } from "@/lib/supabaseClient";
import BookingModal from "./BookingModal";

type Testimonial = {
  id: string;
  client_name: string;
  role?: string | null;
  company?: string | null;
  quote: string;
  avatar_url?: string | null;
};

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const configError = getSupabaseConfigError();
    if (configError) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    let mounted = true;

    const fetchTestimonials = async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("id, client_name, role, company, quote, avatar_url")
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (!error) {
        setTestimonials(data ?? []);
      }
      setLoading(false);
    };

    void fetchTestimonials();

    return () => {
      mounted = false;
    };
  }, []);

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
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
          ))}
          {!loading && testimonials.length === 0 && (
            <div className="col-span-full rounded-[2rem] border border-ink/5 bg-white p-10 text-center text-ink/50">
              Testimonials coming soon.
            </div>
          )}
        </div>
        
        {/* Call to Action Mini-Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <div className="inline-block p-1 rounded-full border border-ink/10 bg-white shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
             <button 
                onClick={() => setIsBookingOpen(true)}
                className="px-6 py-3 rounded-full bg-ink text-sand font-medium text-sm md:text-base flex items-center gap-2 hover:bg-ink/90 transition-colors"
             >
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span>Join the Happy Clients</span>
             </button>
          </div>
        </motion.div>
      </div>

      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </section>
  );
}

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial, index: number }) {
  const displayRole = useMemo(() => {
    const role = testimonial.role?.trim();
    const company = testimonial.company?.trim();
    if (role && company) return `${role}, ${company}`;
    if (role) return role;
    if (company) return company;
    return "";
  }, [testimonial.company, testimonial.role]);

  const initials = testimonial.client_name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
              "{testimonial.quote}"
            </p>
        </div>

        <div className="flex items-center gap-4 pt-6 border-t border-ink/5">
           <div className="w-12 h-12 rounded-full bg-sand flex items-center justify-center text-ink font-bold text-lg overflow-hidden relative">
              {initials || testimonial.client_name.charAt(0)}
            </div>
            <div>
              <h4 className="text-ink font-bold leading-tight">{testimonial.client_name}</h4>
              {displayRole && (
                <p className="text-ink/50 text-xs uppercase tracking-wider font-semibold mt-1">{displayRole}</p>
              )}
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
