"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabaseClient } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Palette,
  Layers,
  Image as ImageIcon,
  Video,
  FileText,
  Aperture,
  MessageSquareQuote,
  LogOut,
  Plus,
  Loader2,
  Trash2,
  UploadCloud,
  X,
  ChevronRight,
  Search
} from "lucide-react";
import clsx from "clsx";

// --- Types ---

type GraphicDesignItem = {
  id: string;
  title: string;
  industry_id?: string | null;
  client?: string | null;
  category?: string | null;
  image_url?: string | null;
  created_at?: string | null;
};

type IndustryItem = {
  id: string;
  name: string;
};

type CarouselItem = {
  id: string;
  industry_id?: string | null;
  client?: string | null;
  title: string;
  description?: string | null;
};

type CarouselImageItem = {
  id: string;
  carousel_id?: string | null;
  image_url?: string | null;
  position?: number | null;
};

type ReelItem = {
  id: string;
  industry_id?: string | null;
  client?: string | null;
  title: string;
  video_url?: string | null;
};

type CopywritingItem = {
  id: string;
  industry_id?: string | null;
  client?: string | null;
  title: string;
  body?: string | null;
};

type PhotoEditingItem = {
  id: string;
  industry_id?: string | null;
  client?: string | null;
  title: string;
  before_image_url?: string | null;
  after_image_url?: string | null;
};

type TestimonialItem = {
  id: string;
  client_name: string;
  role?: string | null;
  company?: string | null;
  quote: string;
  avatar_url?: string | null;
};

type TableKey =
  | "industries"
  | "graphic_designs"
  | "carousels"
  | "carousel_images"
  | "reels"
  | "copywriting"
  | "photo_editing"
  | "testimonials";

type FieldConfig = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "url" | "date" | "textarea";
  helper?: string;
  required?: boolean;
};

const TABLE_CONFIG: Record<TableKey, { label: string; icon: React.ElementType; fields: FieldConfig[] }> = {
  industries: {
    label: "Industries",
    icon: LayoutDashboard,
    fields: [
      { name: "name", label: "Industry Name", required: true, placeholder: "e.g. Beauty & Wellness" },
    ],
  },
  graphic_designs: {
    label: "Graphic Designs",
    icon: Palette,
    fields: [
      { name: "industry_id", label: "Industry ID" }, // In a real app, this would be a select dropdown
      { name: "title", label: "Design Title", required: true },
      { name: "client", label: "Client Name" },
      { name: "category", label: "Category", placeholder: "e.g. Social Media, Branding" },
      { name: "image_url", label: "Image", type: "url", required: true },
    ],
  },
  carousels: {
    label: "Carousels",
    icon: Layers,
    fields: [
      { name: "industry_id", label: "Industry ID" },
      { name: "client", label: "Client Name" },
      { name: "title", label: "Carousel Title", required: true },
      { name: "description", label: "Description", type: "textarea" },
    ],
  },
  carousel_images: {
    label: "Carousel Images",
    icon: ImageIcon,
    fields: [
      { name: "carousel_id", label: "Carousel ID", required: true },
      { name: "image_url", label: "Image", type: "url", required: true },
      { name: "position", label: "Position (Order)", type: "number" },
    ],
  },
  reels: {
    label: "Reels",
    icon: Video,
    fields: [
      { name: "industry_id", label: "Industry ID" },
      { name: "client", label: "Client Name" },
      { name: "title", label: "Reel Title", required: true },
      { name: "video_url", label: "Video URL", type: "url", required: true },
    ],
  },
  copywriting: {
    label: "Copywriting",
    icon: FileText,
    fields: [
      { name: "industry_id", label: "Industry ID" },
      { name: "client", label: "Client Name" },
      { name: "title", label: "Copy Title", required: true },
      { name: "body", label: "Copy Content", type: "textarea", required: true },
    ],
  },
  photo_editing: {
    label: "Photo Editing",
    icon: Aperture,
    fields: [
      { name: "industry_id", label: "Industry ID" },
      { name: "client", label: "Client Name" },
      { name: "title", label: "Edit Title", required: true },
      { name: "before_image_url", label: "Before Image", type: "url", required: true },
      { name: "after_image_url", label: "After Image", type: "url", required: true },
    ],
  },
  testimonials: {
    label: "Testimonials",
    icon: MessageSquareQuote,
    fields: [
      { name: "client_name", label: "Client Name", required: true },
      { name: "role", label: "Role", placeholder: "e.g. CEO" },
      { name: "company", label: "Company" },
      { name: "quote", label: "Quote", type: "textarea", required: true },
      { name: "avatar_url", label: "Avatar Image", type: "url" },
    ],
  },
};

const IMAGE_FIELDS = new Set([
  "image_url",
  "before_image_url",
  "after_image_url",
  "avatar_url",
]);

type LoginState = "idle" | "loading" | "error";
type UploadState = "idle" | "loading" | "error" | "success";

export function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const authed = useMemo(() => Boolean(session), [session]);
  
  // Data State
  const [industries, setIndustries] = useState<IndustryItem[]>([]);
  const [graphicDesigns, setGraphicDesigns] = useState<GraphicDesignItem[]>([]);
  const [carousels, setCarousels] = useState<CarouselItem[]>([]);
  const [carouselImages, setCarouselImages] = useState<CarouselImageItem[]>([]);
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [copywriting, setCopywriting] = useState<CopywritingItem[]>([]);
  const [photoEditing, setPhotoEditing] = useState<PhotoEditingItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  
  const [adminLoaded, setAdminLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // UI State
  const [loginState, setLoginState] = useState<LoginState>("idle");
  const [loginError, setLoginError] = useState("");
  const [selectedTable, setSelectedTable] = useState<TableKey>("graphic_designs");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For mobile responsiveness if needed
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Upload State
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [dragOverField, setDragOverField] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<Record<string, string>>({});
  
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // --- Auth & Data Fetching ---

  const fetchAdminData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch("/api/admin-data", {
        cache: "no-store",
        headers: session
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });
      if (!response.ok) throw new Error("Failed to load admin data");
      const data = await response.json();
      
      setIndustries(data.industries);
      setGraphicDesigns(data.graphicDesigns);
      setCarousels(data.carousels);
      setCarouselImages(data.carouselImages);
      setReels(data.reels);
      setCopywriting(data.copywriting);
      setPhotoEditing(data.photoEditing);
      setTestimonials(data.testimonials);
      
      setAdminLoaded(true);
    } catch (error) {
      console.error(error);
      setAdminLoaded(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data } = await supabaseClient.auth.getSession();
      if (mounted) setSession(data.session ?? null);
    };
    void init();
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) setSession(newSession);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authed && !adminLoaded) {
      void fetchAdminData();
    }
  }, [authed, adminLoaded, fetchAdminData]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginState("loading");
    setLoginError("");
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") ?? "").trim();
    const password = String(form.get("password") ?? "").trim();

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({ email: username, password });
      if (error) throw error;
      setLoginState("idle");
    } catch (error) {
      setLoginState("error");
      setLoginError(error instanceof Error ? error.message : "Login failed");
    }
  };

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    // Clear local state
    setGraphicDesigns([]);
    setCarousels([]);
    setCarouselImages([]);
    setReels([]);
    setCopywriting([]);
    setPhotoEditing([]);
    setTestimonials([]);
    setIndustries([]);
    setAdminLoaded(false);
  };

  // --- Upload Logic ---

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadState("loading");
    setUploadMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const values: Record<string, string> = {};
      TABLE_CONFIG[selectedTable].fields.forEach((field) => {
        values[field.name] = String(form.get(field.name) ?? "").trim();
      });

      const response = await fetch("/api/admin-insert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ table: selectedTable, values }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? "Upload failed");
      }

      setUploadState("success");
      setUploadMessage("Record saved successfully.");
      event.currentTarget.reset();
      setImagePreview({});
      await fetchAdminData();
      
      // Close form after short delay on success
      setTimeout(() => {
        setShowCreateForm(false);
        setUploadState("idle");
        setUploadMessage("");
      }, 1500);

    } catch (error) {
      setUploadState("error");
      setUploadMessage(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const handleImageUpload = async (fieldName: string, file: File | null) => {
    if (!file) return;
    setUploadingField(fieldName);

    try {
      const extension = file.name.split(".").pop() || "png";
      const filePath = `${selectedTable}/${fieldName}/${crypto.randomUUID()}.${extension}`;
      
      const { error } = await supabaseClient.storage.from("portfolio").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/png",
      });

      if (error) throw error;

      const { data } = supabaseClient.storage.from("portfolio").getPublicUrl(filePath);

      if (data.publicUrl) {
        if (inputRefs.current[fieldName]) inputRefs.current[fieldName]!.value = data.publicUrl;
        setImagePreview((prev) => ({ ...prev, [fieldName]: data.publicUrl }));
      }
    } catch (error) {
      console.error(error);
      alert("Image upload failed: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setUploadingField(null);
    }
  };

  const getTableData = () => {
    switch (selectedTable) {
      case "industries": return industries;
      case "graphic_designs": return graphicDesigns;
      case "carousels": return carousels;
      case "carousel_images": return carouselImages;
      case "reels": return reels;
      case "copywriting": return copywriting;
      case "photo_editing": return photoEditing;
      case "testimonials": return testimonials;
      default: return [];
    }
  };

  // --- Render Helpers ---

  if (!authed) {
    return (
      <main className="min-h-screen bg-sand flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl border border-ink/5"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-ink mb-2">MAV STUDIO</h1>
            <p className="text-ink/50 uppercase tracking-widest text-xs">Admin Access</p>
          </div>
          
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <input
                type="email"
                name="username"
                placeholder="Email Address"
                className="w-full bg-sand/50 border border-ink/10 rounded-2xl px-5 py-4 text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/20 transition-all"
                required
              />
            </div>
            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="w-full bg-sand/50 border border-ink/10 rounded-2xl px-5 py-4 text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/20 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loginState === "loading"}
              className="w-full bg-ink text-white rounded-2xl py-4 font-bold uppercase tracking-widest text-sm hover:bg-ink/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loginState === "loading" && <Loader2 className="animate-spin" size={16} />}
              {loginState === "loading" ? "Authenticating..." : "Enter Dashboard"}
            </button>
            {loginState === "error" && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-center text-sm mt-2">
                {loginError}
              </motion.p>
            )}
          </form>
        </motion.div>
      </main>
    );
  }

  const currentData = getTableData();
  const CurrentIcon = TABLE_CONFIG[selectedTable].icon;

  return (
    <div className="min-h-screen bg-sand text-ink flex">
      {/* Sidebar */}
      <aside className={clsx("fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-ink/10 transition-transform duration-300 transform lg:translate-x-0 lg:static", 
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="p-8 border-b border-ink/5">
          <h1 className="font-bold text-2xl tracking-tighter">MAV<span className="font-normal text-ink/40">ADMIN</span></h1>
        </div>
        
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
          {Object.entries(TABLE_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = selectedTable === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedTable(key as TableKey);
                  setShowCreateForm(false);
                }}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
                  isActive ? "bg-ink text-white shadow-lg shadow-ink/20" : "text-ink/60 hover:bg-sand hover:text-ink"
                )}
              >
                <Icon size={18} />
                {config.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-ink/5 bg-white">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 px-4 py-3 rounded-xl transition-colors text-sm font-medium"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto h-screen relative">
        <header className="sticky top-0 z-40 bg-sand/80 backdrop-blur-md border-b border-ink/5 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-ink/5 text-ink">
              <CurrentIcon size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{TABLE_CONFIG[selectedTable].label}</h2>
              <p className="text-sm text-ink/40">{currentData.length} entries found</p>
            </div>
          </div>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="bg-ink text-white px-6 py-3 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-ink/90 transition-all shadow-lg shadow-ink/20"
          >
            <Plus size={18} /> Add New
          </button>
        </header>

        <div className="p-8">
          {currentData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-ink/5">
                <Search size={32} className="text-ink/20" />
              </div>
              <h3 className="text-xl font-medium text-ink mb-2">No entries yet</h3>
              <p className="text-ink/40 max-w-sm mb-8">Start building your portfolio by adding a new {TABLE_CONFIG[selectedTable].label.toLowerCase().slice(0, -1)}.</p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="text-ink font-medium border-b border-ink/20 hover:border-ink pb-0.5 transition-all"
              >
                Create your first entry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {currentData.map((item: any) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl p-5 border border-ink/5 hover:border-ink/20 hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="font-bold text-lg truncate">{item.title || item.client_name || item.name || "Untitled"}</h3>
                        <p className="text-sm text-ink/40 truncate">{item.client || item.role || item.description || "No description"}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-sand flex items-center justify-center text-ink/40">
                         <ChevronRight size={16} />
                      </div>
                    </div>

                    {/* Image Preview if available */}
                    {(item.image_url || item.avatar_url || item.before_image_url) && (
                      <div className="aspect-video w-full bg-sand rounded-2xl mb-4 overflow-hidden relative">
                         <img 
                           src={item.image_url || item.avatar_url || item.before_image_url} 
                           alt="Preview" 
                           className="w-full h-full object-cover"
                         />
                      </div>
                    )}
                    
                    {/* Video Preview if available */}
                    {item.video_url && (
                       <div className="aspect-video w-full bg-black rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden">
                          <p className="text-white/50 text-xs flex items-center gap-2"><Video size={14}/> Video Link</p>
                       </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-ink/5">
                       <span className="text-xs text-ink/30 font-mono uppercase">
                         {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                       </span>
                       {/* Placeholder for delete/edit actions */}
                       {/* <button className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16}/></button> */}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Slide-over Form */}
      <AnimatePresence>
        {showCreateForm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateForm(false)}
              className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-ink/5 flex items-center justify-between bg-sand/30">
                <h3 className="text-xl font-bold">New {TABLE_CONFIG[selectedTable].label.slice(0, -1)}</h3>
                <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-ink/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpload} className="flex-1 overflow-y-auto p-6 space-y-6">
                 {/* Industry Selector - Auto populated for simplicity if needed, or dropdown */}
                 {TABLE_CONFIG[selectedTable].fields.map((field) => {
                   if (field.name === "industry_id" && industries.length > 0) {
                     return (
                       <div key={field.name} className="space-y-2">
                         <label className="text-xs font-bold uppercase tracking-widest text-ink/50">{field.label}</label>
                         <div className="relative">
                            <select 
                              name={field.name} 
                              className="w-full bg-sand/30 border border-ink/10 rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-ink/10 focus:outline-none transition-all"
                            >
                               <option value="">Select Industry...</option>
                               {industries.map(i => (
                                 <option key={i.id} value={i.id}>{i.name}</option>
                               ))}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none text-ink/30" size={16}/>
                         </div>
                       </div>
                     )
                   }
                   if (field.name === "carousel_id" && carousels.length > 0) {
                     return (
                        <div key={field.name} className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-ink/50">{field.label}</label>
                          <div className="relative">
                             <select 
                               name={field.name} 
                               className="w-full bg-sand/30 border border-ink/10 rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-ink/10 focus:outline-none transition-all"
                             >
                                <option value="">Select Carousel...</option>
                                {carousels.map(c => (
                                  <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                             </select>
                             <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none text-ink/30" size={16}/>
                          </div>
                        </div>
                      )
                   }

                   return (
                    <div key={field.name} className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-ink/50 flex justify-between">
                        {field.label}
                        {field.required && <span className="text-terracotta text-[10px]">REQUIRED</span>}
                      </label>
                      
                      {field.type === "textarea" ? (
                        <textarea
                          name={field.name}
                          placeholder={field.placeholder}
                          rows={4}
                          className="w-full bg-sand/30 border border-ink/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ink/10 focus:outline-none transition-all resize-none"
                          required={field.required}
                        />
                      ) : (
                        <div className="space-y-3">
                           <input
                             ref={(el) => { inputRefs.current[field.name] = el; }}
                             type={field.type === "url" ? "text" : field.type || "text"}
                             name={field.name}
                             placeholder={field.placeholder}
                             className="w-full bg-sand/30 border border-ink/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ink/10 focus:outline-none transition-all"
                             required={field.required}
                           />
                           
                           {/* Image Upload Widget */}
                           {IMAGE_FIELDS.has(field.name) && (
                             <div className="bg-sand/50 rounded-xl p-4 border border-dashed border-ink/20 hover:border-ink/40 transition-colors">
                                <input
                                  ref={(el) => { fileInputRefs.current[field.name] = el; }}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleImageUpload(field.name, e.target.files?.[0] ?? null)}
                                />
                                
                                {imagePreview[field.name] ? (
                                  <div className="relative rounded-lg overflow-hidden group">
                                     <img src={imagePreview[field.name]} alt="Preview" className="w-full h-48 object-cover" />
                                     <button 
                                      type="button"
                                      onClick={() => {
                                        setImagePreview(prev => { const n = {...prev}; delete n[field.name]; return n; });
                                        if (inputRefs.current[field.name]) inputRefs.current[field.name]!.value = "";
                                      }}
                                      className="absolute top-2 right-2 bg-white/90 p-2 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                     >
                                       <Trash2 size={16} />
                                     </button>
                                  </div>
                                ) : (
                                  <div 
                                    onClick={() => fileInputRefs.current[field.name]?.click()}
                                    className="flex flex-col items-center justify-center py-6 cursor-pointer text-ink/40 hover:text-ink/70 transition-colors"
                                  >
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                                      {uploadingField === field.name ? <Loader2 className="animate-spin" size={20}/> : <UploadCloud size={20} />}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest">
                                      {uploadingField === field.name ? "Uploading..." : "Click to Upload Image"}
                                    </span>
                                  </div>
                                )}
                             </div>
                           )}
                        </div>
                      )}
                      {field.helper && <p className="text-xs text-ink/40">{field.helper}</p>}
                    </div>
                   );
                 })}
              </form>

              <div className="p-6 border-t border-ink/5 bg-sand/30">
                <button
                  onClick={() => document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
                  disabled={uploadState === "loading"}
                  className="w-full bg-ink text-white rounded-xl py-4 font-bold uppercase tracking-widest text-sm hover:bg-ink/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploadState === "loading" ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Saving...
                    </>
                  ) : (
                    "Save Record"
                  )}
                </button>
                {uploadMessage && (
                   <p className={clsx("text-center text-xs mt-3", uploadState === "error" ? "text-red-500" : "text-emerald-600")}>
                     {uploadMessage}
                   </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
