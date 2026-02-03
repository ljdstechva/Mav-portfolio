"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient, getSupabaseConfigError } from "@/lib/supabaseClient";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  LayoutDashboard,

  Palette,
  Layers,
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
  Search,
  ArrowLeft
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

type ClientItem = {
  id: string;
  industry_id: string;
  name: string;
  image_url?: string | null;
  sort_order?: number | null;
  created_at?: string | null;
};

type CarouselImageItem = {
  id: string;
  client?: string | null;
  image_url?: string | null;
  position?: number | null;
  created_at?: string | null;
};

type ReelItem = {
  id: string;
  industry_id?: string | null;
  client?: string | null;
  video_url?: string | null;
};

type CopywritingItem = {
  id: string;
  industry_id?: string | null;
  client?: string | null;
  title: string;
  body?: string | null;
  image_url?: string | null;
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

type AdminListItem = {
  id: string;
  created_at?: string | null;
  title?: string | null;
  client_name?: string | null;
  name?: string | null;
  client?: string | null;
  role?: string | null;
  description?: string | null;
  image_url?: string | null;
  avatar_url?: string | null;
  before_image_url?: string | null;
  after_image_url?: string | null;
  video_url?: string | null;
  category?: string | null;
};

type TableKey =
  | "industries"
  | "clients"
  | "graphic_designs"
  | "carousels"
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

const TABLE_CONFIG: Record<
  TableKey,
  { label: string; singularLabel: string; icon: React.ElementType; fields: FieldConfig[] }
> = {
  industries: {
    label: "Industries",
    singularLabel: "Industry",
    icon: LayoutDashboard,
    fields: [
      { name: "name", label: "Industry Name", required: true, placeholder: "e.g. Beauty & Wellness" },
    ],
  },
  clients: {
    label: "Clients",
    singularLabel: "Client",
    icon: LayoutDashboard,
    fields: [
      { name: "industry_id", label: "Industry" },
      { name: "name", label: "Client Name", required: true, placeholder: "e.g. Acme Corp" },
      { name: "image_url", label: "Client Logo/Image", type: "url" },
      { name: "sort_order", label: "Sort Order", type: "number", placeholder: "0" },
    ],
  },
  graphic_designs: {
    label: "Graphic Designs",
    singularLabel: "Graphic Design",
    icon: Palette,
    fields: [
      { name: "industry_id", label: "Industry ID" },
      { name: "client", label: "Client Name" },
      { name: "image_url", label: "Image", type: "url", required: true },
    ],
  },
  carousels: {
    label: "Carousels",
    singularLabel: "Carousel",
    icon: Layers,
    fields: [
      { name: "client", label: "Client Name", required: true },
      { name: "image_url", label: "Image", type: "url", required: true },
      { name: "position", label: "Position (Order)", type: "number" },
    ],
  },
  reels: {
    label: "Reels",
    singularLabel: "Reel",
    icon: Video,
    fields: [
      { name: "video_url", label: "Video URL", type: "url", required: true },
    ],
  },
  copywriting: {
    label: "Copywriting",
    singularLabel: "Copywriting",
    icon: FileText,
    fields: [
      { name: "image_url", label: "Copywriting Image", type: "url", required: true },
    ],
  },
  photo_editing: {
    label: "Photo Editing",
    singularLabel: "Photo Edit",
    icon: Aperture,
    fields: [
      { name: "before_image_url", label: "Before Image", type: "url", required: true },
      { name: "after_image_url", label: "After Image", type: "url", required: true },
    ],
  },
  testimonials: {
    label: "Testimonials",
    singularLabel: "Testimonial",
    icon: MessageSquareQuote,
    fields: [
      { name: "client_name", label: "Client Name", required: true },
      { name: "quote", label: "Quote", type: "textarea", required: true },
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
type DeleteState = "idle" | "loading" | "error";

type CarouselUploadItem = {
  id: string;
  file: File;
  previewUrl: string;
};

export function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const supabaseConfigError = getSupabaseConfigError();
  const [session, setSession] = useState<Session | null>(null);
  const authed = useMemo(() => Boolean(session), [session]);
  const supabase = useMemo(() => {
    if (supabaseConfigError) return null;
    return getSupabaseClient();
  }, [supabaseConfigError]);

  // Data State
  const [industries, setIndustries] = useState<IndustryItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [graphicDesigns, setGraphicDesigns] = useState<GraphicDesignItem[]>([]);
  const [carousels, setCarousels] = useState<CarouselImageItem[]>([]);
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [copywriting, setCopywriting] = useState<CopywritingItem[]>([]);
  const [photoEditing, setPhotoEditing] = useState<PhotoEditingItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);

  const [adminLoaded, setAdminLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [adminDataError, setAdminDataError] = useState<string | null>(null);

  // UI State
  const [loginState, setLoginState] = useState<LoginState>("idle");
  const [loginError, setLoginError] = useState("");
  const [selectedTable, setSelectedTable] = useState<TableKey>("graphic_designs");
  const [selectedIndustryId, setSelectedIndustryId] = useState<string | null>(null);
  const [selectedCarouselClient, setSelectedCarouselClient] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For mobile responsiveness if needed
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTableOverride, setCreateTableOverride] = useState<TableKey | null>(null);


  // Upload State
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [dragOverField, setDragOverField] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<Record<string, string>>({});
  const [batchImages, setBatchImages] = useState<{ id: string; url: string }[]>([]);
  const [previewModal, setPreviewModal] = useState<
    | null
    | {
      type: "single" | "beforeAfter";
      title?: string;
      image?: string | null;
      before?: string | null;
      after?: string | null;
    }
  >(null);
  const [industryDeletePrompt, setIndustryDeletePrompt] = useState<{ id: string; name: string } | null>(null);
  const [industryDeleteText, setIndustryDeleteText] = useState("");
  const [industryDeleteState, setIndustryDeleteState] = useState<DeleteState>("idle");
  const [industryDeleteError, setIndustryDeleteError] = useState("");
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const [selectedClientImage, setSelectedClientImage] = useState<string | null>(null);
  const [previewCarouselIndex, setPreviewCarouselIndex] = useState(0);
  const [clientDeletePrompt, setClientDeletePrompt] = useState<{ industryId: string; name: string } | null>(null);
  const [clientDeleteText, setClientDeleteText] = useState("");
  const [clientDeleteState, setClientDeleteState] = useState<DeleteState>("idle");
  const [clientDeleteError, setClientDeleteError] = useState("");
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const createFormRef = useRef<HTMLFormElement | null>(null);

  // --- Auth & Data Fetching ---

  const fetchAdminData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setAdminDataError(null);
      const response = await fetch("/api/admin-data", {
        cache: "no-store",
        headers: session
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });
      if (!response.ok) {
        let message = "Failed to load admin data";
        try {
          const payload = await response.json();
          if (payload?.message) message = payload.message;
        } catch (error) {
          // ignore json parse errors
        }

        if (response.status === 401) {
          setAdminDataError("Your session expired. Please sign in again.");
          if (supabase) {
            await supabase.auth.signOut();
            setSession(null);
          }
          setAdminLoaded(true);
          return;
        }

        setAdminDataError(message);
        setAdminLoaded(true);
        return;
      }

      const data = await response.json();
      console.log("Fetched admin data:", data);

      setIndustries(data.industries);
      setClients(data.clients ?? []);
      setGraphicDesigns(data.graphicDesigns);
      setCarousels(data.carousels ?? []);
      setReels(data.reels);
      setCopywriting(data.copywriting);
      setPhotoEditing(data.photoEditing);
      setTestimonials(data.testimonials);

      setAdminLoaded(true);
    } catch (error) {
      setAdminDataError(error instanceof Error ? error.message : "Failed to load admin data");
      setAdminLoaded(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [session, supabase]);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setSession(data.session ?? null);
    };
    void init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) setSession(newSession);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showCreateForm) {
      setBatchImages([]);
      setImagePreview({});
      setDragOverField(null);
      setUploadState("idle");
      setUploadMessage("");
    }
  }, [showCreateForm]);


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
      if (!supabase) {
        throw new Error(supabaseConfigError ?? "Supabase client is not configured.");
      }
      const { error } = await supabase.auth.signInWithPassword({ email: username, password });
      if (error) throw error;
      setLoginState("idle");
    } catch (error) {
      setLoginState("error");
      setLoginError(error instanceof Error ? error.message : "Login failed");
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    // Clear local state
    setGraphicDesigns([]);
    setClients([]);
    setCarousels([]);
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
    const formElement = event.currentTarget;
    setUploadState("loading");
    setUploadMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const values: Record<string, string> = {};

      // Determine the table to use (clients when in graphic_designs with industry selected)
      let targetTable = createTableOverride ?? selectedTable;
      if (!createTableOverride && selectedTable === "graphic_designs" && selectedIndustryId) {
        targetTable = "clients";
      }

      TABLE_CONFIG[targetTable].fields.forEach((field) => {
        if (field.name !== "image_url" || targetTable !== "graphic_designs") {
          values[field.name] = String(form.get(field.name) ?? "").trim();
        }
      });

      // Auto-assign industry_id for clients when inside an industry
      if (targetTable === "clients" && selectedIndustryId) {
        values.industry_id = selectedIndustryId;
        // Auto-calculate sort_order based on existing clients count
        const existingClients = clients.filter(c => c.industry_id === selectedIndustryId);
        values.sort_order = String(existingClients.length);
      }

      if (targetTable === "carousels") {
        if (!values.client) {
          throw new Error("Client name is required.");
        }
        if (batchImages.length === 0) {
          throw new Error("Please upload at least one carousel image.");
        }

      } else if (targetTable === "copywriting") {
        if (!values.image_url) {
          throw new Error("Please upload a copywriting image.");
        }

      } else if (targetTable === "photo_editing") {
        if (!values.before_image_url || !values.after_image_url) {
          throw new Error("Please upload both before and after images.");
        }

      }

      if (targetTable === "testimonials" && editingTestimonial) {
        const response = await fetch("/api/admin-update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            table: "testimonials",
            id: editingTestimonial.id,
            values: {
              client_name: values.client_name,
              quote: values.quote,
            },
          }),
        });

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.message ?? "Update failed");
        }
      // Carousel Images - Direct Supabase Insert
      } else if (targetTable === "carousels") {
        if (!supabase) {
          throw new Error("Supabase client is not configured.");
        }

        const clientName = String(values.client ?? "").trim();
        const existingPositions = carousels
          .filter((item) => (item.client ?? "").trim() === clientName)
          .map((item) => item.position ?? 0);
        const basePosition = existingPositions.length > 0
          ? Math.max(...existingPositions) + 1
          : 0;

        const carouselRecords = batchImages.map((image, index) => ({
          client: clientName,
          image_url: image.url,
          position: basePosition + index,
        }));

        const { error } = await supabase
          .from("carousels")
          .insert(carouselRecords);

        if (error) {
          throw new Error(error.message);
        }
        // Batch handling for clients with multiple images
      } else if (targetTable === "clients" && batchImages.length > 0) {
        const baseSortOrder = selectedIndustryId
          ? clients.filter(c => c.industry_id === selectedIndustryId).length
          : clients.length;

        for (let index = 0; index < batchImages.length; index += 1) {
          const image = batchImages[index];
          const recordValues = {
            ...values,
            image_url: image.url,
            sort_order: String(baseSortOrder + index),
          };

          const response = await fetch("/api/admin-insert", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify({ table: targetTable, values: recordValues }),
          });

          if (!response.ok) {
            const payload = await response.json();
            throw new Error(payload.message ?? "Batch upload failed");
          }
        }
      } else if (targetTable === "graphic_designs" && batchImages.length > 0) {
        // Special handling for Graphic Designs batch upload
        for (const image of batchImages) {
          const recordValues = { ...values, image_url: image.url };

          const response = await fetch("/api/admin-insert", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify({ table: targetTable, values: recordValues }),
          });

          if (!response.ok) {
            const payload = await response.json();
            throw new Error(payload.message ?? "Batch upload failed");
          }
        }
      } else {
        // Special handling for Graphic Designs batch upload
        // Standard single record upload
        const response = await fetch("/api/admin-insert", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ table: targetTable, values }),
        });

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.message ?? "Upload failed");
        }
      }

      setUploadState("success");
      setUploadMessage("Record(s) saved successfully.");
      formElement?.reset();
      setImagePreview({});
      setBatchImages([]);
      setEditingTestimonial(null);
      await fetchAdminData();

      // Close form after short delay on success
      setTimeout(() => {
        setShowCreateForm(false);
        setUploadState("idle");
        setUploadMessage("");
        setCreateTableOverride(null);
      }, 1500);

    } catch (error) {
      setUploadState("error");
      setUploadMessage(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const handleImageUpload = async (fieldName: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingField(fieldName);

    try {
      if (!supabase) {
        throw new Error(supabaseConfigError ?? "Supabase client is not configured.");
      }

      const targetTable = createTableOverride ?? selectedTable;

      if (targetTable === "clients" && fieldName === "image_url") {
        const newImages: { id: string; url: string }[] = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const extension = file.name.split(".").pop() || "png";
          const filePath = `${targetTable}/${fieldName}/${crypto.randomUUID()}.${extension}`;

          const { error } = await supabase.storage.from("portfolio").upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "image/png",
          });

          if (error) throw error;

          const { data } = supabase.storage.from("portfolio").getPublicUrl(filePath);
          if (data.publicUrl) {
            newImages.push({ id: crypto.randomUUID(), url: data.publicUrl });
          }
        }

        setBatchImages(prev => [...prev, ...newImages]);

        // Batch upload for clients when inside an industry
      } else if (targetTable === "graphic_designs" && selectedIndustryId && fieldName === "image_url") {
        const newImages: { id: string; url: string }[] = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const extension = file.name.split(".").pop() || "png";
          const filePath = `${targetTable}/${fieldName}/${crypto.randomUUID()}.${extension}`;

          const { error } = await supabase.storage.from("portfolio").upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "image/png",
          });

          if (error) throw error;

          const { data } = supabase.storage.from("portfolio").getPublicUrl(filePath);
          if (data.publicUrl) {
            newImages.push({ id: crypto.randomUUID(), url: data.publicUrl });
          }
        }

        setBatchImages(prev => [...prev, ...newImages]);

        // If Graphic Designs without industry selected (batch mode for designs)
      } else if (targetTable === "graphic_designs" && !selectedIndustryId && fieldName === "image_url") {
        const newImages: { id: string; url: string }[] = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const extension = file.name.split(".").pop() || "png";
          const filePath = `${targetTable}/${fieldName}/${crypto.randomUUID()}.${extension}`;

          const { error } = await supabase.storage.from("portfolio").upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "image/png",
          });

          if (error) throw error;

          const { data } = supabase.storage.from("portfolio").getPublicUrl(filePath);
          if (data.publicUrl) {
            newImages.push({ id: crypto.randomUUID(), url: data.publicUrl });
          }
        }

        setBatchImages(prev => [...prev, ...newImages]);

      } else if (targetTable === "carousels" && fieldName === "image_url") {
        const newImages: { id: string; url: string }[] = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const extension = file.name.split(".").pop() || "png";
          const filePath = `${targetTable}/${fieldName}/${crypto.randomUUID()}.${extension}`;

          const { error } = await supabase.storage.from("portfolio").upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "image/png",
          });

          if (error) throw error;

          const { data } = supabase.storage.from("portfolio").getPublicUrl(filePath);
          if (data.publicUrl) {
            newImages.push({ id: crypto.randomUUID(), url: data.publicUrl });
          }
        }

        setBatchImages(prev => [...prev, ...newImages]);
      } else {
        // Single image upload
        const file = files[0];
        const extension = file.name.split(".").pop() || "png";
        const filePath = `${targetTable}/${fieldName}/${crypto.randomUUID()}.${extension}`;

        const { error } = await supabase.storage.from("portfolio").upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/png",
        });

        if (error) throw error;

        const { data } = supabase.storage.from("portfolio").getPublicUrl(filePath);

        if (data.publicUrl) {
          if (inputRefs.current[fieldName]) inputRefs.current[fieldName]!.value = data.publicUrl;
          setImagePreview((prev) => ({ ...prev, [fieldName]: data.publicUrl }));
        }
      }

    } catch (error) {
      console.error(error);
      alert("Image upload failed: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setUploadingField(null);
    }
  };

  const handleIndustryDelete = async () => {
    if (!industryDeletePrompt) return;
    if (industryDeleteText.trim() !== "DELETE") {
      setIndustryDeleteError("Type DELETE to confirm.");
      return;
    }

    setIndustryDeleteState("loading");
    setIndustryDeleteError("");

    try {
      const response = await fetch("/api/admin-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ table: "industries", id: industryDeletePrompt.id }),
      });

      if (!response.ok) {
        let message = "Delete failed";
        try {
          const payload = await response.json();
          if (payload?.message) message = payload.message;
        } catch (error) {
          // ignore json parse errors
        }
        throw new Error(message);
      }

      setIndustryDeleteState("idle");
      setIndustryDeletePrompt(null);
      setIndustryDeleteText("");
      setSelectedIndustryId(null);
      await fetchAdminData();
    } catch (error) {
      setIndustryDeleteState("error");
      setIndustryDeleteError(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const handleClientDelete = async () => {
    if (!clientDeletePrompt) return;
    if (clientDeleteText.trim() !== "DELETE") {
      setClientDeleteError("Type DELETE to confirm.");
      return;
    }

    setClientDeleteState("loading");
    setClientDeleteError("");

    try {
      const response = await fetch("/api/admin-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          table: "clients",
          id: clientDeletePrompt.industryId,
          industry_id: clientDeletePrompt.industryId,
          name: clientDeletePrompt.name,
        }),
      });

      if (!response.ok) {
        let message = "Delete failed";
        try {
          const payload = await response.json();
          if (payload?.message) message = payload.message;
        } catch (error) {
          // ignore json parse errors
        }
        throw new Error(message);
      }

      setClientDeleteState("idle");
      setClientDeletePrompt(null);
      setClientDeleteText("");
      setSelectedClientName(null);
      await fetchAdminData();
    } catch (error) {
      setClientDeleteState("error");
      setClientDeleteError(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const getIndustryName = (id?: string | null) => {
    if (!id) return null;
    return industries.find((i) => i.id === id)?.name;
  };

  const carouselPreviewImages = useMemo(() => {
    if (!selectedCarouselClient) return [] as CarouselImageItem[];
    return carousels
      .filter((image) => (image.client ?? "").trim() === selectedCarouselClient)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [carousels, selectedCarouselClient]);

  const currentPreviewImage = carouselPreviewImages[previewCarouselIndex]?.image_url ?? null;

  const closeCreateForm = () => {
    setShowCreateForm(false);
    setCreateTableOverride(null);
    setEditingTestimonial(null);
  };

  const formTable = createTableOverride ?? selectedTable;
  const showClientForm = selectedTable === "graphic_designs" && selectedIndustryId && !createTableOverride;
  const showGraphicDesignsForm = formTable === "graphic_designs" && !selectedIndustryId;

  useEffect(() => {
    setSelectedClientName(null);
    setSelectedClientImage(null);
    setClientDeletePrompt(null);
  }, [selectedIndustryId]);
  const showCarouselForm = formTable === "carousels";
  const showCopywritingForm = formTable === "copywriting";
  const showPhotoEditingForm = formTable === "photo_editing";
  const fieldsToRender = formTable === "testimonials"
    ? TABLE_CONFIG[formTable].fields.filter((field) => ["client_name", "quote"].includes(field.name))
    : TABLE_CONFIG[formTable].fields;
  const isEditingTestimonial = formTable === "testimonials" && Boolean(editingTestimonial);

  if (!mounted) {
    return null;
  }

  if (supabaseConfigError) {
    return (
      <main className="min-h-screen bg-sand flex items-center justify-center p-6">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-white rounded-[32px] p-8 shadow-2xl border border-ink/5"
        >
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-ink mb-2">MAV STUDIO</h1>
            <p className="text-ink/50 uppercase tracking-widest text-xs">Admin Setup</p>
          </div>
          <div className="rounded-2xl bg-sand/60 border border-ink/10 p-5 text-ink">
            <p className="text-sm font-semibold mb-2">Supabase configuration is missing.</p>
            <p className="text-sm text-ink/70">{supabaseConfigError}</p>
            <p className="text-xs text-ink/50 mt-4">
              Add the values to your environment and restart the dev server.
            </p>
          </div>
        </motion.div>
      </main>
    );
  }

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

  const getTableData = (): AdminListItem[] => {
    switch (selectedTable) {
      case "industries": return industries;
      case "clients":
        if (selectedIndustryId) {
          return clients.filter(item => item.industry_id === selectedIndustryId) as AdminListItem[];
        }
        return clients as AdminListItem[];
      case "graphic_designs":
        if (!selectedIndustryId) return industries as AdminListItem[]; // Show industries first
        // When industry is selected, show clients for that industry
        return clients.filter(item => item.industry_id === selectedIndustryId) as AdminListItem[];
      case "carousels": return carousels as AdminListItem[];
      case "reels": return reels;
      case "copywriting": return copywriting;
      case "photo_editing": return photoEditing;
      case "testimonials": return testimonials;
      default: return [];
    }
  };

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
          {Object.entries(TABLE_CONFIG)
            .filter(([key]) => (
              [
                "graphic_designs",
                "carousels",
                "reels",
                "copywriting",
                "photo_editing",
                "testimonials",
              ] as TableKey[]
            ).includes(key as TableKey))
            .map(([key, config]) => {
              const Icon = config.icon;
              const isActive = selectedTable === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedTable(key as TableKey);
                    setSelectedIndustryId(null);
                    setSelectedCarouselClient(null);
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
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {selectedTable === "graphic_designs" && selectedIndustryId && (
                  <span
                    onClick={() => setSelectedIndustryId(null)}
                    className="cursor-pointer text-ink/40 hover:text-ink transition-colors flex items-center gap-1"
                  >
                    Industries <ChevronRight size={20} />
                  </span>
                )}
                {selectedTable === "graphic_designs" && selectedIndustryId
                  ? industries.find(i => i.id === selectedIndustryId)?.name
                  : TABLE_CONFIG[selectedTable].label}
              </h2>
              <p className="text-sm text-ink/40">
                {selectedTable === "graphic_designs" && !selectedIndustryId
                  ? `${industries.length} industries`
                  : `${currentData.length} entries found`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedTable === "graphic_designs" && (
              <button
                onClick={() => {
                  setCreateTableOverride("industries");
                  setShowCreateForm(true);
                }}
                className="bg-white text-ink px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2 border border-ink/10 hover:border-ink/30 hover:bg-sand transition-all"
              >
                <Plus size={18} /> Add Industry
              </button>
            )}
            {(selectedTable !== "graphic_designs" || selectedIndustryId) && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-ink text-white px-6 py-3 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-ink/90 transition-all shadow-lg shadow-ink/20"
              >
                <Plus size={18} /> Add New
              </button>
            )}
          </div>
        </header>

        <div className="p-8">
          {adminDataError && (

            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {adminDataError}
            </div>
          )}

          {selectedTable === "graphic_designs" && selectedIndustryId ? (
            <div className="flex flex-col md:flex-row gap-6 items-start h-full">
              {/* Left: Industry Card */}
              <div className="w-full md:w-80 flex-shrink-0">
                <div className="bg-ink text-white rounded-3xl p-6 shadow-xl sticky top-24">
                  <h3 className="font-bold text-xl">{industries.find(i => i.id === selectedIndustryId)?.name}</h3>
                  <p className="text-white/60 mt-1 text-sm">
                    {clients.filter(c => c.industry_id === selectedIndustryId).length} Images
                  </p>
                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      onClick={() => setSelectedIndustryId(null)}
                      className="text-xs uppercase tracking-widest font-bold opacity-50 hover:opacity-100 flex items-center gap-2 transition-opacity"
                    >
                      <ArrowLeft size={14} /> Back to Industries
                    </button>
                    <button
                      onClick={() => {
                        const name = industries.find(i => i.id === selectedIndustryId)?.name ?? "Industry";
                        setIndustryDeletePrompt({ id: selectedIndustryId, name });
                        setIndustryDeleteText("");
                        setIndustryDeleteError("");
                      }}
                      className="text-xs uppercase tracking-widest font-bold text-red-300 hover:text-red-200 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={14} /> Delete Industry
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Clients Container */}
              <div className="flex-1 w-full min-h-[50vh] bg-white/40 rounded-3xl border border-ink/5 p-6">
                {clients.filter(c => c.industry_id === selectedIndustryId).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20">
                    <h3 className="text-lg font-bold text-ink mb-1">No clients yet</h3>
                    <p className="text-ink/40 text-sm mb-6">Add a client or design to this industry.</p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-ink text-white px-5 py-3 rounded-xl font-medium text-sm hover:bg-ink/90 transition-all shadow-lg shadow-ink/10"
                    >
                      Add First Client
                    </button>
                  </div>
                ) : (
                  <>
                    {selectedClientName ? (
                      <>
                        <button
                          onClick={() => setSelectedClientName(null)}
                          className="mb-4 text-xs uppercase tracking-widest font-bold text-ink/50 hover:text-ink flex items-center gap-2 transition-colors"
                        >
                          <ArrowLeft size={14} /> Back to Clients
                        </button>
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <h3 className="text-lg font-bold text-ink">{selectedClientName}</h3>
                          <button
                            type="button"
                            onClick={() => {
                              if (!selectedIndustryId) return;
                              setClientDeletePrompt({ industryId: selectedIndustryId, name: selectedClientName });
                              setClientDeleteText("");
                              setClientDeleteError("");
                            }}
                            className="text-xs uppercase tracking-widest font-bold text-red-500 hover:text-red-600 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 size={14} /> Delete Client
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {clients
                            .filter(c => c.industry_id === selectedIndustryId && c.name === selectedClientName)
                            .map((clientImage) => (
                              <button
                                key={clientImage.id}
                                type="button"
                                onClick={() => setSelectedClientImage(clientImage.image_url ?? null)}
                                className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-white hover:border-ink/20 transition-colors"
                              >
                                {clientImage.image_url ? (
                                  <img
                                    src={clientImage.image_url}
                                    alt={clientImage.name}
                                    className="h-28 w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-28 items-center justify-center text-xs text-ink/40">
                                    No image
                                  </div>
                                )}
                              </button>
                            ))}
                        </div>
                      </>
                    ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {Array.from(
                          clients
                            .filter(c => c.industry_id === selectedIndustryId)
                            .reduce((map, client) => {
                              const key = client.name || "Untitled";
                              if (!map.has(key)) map.set(key, [] as ClientItem[]);
                              map.get(key)!.push(client);
                              return map;
                            }, new Map<string, ClientItem[]>())
                        ).map(([name, items]) => (
                          <motion.div
                            key={name}
                            onClick={() => setSelectedClientName(name)}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-2xl p-4 border border-ink/5 hover:border-ink/20 hover:shadow-lg transition-all text-left cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base truncate">{name}</h3>
                                <p className="text-xs text-ink/40">{items.length} images</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (!selectedIndustryId) return;
                                    setClientDeletePrompt({ industryId: selectedIndustryId, name });
                                    setClientDeleteText("");
                                    setClientDeleteError("");
                                  }}
                                  className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <div className="w-8 h-8 rounded-full bg-sand flex items-center justify-center text-ink/40">
                                  <ChevronRight size={16} />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : selectedTable === "carousels" && selectedCarouselClient ? (
            <div className="flex flex-col md:flex-row gap-6 items-start h-full">
              <div className="w-full md:w-80 flex-shrink-0">
                <div className="bg-ink text-white rounded-3xl p-6 shadow-xl sticky top-24">
                  <h3 className="font-bold text-xl">
                    {selectedCarouselClient}
                  </h3>
                  <p className="text-white/60 mt-1 text-sm">
                    {carouselPreviewImages.length} Images
                  </p>
                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setSelectedCarouselClient(null);
                        setPreviewCarouselIndex(0);
                      }}
                      className="text-xs uppercase tracking-widest font-bold opacity-50 hover:opacity-100 flex items-center gap-2 transition-opacity"
                    >
                      <ArrowLeft size={14} /> Back to Clients
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full min-h-[50vh] bg-white/40 rounded-3xl border border-ink/5 p-6">
                {carouselPreviewImages.length === 0 ? (
                  <p className="text-sm text-ink/40 text-center">No images in this carousel yet.</p>
                ) : (
                  <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
                    {carouselPreviewImages.map((image) => (
                      <div key={image.id} className="rounded-xl overflow-hidden bg-sand border border-ink/10">
                        {image.image_url ? (
                          <img
                            src={image.image_url}
                            alt={selectedCarouselClient ?? "Carousel image"}
                            className="w-full h-full object-cover aspect-[4/5]"
                          />
                        ) : (
                          <div className="flex items-center justify-center text-xs text-ink/40 aspect-[4/5]">
                            No image
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {currentData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-ink/5">
                    <Search size={32} className="text-ink/20" />
                  </div>
                  {selectedTable === "industries" ? (
                    <>
                      <h3 className="text-xl font-medium text-ink mb-2">No industries yet</h3>
                      <p className="text-ink/40 max-w-sm mb-8">Add your first industry to organize work across the dashboard.</p>
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="text-ink font-medium border-b border-ink/20 hover:border-ink pb-0.5 transition-all"
                      >
                        Add new industry
                      </button>
                    </>
                  ) : selectedTable === "graphic_designs" ? (
                    // Inside an industry but empty
                    selectedIndustryId ? (
                      <>
                        <h3 className="text-xl font-medium text-ink mb-2">No graphic designs yet</h3>
                        <p className="text-ink/40 max-w-sm mb-8">Add a client or design to this industry.</p>
                        <button
                          onClick={() => setShowCreateForm(true)}
                          className="text-ink font-medium border-b border-ink/20 hover:border-ink pb-0.5 transition-all"
                        >
                          Add first client
                        </button>
                      </>
                    ) : (
                      // No industries (Top level)
                      <>
                        <h3 className="text-xl font-medium text-ink mb-2">No industries found</h3>
                        <p className="text-ink/40 max-w-sm mb-8">You need to create an industry first.</p>
                        <button
                          onClick={() => {
                            setCreateTableOverride("industries");
                            setShowCreateForm(true);
                          }}
                          className="text-ink font-medium border-b border-ink/20 hover:border-ink pb-0.5 transition-all"
                        >
                          Add new industry
                        </button>
                      </>
                    )
                  ) : (
                    <>
                      <h3 className="text-xl font-medium text-ink mb-2">No entries yet</h3>
                      <p className="text-ink/40 max-w-sm mb-8">Start building your portfolio by adding a new {TABLE_CONFIG[selectedTable].singularLabel.toLowerCase()}.</p>
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="text-ink font-medium border-b border-ink/20 hover:border-ink pb-0.5 transition-all"
                      >
                        Create your first entry
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {/* Special Render for Top Level Graphic Designs (Industry List) */}
                    {selectedTable === "graphic_designs" && !selectedIndustryId ? (
                      currentData.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => setSelectedIndustryId(item.id)}
                          className="bg-white rounded-3xl p-6 border border-ink/5 hover:border-ink/20 hover:shadow-xl transition-all cursor-pointer group flex items-center justify-between"
                        >
                          <div>
                            <h3 className="font-bold text-xl">{item.name || item.title}</h3>
                            <p className="text-sm text-ink/40 mt-1">
                              {new Set(
                                clients
                                  .filter(c => c.industry_id === item.id)
                                  .map(c => (c.name ?? "").trim())
                                  .filter(Boolean)
                              ).size} Clients
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-sand group-hover:bg-ink group-hover:text-white transition-colors flex items-center justify-center text-ink/40">
                            <ChevronRight size={20} />
                          </div>
                        </motion.div>
                      ))
                    ) : selectedTable === "carousels" ? (
                      Array.from(
                        carousels
                          .filter((item) => (item.client ?? "").trim())
                          .reduce((map, item) => {
                            const key = (item.client ?? "").trim();
                            if (!map.has(key)) map.set(key, [] as CarouselImageItem[]);
                            map.get(key)!.push(item);
                            return map;
                          }, new Map<string, CarouselImageItem[]>())
                      ).map(([name, items]) => (
                        <motion.div
                          key={name}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-white rounded-3xl p-5 border border-ink/5 hover:border-ink/20 hover:shadow-xl transition-all group"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCarouselClient(name);
                              setPreviewCarouselIndex(0);
                            }}
                            className="w-full text-left"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 min-w-0 pr-4">
                                <h3 className="font-bold text-lg truncate">{name}</h3>
                                <p className="text-sm text-ink/40 truncate">{items.length} images</p>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-sand flex items-center justify-center text-ink/40">
                                <ChevronRight size={16} />
                              </div>
                            </div>
                          </button>
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-ink/5">
                            <span className="text-xs text-ink/30 font-mono uppercase">
                              {items[0]?.created_at ? new Date(items[0].created_at).toLocaleDateString() : "N/A"}
                            </span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      currentData.map((item) => {
                        const imageSrc = item.image_url ?? item.avatar_url ?? item.before_image_url ?? item.after_image_url ?? undefined;
                        const beforeImage = (item as any).before_image_url ?? null;
                        const afterImage = (item as any).after_image_url ?? null;
                        const canShowBeforeAfter = Boolean(beforeImage && afterImage);
                        const previewTitle = item.title || item.client_name || item.name || "Preview";
                        const industryName = 'industry_id' in item ? getIndustryName((item as any).industry_id) : null;

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={() => {
                              if (selectedTable !== "testimonials") return;
                              setEditingTestimonial(item as TestimonialItem);
                              setUploadState("idle");
                              setUploadMessage("");
                              setShowCreateForm(true);
                            }}
                            className={clsx(
                              "bg-white rounded-3xl p-5 border border-ink/5 hover:border-ink/20 hover:shadow-xl transition-all group",
                              selectedTable === "testimonials" && "cursor-pointer"
                            )}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 min-w-0 pr-4">
                                <h3 className="font-bold text-lg truncate">{item.title || item.client_name || item.name || "Untitled"}</h3>
                                <p className="text-sm text-ink/40 truncate">
                                  {industryName && <span className="mr-1 font-medium text-ink/80 bg-ink/5 px-2 py-0.5 rounded text-xs">{industryName}</span>}
                                  {item.category && <span className="mr-1 font-medium text-ink/60">{item.category} •</span>}
                                  {item.client || item.role || item.description || (item.category ? "" : "No description")}
                                </p>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-sand flex items-center justify-center text-ink/40">
                                <ChevronRight size={16} />
                              </div>
                            </div>

                            {/* Image Preview if available */}
                              {imageSrc && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    if (selectedTable === "testimonials") {
                                      event.stopPropagation();
                                    }
                                    if (canShowBeforeAfter) {
                                      setPreviewModal({
                                        type: "beforeAfter",
                                        title: previewTitle,
                                        before: beforeImage,
                                      after: afterImage,
                                    });
                                  } else {
                                    setPreviewModal({
                                      type: "single",
                                      title: previewTitle,
                                      image: imageSrc,
                                    });
                                  }
                                }}
                                className="aspect-video w-full bg-sand rounded-2xl mb-4 overflow-hidden relative group"
                              >
                                <img
                                  src={imageSrc}
                                  alt="Preview"
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                              </button>
                            )}

                            {/* Video Preview if available */}
                            {selectedTable === "reels" && item.video_url && (
                              <div className="aspect-video w-full bg-black rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden">
                                <video
                                  src={item.video_url}
                                  autoPlay
                                  muted
                                  loop
                                  playsInline
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
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
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      </main>




      {/* Media Preview Modal */}
      <AnimatePresence>
        {previewModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewModal(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
            >
              <div
                className="relative w-full max-w-5xl rounded-3xl bg-white shadow-2xl overflow-hidden"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-ink/5 bg-sand/30">
                  <h4 className="text-lg font-bold text-ink">{previewModal.title ?? "Preview"}</h4>
                  <button
                    type="button"
                    onClick={() => setPreviewModal(null)}
                    className="p-2 rounded-full hover:bg-ink/5 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {previewModal.type === "beforeAfter" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-sand/20">
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-ink/50">Before</p>
                      <div className="rounded-2xl overflow-hidden bg-white border border-ink/10">
                        {previewModal.before ? (
                          <img src={previewModal.before} alt="Before" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-64 text-sm text-ink/40">No image</div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-ink/50">After</p>
                      <div className="rounded-2xl overflow-hidden bg-white border border-ink/10">
                        {previewModal.after ? (
                          <img src={previewModal.after} alt="After" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-64 text-sm text-ink/40">No image</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-sand/20">
                    <div className="rounded-2xl overflow-hidden bg-white border border-ink/10">
                      {previewModal.image ? (
                        <img src={previewModal.image} alt="Preview" className="w-full h-full object-contain max-h-[70vh]" />
                      ) : (
                        <div className="flex items-center justify-center h-64 text-sm text-ink/40">No image</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Slide-over Form */}
      <AnimatePresence>
        {showCreateForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCreateForm}
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
                <h3 className="text-xl font-bold">
                  {isEditingTestimonial
                    ? "Edit Testimonial"
                    : `New ${showClientForm ? "Client" : TABLE_CONFIG[formTable].singularLabel}`}
                </h3>
                <button onClick={closeCreateForm} className="p-2 hover:bg-ink/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form
                key={isEditingTestimonial ? editingTestimonial?.id ?? "edit" : "create"}
                ref={createFormRef}
                onSubmit={handleUpload}
                className="flex-1 overflow-y-auto p-6 space-y-6"
              >
                {showClientForm ? (
                  /* Client Form - Simple name and image upload */
                  <>
                    {/* Client Name Field */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-ink/50 flex justify-between">
                        Client Name
                        <span className="text-terracotta text-[10px]">REQUIRED</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="e.g. Acme Corp"
                        className="w-full bg-sand/30 border border-ink/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ink/10 focus:outline-none transition-all"
                        required
                      />
                    </div>

                    {/* Client Image Upload */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-ink/50 flex justify-between">
                        Client Logo/Image
                      </label>

                      <label
                        htmlFor="client-image-upload"
                        className={clsx(
                          "bg-sand/50 rounded-xl p-4 border border-dashed transition-colors block",
                          dragOverField === "client-image" ? "border-ink/50 bg-sand/70" : "border-ink/20 hover:border-ink/40"
                        )}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragOverField("client-image");
                        }}
                        onDragLeave={() => setDragOverField(null)}
                        onDrop={(event) => {
                          event.preventDefault();
                          setDragOverField(null);
                          if (event.dataTransfer?.files?.length) {
                            void handleImageUpload("image_url", event.dataTransfer.files);
                          }
                        }}
                      >
                        <input
                          ref={(el) => { fileInputRefs.current["image_url"] = el; }}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          id="client-image-upload"
                          onChange={(e) => handleImageUpload("image_url", e.target.files)}
                        />

                        <div className="flex flex-col items-center justify-center py-6 cursor-pointer text-ink/40 hover:text-ink/70 transition-colors w-full">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                            {uploadingField === "image_url" ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest">
                            {uploadingField === "image_url" ? "Uploading..." : "Drag & Drop or Click to Upload"}
                          </span>
                        </div>
                      </label>

                      {batchImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                          {batchImages.map((image) => (
                            <div key={image.id} className="relative rounded-xl overflow-hidden border border-ink/10 bg-white group">
                              <button
                                type="button"
                                onClick={() => setBatchImages(prev => prev.filter(p => p.id !== image.id))}
                                className="absolute top-2 right-2 z-10 rounded-full bg-white/90 p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                              <img src={image.url} alt="Preview" className="h-32 w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : showGraphicDesignsForm ? (
                  <>
                    {/* Industry Selector - Disabled if selected */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-ink/50">Industry ID</label>
                      <div className="relative">
                        <select
                          name="industry_id"
                          defaultValue={selectedIndustryId || ""}
                          disabled={!!selectedIndustryId}
                          className="w-full bg-sand/30 border border-ink/10 rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-ink/10 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Select Industry...</option>
                          {industries.map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                          ))}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none text-ink/30" size={16} />
                        {selectedIndustryId && <input type="hidden" name="industry_id" value={selectedIndustryId} />}
                      </div>
                    </div>

                    {/* Standard Fields (Title, Client) */}
                    {TABLE_CONFIG.graphic_designs.fields.filter(f => !["industry_id", "image_url"].includes(f.name)).map(field => (
                      <div key={field.name} className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-ink/50 flex justify-between">
                          {field.label}
                          {field.required && <span className="text-terracotta text-[10px]">REQUIRED</span>}
                        </label>
                        <input
                          type="text"
                          name={field.name}
                          className="w-full bg-sand/30 border border-ink/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ink/10 focus:outline-none transition-all"
                          required={field.required}
                        />
                      </div>
                    ))}

                    {/* Batch Image Uploader with Drag Sort */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-ink/50 flex justify-between">
                        Images (Batch Upload & Sort)
                        <span className="text-terracotta text-[10px]">REQUIRED</span>
                      </label>

                      <label
                        htmlFor="batch-upload"
                        className={clsx(
                          "bg-sand/50 rounded-xl p-4 border border-dashed transition-colors block",
                          dragOverField === "image_url" ? "border-ink/50 bg-sand/70" : "border-ink/20 hover:border-ink/40"
                        )}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragOverField("image_url");
                        }}
                        onDragLeave={() => setDragOverField(null)}
                        onDrop={(event) => {
                          event.preventDefault();
                          setDragOverField(null);
                          if (event.dataTransfer?.files?.length) {
                            void handleImageUpload("image_url", event.dataTransfer.files);
                          }
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          id="batch-upload"
                          onChange={(e) => handleImageUpload("image_url", e.target.files)}
                        />
                        <div className="flex flex-col items-center justify-center py-6 cursor-pointer text-ink/40 hover:text-ink/70 transition-colors w-full">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                            {uploadingField === "image_url" ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest">
                            {uploadingField === "image_url" ? "Uploading..." : "Drag & Drop or Click to Upload"}
                          </span>
                        </div>
                      </label>

                      {batchImages.length > 0 && (
                        <div className="mt-4">
                          <Reorder.Group axis="y" values={batchImages} onReorder={setBatchImages} className="space-y-2">
                            {batchImages.map((image) => (
                              <Reorder.Item key={image.id} value={image} className="bg-white p-3 rounded-xl border border-ink/5 flex items-center gap-4 cursor-grab active:cursor-grabbing shadow-sm">
                                <div className="w-16 h-12 bg-sand rounded-lg overflow-hidden flex-shrink-0">
                                  <img src={image.url} className="w-full h-full object-cover" alt="preview" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-ink/40 truncate">{image.url.split('/').pop()}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setBatchImages(prev => prev.filter(p => p.id !== image.id))}
                                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </Reorder.Item>
                            ))}
                          </Reorder.Group>
                          <p className="text-[10px] text-ink/40 text-center mt-2">Drag items to reorder</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : showCarouselForm ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-ink/50 flex justify-between">
                        Client Name
                        <span className="text-terracotta text-[10px]">REQUIRED</span>
                      </label>
                      <input
                        type="text"
                        name="client"
                        placeholder="e.g. Acme Corp"
                        className="w-full bg-sand/30 border border-ink/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ink/10 focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-ink/50 flex justify-between">
                        Carousel Images (Upload & Sort)
                        <span className="text-terracotta text-[10px]">REQUIRED</span>
                      </label>

                      <label
                        htmlFor="carousel-image-upload"
                        className={clsx(
                          "bg-sand/50 rounded-xl p-4 border border-dashed transition-colors block",
                          dragOverField === "image_url" ? "border-ink/50 bg-sand/70" : "border-ink/20 hover:border-ink/40"
                        )}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragOverField("image_url");
                        }}
                        onDragLeave={() => setDragOverField(null)}
                        onDrop={(event) => {
                          event.preventDefault();
                          setDragOverField(null);
                          if (event.dataTransfer?.files?.length) {
                            void handleImageUpload("image_url", event.dataTransfer.files);
                          }
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          id="carousel-image-upload"
                          onChange={(e) => handleImageUpload("image_url", e.target.files)}
                        />
                        <div className="flex flex-col items-center justify-center py-6 cursor-pointer text-ink/40 hover:text-ink/70 transition-colors w-full">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                            {uploadingField === "image_url" ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest">
                            {uploadingField === "image_url" ? "Uploading..." : "Drag & Drop or Click to Upload"}
                          </span>
                        </div>
                      </label>

                      {batchImages.length > 0 && (
                        <div className="mt-4">
                          <Reorder.Group axis="y" values={batchImages} onReorder={setBatchImages} className="space-y-2">
                            {batchImages.map((image) => (
                              <Reorder.Item key={image.id} value={image} className="bg-white p-3 rounded-xl border border-ink/5 flex items-center gap-4 cursor-grab active:cursor-grabbing shadow-sm">
                                <div className="w-16 h-12 bg-sand rounded-lg overflow-hidden flex-shrink-0">
                                  <img src={image.url} className="w-full h-full object-cover" alt="preview" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-ink/40 truncate">{image.url.split("/").pop()}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setBatchImages(prev => prev.filter(p => p.id !== image.id))}
                                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </Reorder.Item>
                            ))}
                          </Reorder.Group>
                          <p className="text-[10px] text-ink/40 text-center mt-2">Drag items to reorder</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : showCopywritingForm ? (
                  <>
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-ink/50 flex justify-between">
                        Copywriting Image
                        <span className="text-terracotta text-[10px]">REQUIRED</span>
                      </label>

                      <input
                        ref={(el) => { inputRefs.current.image_url = el; }}
                        type="hidden"
                        name="image_url"
                      />

                      <div
                        className={clsx(
                          "bg-sand/50 rounded-xl p-4 border border-dashed transition-colors",
                          dragOverField === "image_url" ? "border-ink/50 bg-sand/70" : "border-ink/20 hover:border-ink/40"
                        )}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragOverField("image_url");
                        }}
                        onDragLeave={() => setDragOverField(null)}
                        onDrop={(event) => {
                          event.preventDefault();
                          setDragOverField(null);
                          if (event.dataTransfer?.files?.length) {
                            void handleImageUpload("image_url", event.dataTransfer.files);
                          }
                        }}
                        onClick={() => fileInputRefs.current.image_url?.click()}
                      >
                        <input
                          ref={(el) => { fileInputRefs.current.image_url = el; }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload("image_url", e.target.files)}
                        />

                        {imagePreview.image_url ? (
                          <div className="relative rounded-lg overflow-hidden group">
                            <img src={imagePreview.image_url} alt="Preview" className="w-full h-48 object-cover" />
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setImagePreview(prev => {
                                  const next = { ...prev };
                                  delete next.image_url;
                                  return next;
                                });
                                if (inputRefs.current.image_url) inputRefs.current.image_url.value = "";
                              }}
                              className="absolute top-2 right-2 bg-white/90 p-2 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6 cursor-pointer text-ink/40 hover:text-ink/70 transition-colors">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                              {uploadingField === "image_url" ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">
                              {uploadingField === "image_url" ? "Uploading..." : "Drag & Drop or Click to Upload"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : showPhotoEditingForm ? (
                  <>
                    <div className="space-y-6">
                      {(
                        [
                          { name: "before_image_url", label: "Before Image" },
                          { name: "after_image_url", label: "After Image" },
                        ] as const
                      ).map((field) => (
                        <div key={field.name} className="space-y-3">
                          <label className="text-xs font-bold uppercase tracking-widest text-ink/50 flex justify-between">
                            {field.label}
                            <span className="text-terracotta text-[10px]">REQUIRED</span>
                          </label>

                          <input
                            ref={(el) => { inputRefs.current[field.name] = el; }}
                            type="hidden"
                            name={field.name}
                          />

                          <div
                            className={clsx(
                              "bg-sand/50 rounded-xl p-4 border border-dashed transition-colors",
                              dragOverField === field.name ? "border-ink/50 bg-sand/70" : "border-ink/20 hover:border-ink/40"
                            )}
                            onDragOver={(event) => {
                              event.preventDefault();
                              setDragOverField(field.name);
                            }}
                            onDragLeave={() => setDragOverField(null)}
                            onDrop={(event) => {
                              event.preventDefault();
                              setDragOverField(null);
                              if (event.dataTransfer?.files?.length) {
                                void handleImageUpload(field.name, event.dataTransfer.files);
                              }
                            }}
                            onClick={() => fileInputRefs.current[field.name]?.click()}
                          >
                            <input
                              ref={(el) => { fileInputRefs.current[field.name] = el; }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(field.name, e.target.files)}
                            />

                            {imagePreview[field.name] ? (
                              <div className="relative rounded-lg overflow-hidden group">
                                <img src={imagePreview[field.name]} alt="Preview" className="w-full h-48 object-cover" />
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setImagePreview(prev => {
                                      const next = { ...prev };
                                      delete next[field.name];
                                      return next;
                                    });
                                    if (inputRefs.current[field.name]) inputRefs.current[field.name]!.value = "";
                                  }}
                                  className="absolute top-2 right-2 bg-white/90 p-2 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-6 cursor-pointer text-ink/40 hover:text-ink/70 transition-colors">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                                  {uploadingField === field.name ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest">
                                  {uploadingField === field.name ? "Uploading..." : "Drag & Drop or Click to Upload"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Standard Form Rendering for other tables */}
                    {fieldsToRender.map((field) => {
                      if (field.name === "industry_id" && industries.length > 0) {
                        return (
                          <div key={field.name} className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-ink/50">{field.label}</label>
                            <div className="relative">
                              <select
                                name={field.name}
                                defaultValue={selectedIndustryId || ""}
                                className="w-full bg-sand/30 border border-ink/10 rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-ink/10 focus:outline-none transition-all"
                              >
                                <option value="">Select Industry...</option>
                                {industries.map(i => (
                                  <option key={i.id} value={i.id}>{i.name}</option>
                                ))}
                              </select>
                              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none text-ink/30" size={16} />
                            </div>
                          </div>
                        )
                      }

                      const isClientImage = formTable === "clients" && field.name === "image_url";
                      const defaultValue = isEditingTestimonial
                        ? field.name === "client_name"
                          ? (editingTestimonial?.client_name ?? "")
                          : field.name === "quote"
                            ? (editingTestimonial?.quote ?? "")
                            : undefined
                        : undefined;

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
                              defaultValue={defaultValue}
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
                                defaultValue={defaultValue}
                                className="w-full bg-sand/30 border border-ink/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-ink/10 focus:outline-none transition-all"
                                required={field.required}
                              />

                              {/* Image Upload Widget */}
                              {IMAGE_FIELDS.has(field.name) && (
                                <div
                                  className={clsx(
                                    "bg-sand/50 rounded-xl p-4 border border-dashed transition-colors",
                                    dragOverField === field.name ? "border-ink/50 bg-sand/70" : "border-ink/20 hover:border-ink/40"
                                  )}
                                  onDragOver={(event) => {
                                    event.preventDefault();
                                    setDragOverField(field.name);
                                  }}
                                  onDragLeave={() => setDragOverField(null)}
                                  onDrop={(event) => {
                                    event.preventDefault();
                                    setDragOverField(null);
                                    if (event.dataTransfer?.files?.length) {
                                      void handleImageUpload(field.name, event.dataTransfer.files);
                                    }
                                  }}
                                >
                                  <input
                                    ref={(el) => { fileInputRefs.current[field.name] = el; }}
                                    type="file"
                                    accept="image/*"
                                    multiple={isClientImage}
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(field.name, e.target.files)}
                                  />

                                  {isClientImage ? (
                                    batchImages.length > 0 ? (
                                      <div className="grid grid-cols-2 gap-3">
                                        {batchImages.map((image) => (
                                          <div key={image.id} className="relative rounded-xl overflow-hidden border border-ink/10 bg-white group">
                                            <button
                                              type="button"
                                              onClick={() => setBatchImages(prev => prev.filter(p => p.id !== image.id))}
                                              className="absolute top-2 right-2 z-10 rounded-full bg-white/90 p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                            <img src={image.url} alt="Preview" className="h-32 w-full object-cover" />
                                          </div>
                                        ))}
                                        <button
                                          type="button"
                                          onClick={() => fileInputRefs.current[field.name]?.click()}
                                          className="flex flex-col items-center justify-center py-6 cursor-pointer text-ink/40 hover:text-ink/70 transition-colors rounded-lg border border-dashed border-ink/20 bg-sand/30"
                                        >
                                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                                            {uploadingField === field.name ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
                                          </div>
                                          <span className="text-[10px] font-bold uppercase tracking-widest text-center">
                                            {uploadingField === field.name ? "Uploading..." : "Add More Images"}
                                          </span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div
                                        onClick={() => fileInputRefs.current[field.name]?.click()}
                                        className="flex flex-col items-center justify-center py-6 cursor-pointer text-ink/40 hover:text-ink/70 transition-colors"
                                      >
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm">
                                          {uploadingField === field.name ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-widest">
                                          {uploadingField === field.name ? "Uploading..." : "Drag & Drop or Click to Upload"}
                                        </span>
                                      </div>
                                    )
                                  ) : imagePreview[field.name] ? (
                                    <div className="relative rounded-lg overflow-hidden group">
                                      <img src={imagePreview[field.name]} alt="Preview" className="w-full h-48 object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setImagePreview(prev => { const n = { ...prev }; delete n[field.name]; return n; });
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
                                        {uploadingField === field.name ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
                                      </div>
                                      <span className="text-xs font-bold uppercase tracking-widest">
                                        {uploadingField === field.name ? "Uploading..." : "Drag & Drop or Click to Upload"}
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
                  </>
                )}
              </form>

              <div className="p-6 border-t border-ink/5 bg-sand/30">

                <button
                  onClick={() => {
                    if (createFormRef.current) {
                      if (typeof createFormRef.current.requestSubmit === "function") {
                        createFormRef.current.requestSubmit();
                      } else {
                        createFormRef.current.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
                      }
                    }
                  }}
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

      {/* Delete Industry Modal */}
      <AnimatePresence>
        {industryDeletePrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (industryDeleteState === "loading") return;
                setIndustryDeletePrompt(null);
                setIndustryDeleteText("");
                setIndustryDeleteError("");
              }}
              className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-ink mb-2">Delete {industryDeletePrompt.name}?</h3>
              <p className="text-sm text-ink/60 mb-4">
                This will permanently remove the industry. Type DELETE to confirm.
              </p>
              <input
                value={industryDeleteText}
                onChange={(event) => {
                  setIndustryDeleteText(event.target.value);
                  setIndustryDeleteError("");
                }}
                placeholder="Type DELETE"
                className="w-full bg-sand/40 border border-ink/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-ink/10 focus:outline-none transition-all"
              />
              {industryDeleteError && (
                <p className="text-xs text-red-500 mt-2">{industryDeleteError}</p>
              )}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (industryDeleteState === "loading") return;
                    setIndustryDeletePrompt(null);
                    setIndustryDeleteText("");
                    setIndustryDeleteError("");
                  }}
                  className="px-4 py-2 text-sm font-semibold text-ink/60 hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={industryDeleteState === "loading" || industryDeleteText.trim() !== "DELETE"}
                  onClick={handleIndustryDelete}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {industryDeleteState === "loading" ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Client Modal */}
      <AnimatePresence>
        {clientDeletePrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (clientDeleteState === "loading") return;
                setClientDeletePrompt(null);
                setClientDeleteText("");
                setClientDeleteError("");
              }}
              className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-ink mb-2">Delete {clientDeletePrompt.name}?</h3>
              <p className="text-sm text-ink/60 mb-4">
                This will delete all images for this client. Type DELETE to confirm.
              </p>
              <input
                value={clientDeleteText}
                onChange={(event) => {
                  setClientDeleteText(event.target.value);
                  setClientDeleteError("");
                }}
                placeholder="Type DELETE"
                className="w-full bg-sand/40 border border-ink/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-ink/10 focus:outline-none transition-all"
              />
              {clientDeleteError && (
                <p className="text-xs text-red-500 mt-2">{clientDeleteError}</p>
              )}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (clientDeleteState === "loading") return;
                    setClientDeletePrompt(null);
                    setClientDeleteText("");
                    setClientDeleteError("");
                  }}
                  className="px-4 py-2 text-sm font-semibold text-ink/60 hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={clientDeleteState === "loading" || clientDeleteText.trim() !== "DELETE"}
                  onClick={handleClientDelete}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {clientDeleteState === "loading" ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Client Image Modal */}
      <AnimatePresence>
        {selectedClientImage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClientImage(null)}
              className="fixed inset-0 bg-black/70 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-4 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative w-full overflow-hidden rounded-2xl bg-sand">
                <img
                  src={selectedClientImage}
                  alt="Client preview"
                  className="w-full h-auto object-contain"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
