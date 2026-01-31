"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Sparkles, 
  Heart, 
  Cpu, 
  Utensils, 
  ShoppingBag, 
  Building2
} from "lucide-react";
import clsx from "clsx";
import ChromaGrid from "./ChromaGrid";

// --- Types ---
type Project = {
  id: string;
  title: string;
  image: string;
  category: string;
};

type Client = {
  id: string;
  name: string;
  description: string;
  logo?: string;
  projects: Project[];
};

type Industry = {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  clients: Client[];
};

// --- Mock Data ---
const INDUSTRIES: Industry[] = [
  {
    id: "beauty",
    name: "Beauty & Wellness",
    icon: Sparkles,
    color: "bg-pink-100 text-pink-600",
    clients: [
      {
        id: "glow-cosmetics",
        name: "Glow Cosmetics",
        description: "Organic skincare brand focusing on natural radiance.",
        projects: [
          { id: "p1", title: "Social Media Campaign", image: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop", category: "Social Media" },
          { id: "p2", title: "Product Packaging", image: "https://images.unsplash.com/photo-1556228720-1957be982260?q=80&w=600&auto=format&fit=crop", category: "Packaging" },
          { id: "p3", title: "Website Redesign", image: "https://images.unsplash.com/photo-1596462502278-27bfdd403cc2?q=80&w=600&auto=format&fit=crop", category: "Web Design" },
        ]
      },
      {
        id: "serene-spa",
        name: "Serene Spa",
        description: "Luxury spa and wellness center.",
        projects: [
          { id: "p4", title: "Brand Identity", image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=600&auto=format&fit=crop", category: "Branding" },
          { id: "p5", title: "Brochure Design", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&auto=format&fit=crop", category: "Print" },
        ]
      }
    ]
  },
  {
    id: "healthcare",
    name: "Healthcare",
    icon: Heart,
    color: "bg-blue-100 text-blue-600",
    clients: [
      {
        id: "med-plus",
        name: "MedPlus Clinics",
        description: "Modern family health clinics.",
        projects: [
          { id: "p6", title: "App Interface", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop", category: "UI/UX" },
          { id: "p7", title: "Informational Posters", image: "https://images.unsplash.com/photo-1584036561566-b93a945cd3e5?q=80&w=600&auto=format&fit=crop", category: "Print" },
        ]
      }
    ]
  },
  {
    id: "tech",
    name: "Technology",
    icon: Cpu,
    color: "bg-indigo-100 text-indigo-600",
    clients: [
      {
        id: "next-gen",
        name: "NextGen Systems",
        description: "AI software solutions.",
        projects: [
          { id: "p8", title: "Dashboard UI", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop", category: "UI/UX" },
        ]
      }
    ]
  },
  {
    id: "food",
    name: "Food & Beverage",
    icon: Utensils,
    color: "bg-orange-100 text-orange-600",
    clients: [
      {
        id: "bistro",
        name: "The Urban Bistro",
        description: "Farm-to-table dining experience.",
        projects: [
          { id: "p9", title: "Menu Design", image: "https://images.unsplash.com/photo-1514362545857-3bc16549766b?q=80&w=600&auto=format&fit=crop", category: "Print" },
        ]
      }
    ]
  },
  {
    id: "retail",
    name: "Retail",
    icon: ShoppingBag,
    color: "bg-emerald-100 text-emerald-600",
    clients: []
  },
  {
    id: "realestate",
    name: "Real Estate",
    icon: Building2,
    color: "bg-slate-100 text-slate-600",
    clients: []
  },
];

export function Portfolio() {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const goBackToIndustries = () => {
    setSelectedClient(null);
    setSelectedIndustry(null);
  };

  const goBackToClients = () => {
    setSelectedClient(null);
  };

  return (
    <section className="py-20 px-4 md:px-8 min-h-screen bg-white" id="portfolio">
      <div className="container mx-auto">
        <div className="mb-12">
           {/* Breadcrumbs / Header */}
           <motion.div layout className="flex items-center gap-2 mb-4 text-sm text-ink/50">
             <span className={clsx("cursor-pointer hover:text-ink", !selectedIndustry && "font-bold text-ink")} onClick={goBackToIndustries}>Portfolio</span>
             {selectedIndustry && (
                <>
                  <span>/</span>
                  <span className={clsx("cursor-pointer hover:text-ink", !selectedClient && "font-bold text-ink")} onClick={goBackToClients}>{selectedIndustry.name}</span>
                </>
             )}
             {selectedClient && (
                <>
                  <span>/</span>
                  <span className="font-bold text-ink">{selectedClient.name}</span>
                </>
             )}
           </motion.div>
           
           <motion.h2 layout className="text-4xl md:text-5xl font-bold text-ink mb-4">
              {selectedClient ? selectedClient.name : selectedIndustry ? selectedIndustry.name : "Select an Industry"}
           </motion.h2>
           
           <motion.p layout className="text-lg text-ink/60 max-w-2xl">
              {selectedClient 
                ? selectedClient.description 
                : selectedIndustry 
                  ? "Explore the clients I've worked with in this sector." 
                  : "I specialize in creating unique identities for diverse industries."}
           </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {!selectedIndustry && (
            <IndustryGrid 
              key="industries" 
              onSelect={setSelectedIndustry} 
            />
          )}

          {selectedIndustry && !selectedClient && (
            <ClientList 
              key="clients" 
              industry={selectedIndustry} 
              onSelect={setSelectedClient} 
              onBack={goBackToIndustries}
            />
          )}

          {selectedClient && (
            <ProjectShowcase 
              key="projects" 
              client={selectedClient} 
              onBack={goBackToClients}
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// --- Sub-components ---

function IndustryGrid({ onSelect }: { onSelect: (i: Industry) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {INDUSTRIES.map((industry, index) => (
        <motion.button
          key={industry.id}
          onClick={() => onSelect(industry)}
          className="group relative p-8 rounded-3xl bg-sand/30 hover:bg-white border-2 border-transparent hover:border-ink/5 text-left transition-all hover:shadow-xl overflow-hidden cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
           <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-2xl transition-colors", industry.color)}>
              <industry.icon size={28} />
           </div>
           
           <h3 className="text-2xl font-bold text-ink mb-2">{industry.name}</h3>
           <p className="text-ink/60 mb-6">{industry.clients.length} Clients</p>
           
           <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
             <div className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center">
               <ArrowLeft className="rotate-180" size={20} />
             </div>
           </div>
        </motion.button>
      ))}
    </motion.div>
  );
}

function ClientList({ industry, onSelect, onBack }: { industry: Industry, onSelect: (c: Client) => void, onBack: () => void }) {
  if (industry.clients.length === 0) {
     return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-sand/30 rounded-3xl"
        >
          <p className="text-xl text-ink/50 mb-6">No clients added to this category yet.</p>
          <button onClick={onBack} className="text-sienna font-bold hover:underline cursor-pointer">Go Back</button>
        </motion.div>
     )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
       <button onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
         <ArrowLeft size={20} /> Back to Industries
       </button>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {industry.clients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(client)}
              className="cursor-pointer group bg-white p-8 rounded-3xl border border-ink/5 hover:border-sienna/30 hover:shadow-lg transition-all"
            >
               <div className="flex justify-between items-start mb-4">
                 <h3 className="text-2xl font-bold text-ink group-hover:text-sienna transition-colors">{client.name}</h3>
                 <span className="bg-sand px-3 py-1 rounded-full text-xs font-bold text-ink/60 uppercase tracking-wide">
                   {client.projects.length} Projects
                 </span>
               </div>
               <p className="text-ink/70 leading-relaxed">{client.description}</p>
            </motion.div>
         ))}
       </div>
    </motion.div>
  );
}

function ProjectShowcase({ client, onBack }: { client: Client, onBack: () => void }) {
  const items = client.projects.map(p => ({
    id: p.id,
    image: p.image,
    title: p.title,
    category: p.category
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-ink/60 hover:text-ink transition-colors cursor-pointer">
         <ArrowLeft size={20} /> Back to Clients
      </button>

      <ChromaGrid items={items} />
    </motion.div>
  );
}
