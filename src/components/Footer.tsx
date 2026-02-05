"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Instagram, Linkedin, Facebook, Palette, Phone } from "lucide-react";
import { useState } from "react";
import { CalendlyModal } from "./CalendlyModal";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <footer className="relative bg-ink text-sand py-20 overflow-hidden" id="contact">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sienna via-terracotta to-clay opacity-80" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-terracotta/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sage/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 mb-20">
            
            {/* CTA Section */}
            <div className="flex flex-col items-start">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              >
                Let's create <br />
                <span className="text-terracotta italic">something amazing</span>
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-sand/60 text-lg md:text-xl max-w-md mb-8"
              >
                Ready to elevate your brand? I'm currently available for new projects and collaborations.
              </motion.p>
              
              <motion.button 
                onClick={() => setIsModalOpen(true)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative inline-flex items-center gap-3 bg-terracotta text-ink px-8 py-4 rounded-full text-lg font-bold overflow-hidden transition-all hover:bg-sienna hover:text-white cursor-pointer"
              >
                <span>Book a Discovery Call</span>
                <Phone size={20} className="group-hover:rotate-12 transition-transform" />
              </motion.button>
            </div>

            {/* Links & Info */}
            <div className="flex flex-col justify-between md:items-end">
              <div className="flex flex-col gap-8 mb-12 md:text-right">
                <div>
                  <h4 className="text-white/40 uppercase tracking-widest text-xs mb-4">Socials</h4>
                  <ul className="space-y-3">
                    <li>
                      <div className="relative group flex items-center justify-end gap-2 text-lg text-sand/40 cursor-not-allowed">
                        <span>Instagram</span>
                        <ArrowUpRight size={16} className="opacity-20" />
                        <span className="absolute right-0 -top-7 rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-widest text-white opacity-0 transition-opacity group-hover:opacity-100">
                          Under construction
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className="relative group flex items-center justify-end gap-2 text-lg text-sand/40 cursor-not-allowed">
                        <span>Facebook</span>
                        <ArrowUpRight size={16} className="opacity-20" />
                        <span className="absolute right-0 -top-7 rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-widest text-white opacity-0 transition-opacity group-hover:opacity-100">
                          Under construction
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className="relative group flex items-center justify-end gap-2 text-lg text-sand/40 cursor-not-allowed">
                        <span>LinkedIn</span>
                        <ArrowUpRight size={16} className="opacity-20" />
                        <span className="absolute right-0 -top-7 rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-widest text-white opacity-0 transition-opacity group-hover:opacity-100">
                          Under construction
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className="relative group flex items-center justify-end gap-2 text-lg text-sand/40 cursor-not-allowed">
                        <span>Canva</span>
                        <ArrowUpRight size={16} className="opacity-20" />
                        <span className="absolute right-0 -top-7 rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-widest text-white opacity-0 transition-opacity group-hover:opacity-100">
                          Under construction
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="flex flex-col md:items-end gap-2">
                <a href="mailto:smm.mavenicaann@gmail.com" className="text-xl md:text-3xl font-light hover:text-terracotta transition-colors break-all">
                  smm.mavenicaann@gmail.com
                </a>
                <p className="text-sand/40 text-sm">Based in General Santos City, Philippines</p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-sand/40">
            <p>© {currentYear} MAV STUDIO. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-sand transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-sand transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
      
      <CalendlyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        url="https://calendly.com/smm-mavenicaann/30min" 
      />
    </>
  );
}
