"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient, getSupabaseConfigError } from "@/lib/supabaseClient";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  LayoutDashboard,
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
  ArrowLeft,
  Menu,
  Pencil,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import clsx from "clsx";

// --- Types ---

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
  sort_order?: number | null;
  created_at?: string | null;
};

type StoryItem = {
  id: string;
  industry_id?: string | null;
  client?: string | null;
  video_url?: string | null;
  sort_order?: number | null;
  created_at?: string | null;
};

type CopywritingItem = {
  id: string;
  industry_id?: string | null;
  client?: string | null;
  title: string;
  body?: string | null;
  image_url?: string | null;
  sort_order?: number | null;
  created_at?: string | null;
};

type PhotoEditingItem = {
  id: string;
  industry_id?: string | null;
  client?: string | null;
  title: string;
  before_image_url?: string | null;
  after_image_url?: string | null;
  sort_order?: number | null;
  created_at?: string | null;
};

type TestimonialItem = {
  id: string;
  client_name: string;
  role?: string | null;
  company?: string | null;
  quote: string;
  avatar_url?: string | null;
  sort_order?: number | null;
  created_at?: string | null;
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
  | "dashboard"
  | "industries"
  | "clients"
  | "carousels"
  | "reels"
  | "stories"
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

const getCanvaEmbedUrl = (rawUrl: string | null | undefined) => {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    if (!url.hostname.endsWith("canva.com")) return null;
    if (!url.pathname.includes("/design/")) return null;
    url.searchParams.set("embed", "1");
    return url.toString();
  } catch {
    return null;
  }
};

const TABLE_CONFIG: Record<
  TableKey,
  { label: string; singularLabel: string; icon: React.ElementType; fields: FieldConfig[] }
> = {
  dashboard: {
    label: "Dashboard",
    singularLabel: "Dashboard",
    icon: LayoutDashboard,
    fields: [],
  },
  industries: {
    label: "Industries",
    singularLabel: "Industry",
    icon: LayoutDashboard,
    fields: [
      { name: "name", label: "Industry Name", required: true, placeholder: "e.g. Beauty & Wellness" },
    ],
  },
  clients: {
    label: "Graphic Designs",
    singularLabel: "Graphic Design",
    icon: LayoutDashboard,
    fields: [
      { name: "industry_id", label: "Industry" },
      { name: "name", label: "Client Name", required: true, placeholder: "e.g. Acme Corp" },
      { name: "image_url", label: "Client Logo/Image", type: "url" },
      { name: "sort_order", label: "Sort Order", type: "number", placeholder: "0" },
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
  stories: {
    label: "Stories",
    singularLabel: "Story",
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const [carousels, setCarousels] = useState<CarouselImageItem[]>([]);
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [reelsOrderDirty, setReelsOrderDirty] = useState(false);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [storiesOrderDirty, setStoriesOrderDirty] = useState(false);
  const [copywriting, setCopywriting] = useState<CopywritingItem[]>([]);
  const [photoEditing, setPhotoEditing] = useState<PhotoEditingItem[]>([]);
  const [photoEditingOrderDirty, setPhotoEditingOrderDirty] = useState(false);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [testimonialsOrderDirty, setTestimonialsOrderDirty] = useState(false);
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null);
  const [storyOrderSaving, setStoryOrderSaving] = useState(false);
  const [storyOrderError, setStoryOrderError] = useState("");
  const [deletingTestimonialId, setDeletingTestimonialId] = useState<string | null>(null);
  const [testimonialOrderSaving, setTestimonialOrderSaving] = useState(false);
  const [testimonialOrderError, setTestimonialOrderError] = useState("");

  const [adminLoaded, setAdminLoaded] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [adminDataError, setAdminDataError] = useState<string | null>(null);

  // UI State
  const [loginState, setLoginState] = useState<LoginState>("idle");
  const [loginError, setLoginError] = useState("");
  const [selectedTable, setSelectedTable] = useState<TableKey>("dashboard");
  const [selectedIndustryId, setSelectedIndustryId] = useState<string | null>(null);
  const [selectedCarouselClient, setSelectedCarouselClient] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      type: "single" | "beforeAfter" | "video";
      title?: string;
      image?: string | null;
      before?: string | null;
      after?: string | null;
      video?: string | null;
    }
  >(null);
  const [industryDeletePrompt, setIndustryDeletePrompt] = useState<{ id: string; name: string } | null>(null);
  const [industryDeleteText, setIndustryDeleteText] = useState("");
  const [industryDeleteState, setIndustryDeleteState] = useState<DeleteState>("idle");
  const [industryDeleteError, setIndustryDeleteError] = useState("");
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  const [selectedClientImage, setSelectedClientImage] = useState<string | null>(null);
  const [clientDeletePrompt, setClientDeletePrompt] = useState<{ industryId: string; name: string } | null>(null);
  const [clientDeleteText, setClientDeleteText] = useState("");
  const [clientDeleteState, setClientDeleteState] = useState<DeleteState>("idle");
  const [clientDeleteError, setClientDeleteError] = useState("");
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null);
  const [editingIndustry, setEditingIndustry] = useState<IndustryItem | null>(null);
  const [editingPhotoEditing, setEditingPhotoEditing] = useState<PhotoEditingItem | null>(null);
  const [reelDeleteState, setReelDeleteState] = useState<DeleteState>("idle");
  const [reelDeleteId, setReelDeleteId] = useState<string | null>(null);
  const [reelOrderState, setReelOrderState] = useState<"idle" | "saving" | "error">("idle");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [reelOrderError, setReelOrderError] = useState("");
  const [photoEditingDeleteState, setPhotoEditingDeleteState] = useState<DeleteState>("idle");
  const [photoEditingDeleteId, setPhotoEditingDeleteId] = useState<string | null>(null);
  const [photoEditingOrderState, setPhotoEditingOrderState] = useState<"idle" | "saving" | "error">("idle");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [photoEditingOrderError, setPhotoEditingOrderError] = useState("");
  const [carouselBatchImages, setCarouselBatchImages] = useState<{ id: string; url: string }[]>([]);
  const [carouselUploadState, setCarouselUploadState] = useState<UploadState>("idle");
  const [carouselUploadMessage, setCarouselUploadMessage] = useState("");
  const [carouselRenameState, setCarouselRenameState] = useState<UploadState>("idle");
  const [carouselRenameMessage, setCarouselRenameMessage] = useState("");
  const [carouselRenameDraft, setCarouselRenameDraft] = useState("");
  const [carouselOrder, setCarouselOrder] = useState<CarouselImageItem[]>([]);
  const [carouselOrderDirty, setCarouselOrderDirty] = useState(false);
  const [carouselOrderState, setCarouselOrderState] = useState<UploadState>("idle");
  const [carouselOrderMessage, setCarouselOrderMessage] = useState("");
  const [carouselDeletingId, setCarouselDeletingId] = useState<string | null>(null);
  const [copywritingOrder, setCopywritingOrder] = useState<CopywritingItem[]>([]);
  const [copywritingOrderDirty, setCopywritingOrderDirty] = useState(false);
  const [copywritingOrderState, setCopywritingOrderState] = useState<UploadState>("idle");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [copywritingOrderMessage, setCopywritingOrderMessage] = useState("");
  const [copywritingDeletingId, setCopywritingDeletingId] = useState<string | null>(null);
  const [clientUploadState, setClientUploadState] = useState<UploadState>("idle");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [clientUploadMessage, setClientUploadMessage] = useState("");

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const createFormRef = useRef<HTMLFormElement | null>(null);

  const moveItemUp = <T,>(index: number, list: T[], setList: (l: T[]) => void, setDirty: (d: boolean) => void) => {
    if (index === 0) return;
    const newList = [...list];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setList(newList);
    setDirty(true);
  };

  const moveItemDown = <T,>(index: number, list: T[], setList: (l: T[]) => void, setDirty: (d: boolean) => void) => {
    if (index === list.length - 1) return;
    const newList = [...list];
    [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
    setList(newList);
    setDirty(true);
  };

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

      setCarousels(data.carousels ?? []);
      setReels(data.reels);
      setReelsOrderDirty(false);
      const storyData = data.stories ?? [];
      setStories(storyData);
      setStoriesOrderDirty(false);
      setCopywriting(data.copywriting ?? []);
      setCopywritingOrder(data.copywriting ?? []);
      setCopywritingOrderDirty(false);
      setCopywritingOrderState("idle");
      setCopywritingOrderMessage("");
      setPhotoEditing(data.photoEditing);
      setPhotoEditingOrderDirty(false);
      const testimonialData = data.testimonials ?? [];
      setTestimonials(testimonialData);
      setTestimonialsOrderDirty(false);

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
    setClients([]);
    setCarousels([]);
    setReels([]);
    setStories([]);
    setCopywriting([]);
    setCopywritingOrder([]);
    setCopywritingOrderDirty(false);
    setCopywritingOrderState("idle");
    setCopywritingOrderMessage("");
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

      // Determine the table to use
      const targetTable = createTableOverride ?? selectedTable;

      TABLE_CONFIG[targetTable].fields.forEach((field) => {
        values[field.name] = String(form.get(field.name) ?? "").trim();
      });

      // Auto-assign industry_id for clients when inside an industry
      if (targetTable === "clients" && selectedIndustryId) {
        values.industry_id = selectedIndustryId;
        // Auto-calculate sort_order based on existing clients count
        const existingClients = clients.filter(c => c.industry_id === selectedIndustryId);
        values.sort_order = String(existingClients.length);
      }

      if (targetTable === "stories") {
        values.sort_order = String(stories.length);
      }

      if (targetTable === "testimonials" && !editingTestimonial) {
        values.sort_order = String(testimonials.length);
      }

      if (targetTable === "reels") {
        const maxSortOrder = reels.reduce((max, reel) => Math.max(max, reel.sort_order ?? -1), -1);
        values.sort_order = String(maxSortOrder + 1);
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
        values.sort_order = String(copywriting.length);

      } else if (targetTable === "photo_editing") {
        if (!values.before_image_url || !values.after_image_url) {
          throw new Error("Please upload both before and after images.");
        }

      }

      if (targetTable === "industries" && editingIndustry) {
        const response = await fetch("/api/admin-update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            table: "industries",
            id: editingIndustry.id,
            values: {
              name: values.name,
            },
          }),
        });

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.message ?? "Update failed");
        }
      } else if (targetTable === "testimonials" && editingTestimonial) {
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
      } else if (targetTable === "photo_editing" && editingPhotoEditing) {
        const response = await fetch("/api/admin-update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            table: "photo_editing",
            id: editingPhotoEditing.id,
            values: {
              before_image_url: values.before_image_url,
              after_image_url: values.after_image_url,
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
      setEditingIndustry(null);
      setEditingPhotoEditing(null);
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

  const handleCarouselImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setCarouselUploadState("loading");
    setCarouselUploadMessage("");

    try {
      if (!supabase) {
        throw new Error(supabaseConfigError ?? "Supabase client is not configured.");
      }

      const newImages: { id: string; url: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extension = file.name.split(".").pop() || "png";
        const filePath = `carousels/image_url/${crypto.randomUUID()}.${extension}`;

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

      if (newImages.length > 0) {
        setCarouselBatchImages((prev) => [...prev, ...newImages]);
        setCarouselUploadState("success");
        setCarouselUploadMessage(`${newImages.length} image${newImages.length === 1 ? "" : "s"} ready to add.`);
      } else {
        setCarouselUploadState("idle");
      }
    } catch (error) {
      setCarouselUploadState("error");
      setCarouselUploadMessage(error instanceof Error ? error.message : "Carousel upload failed");
    }
  };

  const handleCarouselAddImages = async () => {
    if (!selectedCarouselClient) return;
    if (carouselBatchImages.length === 0) {
      setCarouselUploadState("error");
      setCarouselUploadMessage("Please upload at least one image.");
      return;
    }

    try {
      if (!supabase) {
        throw new Error(supabaseConfigError ?? "Supabase client is not configured.");
      }

      setCarouselUploadState("loading");
      setCarouselUploadMessage("");

      const existingPositions = carousels
        .filter((item) => (item.client ?? "").trim() === selectedCarouselClient)
        .map((item) => item.position ?? 0);
      const basePosition = existingPositions.length > 0
        ? Math.max(...existingPositions) + 1
        : 0;

      const carouselRecords = carouselBatchImages.map((image, index) => ({
        client: selectedCarouselClient,
        image_url: image.url,
        position: basePosition + index,
      }));

      const { error } = await supabase
        .from("carousels")
        .insert(carouselRecords);

      if (error) {
        throw new Error(error.message);
      }

      setCarouselBatchImages([]);
      setCarouselUploadState("success");
      setCarouselUploadMessage("Images added successfully.");
      await fetchAdminData();
    } catch (error) {
      setCarouselUploadState("error");
      setCarouselUploadMessage(error instanceof Error ? error.message : "Failed to add carousel images");
    }
  };

  const handleCarouselRename = async () => {
    if (!selectedCarouselClient) return;
    const nextName = carouselRenameDraft.trim();

    if (!nextName) {
      setCarouselRenameState("error");
      setCarouselRenameMessage("Client name is required.");
      return;
    }

    if (nextName === selectedCarouselClient) {
      setCarouselRenameState("idle");
      setCarouselRenameMessage("");
      return;
    }

    try {
      setCarouselRenameState("loading");
      setCarouselRenameMessage("");

      const response = await fetch("/api/admin-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          table: "carousels",
          client: selectedCarouselClient,
          values: { client: nextName },
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? "Rename failed");
      }

      setCarouselRenameState("success");
      setCarouselRenameMessage("Client name updated.");
      setSelectedCarouselClient(nextName);
      await fetchAdminData();
    } catch (error) {
      setCarouselRenameState("error");
      setCarouselRenameMessage(error instanceof Error ? error.message : "Rename failed");
    }
  };

  const handleCarouselOrderSave = async (items: CarouselImageItem[]) => {
    if (!selectedCarouselClient || items.length === 0) return;

    try {
      setCarouselOrderState("loading");
      setCarouselOrderMessage("");

      const positions = items.map((item, index) => ({
        id: item.id,
        position: index,
      }));

      const response = await fetch("/api/admin-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          table: "carousels",
          positions,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? "Failed to save order");
      }

      setCarouselOrderState("success");
      setCarouselOrderMessage("Order saved.");
      setCarouselOrderDirty(false);
      await fetchAdminData();
    } catch (error) {
      setCarouselOrderState("error");
      setCarouselOrderMessage(error instanceof Error ? error.message : "Failed to save order");
    }
  };

  const handleCarouselImageDelete = async (imageId: string) => {
    if (!imageId) return;
    setCarouselDeletingId(imageId);

    try {
      const response = await fetch("/api/admin-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ table: "carousels", id: imageId }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? "Delete failed");
      }

      await fetchAdminData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setCarouselDeletingId(null);
    }
  };

  const handleCopywritingOrderSave = async (items: CopywritingItem[]) => {
    if (items.length === 0) return;

    try {
      setCopywritingOrderState("loading");
      setCopywritingOrderMessage("");

      const positions = items.map((item, index) => ({
        id: item.id,
        sort_order: index,
      }));

      const response = await fetch("/api/admin-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          table: "copywriting",
          positions,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? "Failed to save order");
      }

      setCopywritingOrderState("success");
      setCopywritingOrderMessage("Order saved.");
      setCopywritingOrderDirty(false);
      await fetchAdminData();
    } catch (error) {
      setCopywritingOrderState("error");
      setCopywritingOrderMessage(error instanceof Error ? error.message : "Failed to save order");
    }
  };

  const handleCopywritingDelete = async (id: string) => {
    if (!id) return;
    if (!confirm("Delete this copywriting image?")) return;

    try {
      setCopywritingDeletingId(id);
      const response = await fetch("/api/admin-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ table: "copywriting", id }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? "Delete failed");
      }

      await fetchAdminData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setCopywritingDeletingId(null);
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

  const handleStoryDelete = async (storyId: string) => {
    if (!session) return;
    const confirmed = window.confirm("Delete this story video?");
    if (!confirmed) return;

    setDeletingStoryId(storyId);
    try {
      const response = await fetch("/api/admin-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ table: "stories", id: storyId }),
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

      await fetchAdminData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletingStoryId(null);
    }
  };

  const handleStoryOrderSave = async (orderedStories: StoryItem[]) => {
    if (!session) return;
    if (orderedStories.length === 0) return;

    setStoryOrderSaving(true);
    setStoryOrderError("");

    try {
      const response = await fetch("/api/admin-reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          table: "stories",
          order: orderedStories.map((story, index) => ({
            id: story.id,
            sort_order: index,
          })),
        }),
      });

      if (!response.ok) {
        let message = "Failed to save story order";
        try {
          const payload = await response.json();
          if (payload?.message) message = payload.message;
        } catch (error) {
          // ignore json parse errors
        }
        throw new Error(message);
      }

      setStoriesOrderDirty(false);
    } catch (error) {
      setStoryOrderError(error instanceof Error ? error.message : "Failed to save story order");
    } finally {
      setStoryOrderSaving(false);
    }
  };

  const handleTestimonialDelete = async (testimonialId: string) => {
    if (!session) return;
    const confirmed = window.confirm("Delete this testimonial?");
    if (!confirmed) return;

    setDeletingTestimonialId(testimonialId);
    try {
      const response = await fetch("/api/admin-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ table: "testimonials", id: testimonialId }),
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

      await fetchAdminData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletingTestimonialId(null);
    }
  };

  const handleTestimonialOrderSave = async (orderedTestimonials: TestimonialItem[]) => {
    if (!session) return;
    if (orderedTestimonials.length === 0) return;

    setTestimonialOrderSaving(true);
    setTestimonialOrderError("");

    try {
      const response = await fetch("/api/admin-reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          table: "testimonials",
          order: orderedTestimonials.map((testimonial, index) => ({
            id: testimonial.id,
            sort_order: index,
          })),
        }),
      });

      if (!response.ok) {
        let message = "Failed to save testimonial order";
        try {
          const payload = await response.json();
          if (payload?.message) message = payload.message;
        } catch (error) {
          // ignore json parse errors
        }
        throw new Error(message);
      }

      setTestimonialsOrderDirty(false);
    } catch (error) {
      setTestimonialOrderError(
        error instanceof Error ? error.message : "Failed to save testimonial order"
      );
    } finally {
      setTestimonialOrderSaving(false);
    }
  };

  const handleReelsOrderSave = async (orderedReels: ReelItem[]) => {
    if (!session) return;
    setReelOrderState("saving");
    setReelOrderError("");

    try {
      const response = await fetch("/api/admin-reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          table: "reels",
          items: orderedReels.map((reel, index) => ({
            id: reel.id,
            sort_order: index,
          })),
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? "Failed to save reel order");
      }

      setReelOrderState("idle");
      setReelsOrderDirty(false);
    } catch (error) {
      setReelOrderState("error");
      setReelOrderError(error instanceof Error ? error.message : "Failed to save reel order");
    }
  };

  const handleReelDelete = async (reelId: string) => {
    const confirmed = window.confirm("Delete this reel?");
    if (!confirmed) return;

    setReelDeleteState("loading");
    setReelDeleteId(reelId);

    try {
      const response = await fetch("/api/admin-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ table: "reels", id: reelId }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? "Delete failed");
      }

      setReelDeleteState("idle");
      setReelDeleteId(null);
      await fetchAdminData();
    } catch (error) {
      setReelDeleteState("error");
      setReelDeleteId(null);
      alert(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const handlePhotoEditingOrderSave = async (orderedItems: PhotoEditingItem[]) => {
    if (!session) return;
    setPhotoEditingOrderState("saving");
    setPhotoEditingOrderError("");

    try {
      const response = await fetch("/api/admin-reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          table: "photo_editing",
          items: orderedItems.map((item, index) => ({
            id: item.id,
            sort_order: index,
          })),
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? "Failed to save order");
      }

      setPhotoEditingOrderState("idle");
      setPhotoEditingOrderDirty(false);
    } catch (error) {
      setPhotoEditingOrderState("error");
      setPhotoEditingOrderError(error instanceof Error ? error.message : "Failed to save order");
    }
  };

  const handlePhotoEditingDelete = async (photoEditingId: string) => {
    const confirmed = window.confirm("Delete this photo edit?");
    if (!confirmed) return;

    setPhotoEditingDeleteState("loading");
    setPhotoEditingDeleteId(photoEditingId);

    try {
      const response = await fetch("/api/admin-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ table: "photo_editing", id: photoEditingId }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message ?? "Delete failed");
      }

      setPhotoEditingDeleteState("idle");
      setPhotoEditingDeleteId(null);
      await fetchAdminData();
    } catch (error) {
      setPhotoEditingDeleteState("error");
      setPhotoEditingDeleteId(null);
      alert(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const handleClientPhotosUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!selectedIndustryId || !selectedClientName) return;

    setClientUploadState("loading");
    setClientUploadMessage("");

    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const newImages: { url: string; sort_order: number }[] = [];
      const currentIndustryClients = clients.filter(c => c.industry_id === selectedIndustryId);
      const baseSortOrder = currentIndustryClients.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extension = file.name.split(".").pop() || "png";
        const filePath = `clients/image_url/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage.from("portfolio").upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/png",
        });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("portfolio").getPublicUrl(filePath);
        if (data.publicUrl) {
          newImages.push({
            url: data.publicUrl,
            sort_order: baseSortOrder + i
          });
        }
      }

      // Insert into DB
      for (const img of newImages) {
        const response = await fetch("/api/admin-insert", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            table: "clients",
            values: {
              industry_id: selectedIndustryId,
              name: selectedClientName,
              image_url: img.url,
              sort_order: String(img.sort_order)
            }
          }),
        });

        if (!response.ok) {
          console.error("Failed to insert image", img);
        }
      }

      setClientUploadState("success");
      setClientUploadMessage("Photos added successfully");
      await fetchAdminData();

      setTimeout(() => {
        setClientUploadState("idle");
        setClientUploadMessage("");
      }, 2000);

    } catch (error) {
      console.error(error);
      setClientUploadState("error");
      setClientUploadMessage("Failed to upload photos");
    }
  };


  const getIndustryName = (id?: string | null) => {
    if (!id) return null;
    return industries.find((i) => i.id === id)?.name;
  };

  const dashboardStats = useMemo(() => {
    const uniqueClientNames = new Set(
      clients
        .map((item) => (item.name ?? "").trim())
        .filter(Boolean)
    );
    const uniqueCarouselClients = new Set(
      carousels
        .map((item) => (item.client ?? "").trim())
        .filter(Boolean)
    );
    const totalEntries =
      clients.length +
      carousels.length +
      reels.length +
      stories.length +
      copywriting.length +
      photoEditing.length +
      testimonials.length;

    return {
      uniqueClientCount: uniqueClientNames.size,
      uniqueCarouselClients: uniqueCarouselClients.size,
      totalEntries,
    };
  }, [clients, carousels, reels, stories, copywriting, photoEditing, testimonials]);


  const closeCreateForm = () => {
    setShowCreateForm(false);
    setCreateTableOverride(null);
    setEditingTestimonial(null);
    setEditingIndustry(null);
    setEditingPhotoEditing(null);
  };

  const formTable = createTableOverride ?? selectedTable;
  const showClientForm = selectedTable === "clients" && selectedIndustryId && !createTableOverride;


  useEffect(() => {
    setSelectedClientName(null);
    setSelectedClientImage(null);
    setClientDeletePrompt(null);
  }, [selectedIndustryId]);

  useEffect(() => {
    if (!selectedCarouselClient) {
      setCarouselBatchImages([]);
      setCarouselRenameDraft("");
      setCarouselOrder([]);
      setCarouselOrderDirty(false);
      setCarouselUploadState("idle");
      setCarouselUploadMessage("");
      setCarouselRenameState("idle");
      setCarouselRenameMessage("");
      setCarouselOrderState("idle");
      setCarouselOrderMessage("");
      return;
    }

    const ordered = carousels
      .filter((image) => (image.client ?? "").trim() === selectedCarouselClient)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    setCarouselOrder(ordered);
    setCarouselRenameDraft(selectedCarouselClient);
    setCarouselOrderDirty(false);
    setCarouselUploadState("idle");
    setCarouselUploadMessage("");
    setCarouselRenameState("idle");
    setCarouselRenameMessage("");
    setCarouselOrderState("idle");
    setCarouselOrderMessage("");
  }, [selectedCarouselClient, carousels]);
  const showCarouselForm = formTable === "carousels";
  const showCopywritingForm = formTable === "copywriting";
  const showPhotoEditingForm = formTable === "photo_editing";
  const fieldsToRender = formTable === "testimonials"
    ? TABLE_CONFIG[formTable].fields.filter((field) => ["client_name", "quote"].includes(field.name))
    : TABLE_CONFIG[formTable].fields;
  const isEditingTestimonial = formTable === "testimonials" && Boolean(editingTestimonial);
  const isEditingIndustry = formTable === "industries" && Boolean(editingIndustry);
  const isEditingPhotoEditing = formTable === "photo_editing" && Boolean(editingPhotoEditing);

  useEffect(() => {
    if (!showCreateForm || formTable !== "photo_editing" || !editingPhotoEditing) return;

    const nextPreview: Record<string, string> = {};
    if (editingPhotoEditing.before_image_url) {
      nextPreview.before_image_url = editingPhotoEditing.before_image_url;
    }
    if (editingPhotoEditing.after_image_url) {
      nextPreview.after_image_url = editingPhotoEditing.after_image_url;
    }

    setImagePreview(nextPreview);

    requestAnimationFrame(() => {
      if (inputRefs.current.before_image_url && editingPhotoEditing.before_image_url) {
        inputRefs.current.before_image_url.value = editingPhotoEditing.before_image_url;
      }
      if (inputRefs.current.after_image_url && editingPhotoEditing.after_image_url) {
        inputRefs.current.after_image_url.value = editingPhotoEditing.after_image_url;
      }
    });
  }, [editingPhotoEditing, formTable, showCreateForm]);

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
      case "dashboard": return [];
      case "industries": return industries;
      case "clients":
        if (!selectedIndustryId) return industries as AdminListItem[];
        return clients.filter(item => item.industry_id === selectedIndustryId) as AdminListItem[];

      case "carousels": return carousels as AdminListItem[];
      case "reels": return reels;
      case "stories": return stories;
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
        <div className="p-6 lg:p-8 border-b border-ink/5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setSelectedTable("dashboard");
              setSelectedIndustryId(null);
              setSelectedCarouselClient(null);
              setShowCreateForm(false);
              setIsSidebarOpen(false);
            }}
            className="font-bold text-2xl tracking-tighter text-left"
            aria-label="Go to dashboard"
          >
            MAV<span className="font-normal text-ink/40">ADMIN</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden w-9 h-9 rounded-full border border-ink/10 flex items-center justify-center text-ink/60 hover:text-ink hover:border-ink/30"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
          <button
            onClick={() => {
              setSelectedTable("dashboard");
              setSelectedIndustryId(null);
              setSelectedCarouselClient(null);
              setShowCreateForm(false);
              setIsSidebarOpen(false);
            }}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
              selectedTable === "dashboard"
                ? "bg-ink text-white shadow-lg shadow-ink/20"
                : "text-ink/60 hover:bg-sand hover:text-ink"
            )}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          {Object.entries(TABLE_CONFIG)
            .filter(([key]) => (
              [
                "clients",
                "carousels",
                "reels",
                "stories",
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
                    setIsSidebarOpen(false);
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

      {isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close sidebar overlay"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto h-screen relative">
        <header className="sticky top-0 z-40 bg-sand/80 backdrop-blur-md border-b border-ink/5 px-4 py-4 sm:px-8 sm:py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-2xl bg-white border border-ink/10 flex items-center justify-center text-ink/70"
              aria-label="Open sidebar"
            >
              <Menu size={18} />
            </button>
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-ink/5 text-ink">
              <CurrentIcon size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {selectedTable === "clients" && selectedIndustryId && (
                  <span
                    onClick={() => setSelectedIndustryId(null)}
                    className="cursor-pointer text-ink/40 hover:text-ink transition-colors flex items-center gap-1"
                  >
                    Industries <ChevronRight size={20} />
                  </span>
                )}
                {selectedTable === "clients" && selectedIndustryId
                  ? industries.find(i => i.id === selectedIndustryId)?.name
                  : TABLE_CONFIG[selectedTable].label}
              </h2>
              <p className="text-sm text-ink/40">
                {selectedTable === "dashboard"
                  ? `${dashboardStats.totalEntries} total items across 7 sections`
                  : selectedTable === "clients" && !selectedIndustryId
                    ? `${industries.length} industries`
                    : `${currentData.length} entries found`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedTable === "reels" && reelsOrderDirty && (
              <button
                type="button"
                onClick={() => handleReelsOrderSave(reels)}
                disabled={reelOrderState === "saving"}
                className="bg-white text-ink px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2 border border-ink/10 hover:border-ink/30 hover:bg-sand transition-all disabled:opacity-50"
              >
                {reelOrderState === "saving" && <Loader2 className="animate-spin" size={16} />}
                Save Changes
              </button>
            )}
            {selectedTable === "stories" && storiesOrderDirty && (
              <button
                type="button"
                onClick={() => handleStoryOrderSave(stories)}
                disabled={storyOrderSaving}
                className="bg-white text-ink px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2 border border-ink/10 hover:border-ink/30 hover:bg-sand transition-all disabled:opacity-50"
              >
                {storyOrderSaving && <Loader2 className="animate-spin" size={16} />}
                Save Changes
              </button>
            )}
            {selectedTable === "photo_editing" && photoEditingOrderDirty && (
              <button
                type="button"
                onClick={() => handlePhotoEditingOrderSave(photoEditing)}
                disabled={photoEditingOrderState === "saving"}
                className="bg-white text-ink px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2 border border-ink/10 hover:border-ink/30 hover:bg-sand transition-all disabled:opacity-50"
              >
                {photoEditingOrderState === "saving" && <Loader2 className="animate-spin" size={16} />}
                Save Changes
              </button>
            )}
            {selectedTable === "testimonials" && testimonialsOrderDirty && (
              <button
                type="button"
                onClick={() => handleTestimonialOrderSave(testimonials)}
                disabled={testimonialOrderSaving}
                className="bg-white text-ink px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2 border border-ink/10 hover:border-ink/30 hover:bg-sand transition-all disabled:opacity-50"
              >
                {testimonialOrderSaving && <Loader2 className="animate-spin" size={16} />}
                Save Changes
              </button>
            )}
            {selectedTable === "copywriting" && copywritingOrderDirty && (
              <button
                type="button"
                onClick={() => handleCopywritingOrderSave(copywritingOrder)}
                disabled={copywritingOrderState === "loading"}
                className="bg-white text-ink px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2 border border-ink/10 hover:border-ink/30 hover:bg-sand transition-all disabled:opacity-50"
              >
                {copywritingOrderState === "loading" && <Loader2 className="animate-spin" size={16} />}
                Save Changes
              </button>
            )}
            {selectedTable === "carousels" && selectedCarouselClient && carouselOrderDirty && (
              <button
                type="button"
                onClick={() => handleCarouselOrderSave(carouselOrder)}
                disabled={carouselOrderState === "loading"}
                className="bg-white text-ink px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2 border border-ink/10 hover:border-ink/30 hover:bg-sand transition-all disabled:opacity-50"
              >
                {carouselOrderState === "loading" && <Loader2 className="animate-spin" size={16} />}
                Save Changes
              </button>
            )}
            {selectedTable === "clients" && (
              <button
                onClick={() => {
                  setCreateTableOverride("industries");
                  setShowCreateForm(true);
                  setIsSidebarOpen(false);
                }}
                className="bg-white text-ink px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2 border border-ink/10 hover:border-ink/30 hover:bg-sand transition-all"
              >
                <Plus size={18} /> Add Industry
              </button>
            )}
            {selectedTable !== "dashboard" && (selectedTable !== "clients" || selectedIndustryId) && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-ink text-white px-6 py-3 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-ink/90 transition-all shadow-lg shadow-ink/20"
              >
                <Plus size={18} /> Add New
              </button>
            )}
          </div>
        </header>

        <div className="p-4 sm:p-8">
          {adminDataError && (

            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {adminDataError}
            </div>
          )}

          {selectedTable === "dashboard" ? (
            <div className="space-y-8">
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    label: "Industries",
                    value: industries.length,
                    helper: "Organize client work",
                  },
                  {
                    label: "Unique Clients",
                    value: dashboardStats.uniqueClientCount,
                    helper: "Across graphic designs",
                  },
                  {
                    label: "Carousel Clients",
                    value: dashboardStats.uniqueCarouselClients,
                    helper: "Clients with carousels",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-white rounded-3xl border border-ink/5 p-6 shadow-sm"
                  >
                    <p className="text-xs uppercase tracking-widest text-ink/40">{item.label}</p>
                    <p className="mt-3 text-3xl font-bold text-ink">{item.value}</p>
                    <p className="mt-2 text-sm text-ink/40">{item.helper}</p>
                  </div>
                ))}
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Data by Section</h3>
                  <span className="text-xs uppercase tracking-widest text-ink/40">
                    Sidebar items
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {([
                    {
                      key: "clients" as TableKey,
                      count: clients.length,
                      helper: `${dashboardStats.uniqueClientCount} clients • ${clients.length} images`,
                    },
                    {
                      key: "carousels" as TableKey,
                      count: carousels.length,
                      helper: `${dashboardStats.uniqueCarouselClients} clients • ${carousels.length} images`,
                    },
                    {
                      key: "reels" as TableKey,
                      count: reels.length,
                      helper: `${reels.length} video entries`,
                    },
                    {
                      key: "stories" as TableKey,
                      count: stories.length,
                      helper: `${stories.length} story entries`,
                    },
                    {
                      key: "copywriting" as TableKey,
                      count: copywriting.length,
                      helper: `${copywriting.length} copy assets`,
                    },
                    {
                      key: "photo_editing" as TableKey,
                      count: photoEditing.length,
                      helper: `${photoEditing.length} before/after sets`,
                    },
                    {
                      key: "testimonials" as TableKey,
                      count: testimonials.length,
                      helper: `${testimonials.length} quotes`,
                    },
                  ] as const).map((item) => {
                    const Icon = TABLE_CONFIG[item.key].icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setSelectedTable(item.key);
                          setSelectedIndustryId(null);
                          setSelectedCarouselClient(null);
                          setShowCreateForm(false);
                          setIsSidebarOpen(false);
                        }}
                        className="bg-white rounded-3xl border border-ink/5 p-6 text-left hover:border-ink/20 hover:shadow-xl transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="w-10 h-10 rounded-2xl bg-sand flex items-center justify-center text-ink/50">
                              <Icon size={18} />
                            </div>
                            <h4 className="mt-4 text-lg font-bold">{TABLE_CONFIG[item.key].label}</h4>
                          </div>
                          <span className="text-3xl font-bold text-ink">{item.count}</span>
                        </div>
                        <p className="mt-3 text-sm text-ink/40">{item.helper}</p>
                      </button>
                    );
                  })}
                </div>
              </section>




            </div>
          ) : selectedTable === "clients" && selectedIndustryId ? (
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
                        setEditingIndustry({ id: selectedIndustryId, name });
                        setCreateTableOverride("industries");
                        setShowCreateForm(true);
                        setIsSidebarOpen(false);
                      }}
                      className="text-xs uppercase tracking-widest font-bold text-white/70 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <Pencil size={14} /> Edit Industry
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
                          <div className="flex items-center gap-3">
                            <label className={clsx(
                              "cursor-pointer bg-ink text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-ink/90 transition-all flex items-center gap-2",
                              clientUploadState === "loading" && "opacity-50 cursor-not-allowed"
                            )}>
                              {clientUploadState === "loading" ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                              {clientUploadState === "loading" ? "Uploading..." : "Add Photos"}
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleClientPhotosUpload(e.target.files)}
                                disabled={clientUploadState === "loading"}
                              />
                            </label>
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
                    {carouselOrder.length} Images
                  </p>
                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setSelectedCarouselClient(null);
                      }}
                      className="text-xs uppercase tracking-widest font-bold opacity-50 hover:opacity-100 flex items-center gap-2 transition-opacity"
                    >
                      <ArrowLeft size={14} /> Back to Clients
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full min-h-[50vh] bg-white/40 rounded-3xl border border-ink/5 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  <div className="rounded-2xl border border-ink/10 bg-white p-4">
                    <p className="text-xs uppercase tracking-widest text-ink/40 font-semibold">Client Name</p>
                    <div className="mt-3 flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={carouselRenameDraft}
                        onChange={(event) => setCarouselRenameDraft(event.target.value)}
                        className="flex-1 rounded-xl border border-ink/10 bg-sand/40 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
                        placeholder="Client name"
                      />
                      <button
                        type="button"
                        onClick={handleCarouselRename}
                        disabled={carouselRenameState === "loading"}
                        className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-ink/90 transition-colors disabled:opacity-60"
                      >
                        {carouselRenameState === "loading" ? "Saving..." : "Save Name"}
                      </button>
                    </div>
                    {carouselRenameMessage && (
                      <p className={clsx(
                        "mt-2 text-xs",
                        carouselRenameState === "error" ? "text-red-500" : "text-emerald-600"
                      )}>
                        {carouselRenameMessage}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-ink/10 bg-white p-4">
                    <p className="text-xs uppercase tracking-widest text-ink/40 font-semibold">Add Images</p>
                    <div className="mt-3 flex flex-col gap-3">
                      <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-ink/20 bg-sand/30 px-4 py-4 text-sm text-ink/60 cursor-pointer hover:border-ink/40 transition-colors">
                        <UploadCloud size={16} /> Upload Images
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) => handleCarouselImageUpload(event.target.files)}
                          className="hidden"
                        />
                      </label>

                      {carouselBatchImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {carouselBatchImages.map((image) => (
                            <div key={image.id} className="relative rounded-lg overflow-hidden border border-ink/10">
                              <img src={image.url} alt="New carousel" className="h-16 w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setCarouselBatchImages((prev) => prev.filter((item) => item.id !== image.id))}
                                className="absolute top-1 right-1 rounded-full bg-white/80 p-1 text-ink/70 hover:text-ink"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleCarouselAddImages}
                        disabled={carouselUploadState === "loading"}
                        className="rounded-xl border border-ink/10 bg-ink text-white px-4 py-2 text-sm font-semibold hover:bg-ink/90 transition-colors disabled:opacity-60"
                      >
                        {carouselUploadState === "loading" ? "Adding..." : "Add Images"}
                      </button>
                      {carouselUploadMessage && (
                        <p className={clsx(
                          "text-xs",
                          carouselUploadState === "error" ? "text-red-500" : "text-emerald-600"
                        )}>
                          {carouselUploadMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h4 className="text-sm font-semibold text-ink">Carousel Images</h4>
                    <p className="text-xs text-ink/40">Use arrows to reorder, then save.</p>
                  </div>
                </div>
                {carouselOrderMessage && (
                  <p className={clsx(
                    "mb-4 text-xs",
                    carouselOrderState === "error" ? "text-red-500" : "text-emerald-600"
                  )}>
                    {carouselOrderMessage}
                  </p>
                )}

                {carouselOrder.length === 0 ? (
                  <p className="text-sm text-ink/40 text-center">No images in this carousel yet.</p>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {carouselOrder.map((image, index) => (
                      <div
                        key={image.id}
                        className="relative rounded-xl overflow-hidden bg-sand border border-ink/10 group"
                      >
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
                        <div className="absolute top-2 left-2 rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-ink/70">
                          #{index + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCarouselImageDelete(image.id)}
                          disabled={carouselDeletingId === image.id}
                          className="absolute top-2 right-2 rounded-full bg-white/80 p-2 text-ink/70 hover:text-red-500 disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                        </button>

                        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => moveItemUp(index, carouselOrder, setCarouselOrder, setCarouselOrderDirty)}
                            disabled={index === 0}
                            className="rounded-full bg-white/90 p-1.5 text-ink/70 hover:text-ink disabled:opacity-30 disabled:hover:text-ink/70"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItemDown(index, carouselOrder, setCarouselOrder, setCarouselOrderDirty)}
                            disabled={index === carouselOrder.length - 1}
                            className="rounded-full bg-white/90 p-1.5 text-ink/70 hover:text-ink disabled:opacity-30 disabled:hover:text-ink/70"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
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
                  ) : selectedTable === "clients" ? (
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

              ) : selectedTable === "reels" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {reels.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl p-5 border border-ink/5 hover:border-ink/20 hover:shadow-xl transition-all group"
                    >
                      <div className="aspect-video w-full bg-black rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden">
                        {item.video_url ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewModal({
                                type: "video",
                                title: item.client ?? "Reel",
                                video: item.video_url ?? null,
                              })
                            }
                            className="relative w-full h-full cursor-pointer hover:opacity-95 transition-opacity group/video"
                          >
                            {getCanvaEmbedUrl(item.video_url) ? (
                              <iframe
                                src={getCanvaEmbedUrl(item.video_url)!}
                                title="Canva video"
                                className="absolute inset-0 w-full h-full pointer-events-none"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                                loading="lazy"
                              />
                            ) : (
                              <video
                                src={item.video_url}
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                              />
                            )}
                            {/* Click Overlay */}
                            <div className="absolute inset-0 z-10 bg-transparent" />

                            <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity bg-black/20">
                              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                                <Video size={24} />
                              </div>
                            </div>
                          </button>
                        ) : (
                          <div className="text-xs text-white/60">No video</div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-ink/5">
                        <span className="text-xs text-ink/30 font-mono uppercase">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => moveItemUp(index, reels, setReels, setReelsOrderDirty)}
                            disabled={index === 0}
                            className="w-9 h-9 rounded-full bg-sand text-ink/70 hover:text-ink hover:bg-ink/10 transition-colors flex items-center justify-center disabled:opacity-30 disabled:hover:bg-sand disabled:hover:text-ink/70"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItemDown(index, reels, setReels, setReelsOrderDirty)}
                            disabled={index === reels.length - 1}
                            className="w-9 h-9 rounded-full bg-sand text-ink/70 hover:text-ink hover:bg-ink/10 transition-colors flex items-center justify-center disabled:opacity-30 disabled:hover:bg-sand disabled:hover:text-ink/70"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReelDelete(item.id)}
                            disabled={reelDeleteState === "loading" && reelDeleteId === item.id}
                            className="w-9 h-9 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center disabled:opacity-60"
                            aria-label="Delete reel"
                          >
                            {reelDeleteState === "loading" && reelDeleteId === item.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedTable === "photo_editing" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {photoEditing.map((item, index) => {
                    const title = (item.title || item.client || "").trim();
                    const showTitle = title.length > 0 && title.toLowerCase() !== "untitled";
                    const previewTitle = showTitle ? title : "Preview";

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-3xl p-5 border border-ink/5 hover:border-ink/20 hover:shadow-xl transition-all group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0 pr-3">
                            {showTitle && (
                              <h3 className="font-bold text-lg truncate">{title}</h3>
                            )}
                            <p className="text-xs text-ink/40">Before &amp; After</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => moveItemUp(index, photoEditing, setPhotoEditing, setPhotoEditingOrderDirty)}
                              disabled={index === 0}
                              className="w-9 h-9 rounded-full bg-sand text-ink/70 hover:text-ink hover:bg-ink/10 transition-colors flex items-center justify-center disabled:opacity-30 disabled:hover:bg-sand disabled:hover:text-ink/70"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveItemDown(index, photoEditing, setPhotoEditing, setPhotoEditingOrderDirty)}
                              disabled={index === photoEditing.length - 1}
                              className="w-9 h-9 rounded-full bg-sand text-ink/70 hover:text-ink hover:bg-ink/10 transition-colors flex items-center justify-center disabled:opacity-30 disabled:hover:bg-sand disabled:hover:text-ink/70"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <div className="w-px h-6 bg-ink/10 mx-1" />
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPhotoEditing(item);
                                setCreateTableOverride("photo_editing");
                                setUploadState("idle");
                                setUploadMessage("");
                                setShowCreateForm(true);
                                setIsSidebarOpen(false);
                              }}
                              className="w-9 h-9 rounded-full bg-ink/5 text-ink/60 hover:bg-ink/10 hover:text-ink transition-colors flex items-center justify-center"
                              aria-label="Edit photo edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePhotoEditingDelete(item.id)}
                              disabled={photoEditingDeleteState === "loading" && photoEditingDeleteId === item.id}
                              className="w-9 h-9 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center disabled:opacity-60"
                              aria-label="Delete photo edit"
                            >
                              {photoEditingDeleteState === "loading" && photoEditingDeleteId === item.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewModal({
                                type: "beforeAfter",
                                title: previewTitle,
                                before: item.before_image_url ?? null,
                                after: item.after_image_url ?? null,
                              });
                            }}
                            className="group relative rounded-2xl overflow-hidden border border-ink/10 bg-sand/40"
                          >
                            {item.before_image_url ? (
                              <img
                                src={item.before_image_url}
                                alt="Before"
                                className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-36 text-xs text-ink/40">No before image</div>
                            )}
                            <div className="absolute top-2 left-2 rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-ink/70">
                              Before
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPreviewModal({
                                type: "beforeAfter",
                                title: previewTitle,
                                before: item.before_image_url ?? null,
                                after: item.after_image_url ?? null,
                              });
                            }}
                            className="group relative rounded-2xl overflow-hidden border border-ink/10 bg-sand/40"
                          >
                            {item.after_image_url ? (
                              <img
                                src={item.after_image_url}
                                alt="After"
                                className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-36 text-xs text-ink/40">No after image</div>
                            )}
                            <div className="absolute top-2 left-2 rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-ink/70">
                              After
                            </div>
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-ink/5">
                          <span className="text-xs text-ink/30 font-mono uppercase">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {/* Special Render for Top Level Clients (Industry List) */}
                    {selectedTable === "clients" && !selectedIndustryId ? (
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
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setEditingIndustry({ id: item.id, name: item.name ?? "" });
                                setCreateTableOverride("industries");
                                setShowCreateForm(true);
                                setIsSidebarOpen(false);
                              }}
                              className="w-9 h-9 rounded-full bg-ink/5 text-ink/60 hover:bg-ink/10 hover:text-ink transition-colors flex items-center justify-center"
                              aria-label="Edit industry"
                            >
                              <Pencil size={14} />
                            </button>
                            <div className="w-10 h-10 rounded-full bg-sand group-hover:bg-ink group-hover:text-white transition-colors flex items-center justify-center text-ink/40">
                              <ChevronRight size={20} />
                            </div>
                          </div>
                        </motion.div>
                      ))

                    ) : selectedTable === "stories" ? (
                      <>
                        {(storyOrderSaving || storyOrderError) && (
                          <div
                            className={clsx(
                              "mb-4 text-xs font-medium",
                              storyOrderError ? "text-red-500" : "text-ink/40"
                            )}
                          >
                            {storyOrderSaving ? "Saving order..." : storyOrderError}
                          </div>
                        )}
                        <div className="flex flex-col gap-6">
                          {stories.map((story, index) => (
                            <div
                              key={story.id}
                              className="bg-white rounded-3xl p-5 border border-ink/5 hover:border-ink/20 hover:shadow-xl transition-all group"
                            >
                              <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden">
                                {story.video_url ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewModal({
                                        type: "video",
                                        title: story.client ?? "Story",
                                        video: story.video_url ?? null,
                                      })
                                    }
                                    className="relative w-full h-full cursor-pointer hover:opacity-95 transition-opacity group/video"
                                  >
                                    {getCanvaEmbedUrl(story.video_url) ? (
                                      <iframe
                                        src={getCanvaEmbedUrl(story.video_url)!}
                                        title="Canva video"
                                        className="absolute inset-0 w-full h-full pointer-events-none"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                        loading="lazy"
                                      />
                                    ) : (
                                      <video
                                        src={story.video_url}
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                      />
                                    )}
                                    {/* Click Overlay */}
                                    <div className="absolute inset-0 z-10 bg-transparent" />

                                    <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity bg-black/20">
                                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                                        <Video size={24} />
                                      </div>
                                    </div>
                                  </button>
                                ) : (
                                  <div className="flex items-center justify-center h-full text-xs text-white/60">
                                    No video
                                  </div>
                                )}
                                <div className="absolute top-3 right-3 flex gap-1 z-30">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleStoryDelete(story.id);
                                    }}
                                    disabled={deletingStoryId === story.id}
                                    className="w-9 h-9 rounded-full bg-white/90 text-red-500 hover:bg-white transition-colors flex items-center justify-center disabled:opacity-60"
                                    aria-label="Delete story"
                                  >
                                    {deletingStoryId === story.id ? (
                                      <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                      <Trash2 size={16} />
                                    )}
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-ink/5">
                                <span className="text-xs text-ink/30 font-mono uppercase">
                                  {story.created_at ? new Date(story.created_at).toLocaleDateString() : "N/A"}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => moveItemUp(index, stories, setStories, setStoriesOrderDirty)}
                                    disabled={index === 0}
                                    className="w-9 h-9 rounded-full bg-sand text-ink/70 hover:text-ink hover:bg-ink/10 transition-colors flex items-center justify-center disabled:opacity-30 disabled:hover:bg-sand disabled:hover:text-ink/70"
                                  >
                                    <ArrowUp size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveItemDown(index, stories, setStories, setStoriesOrderDirty)}
                                    disabled={index === stories.length - 1}
                                    className="w-9 h-9 rounded-full bg-sand text-ink/70 hover:text-ink hover:bg-ink/10 transition-colors flex items-center justify-center disabled:opacity-30 disabled:hover:bg-sand disabled:hover:text-ink/70"
                                  >
                                    <ArrowDown size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : selectedTable === "testimonials" ? (
                      <>
                        {(testimonialOrderSaving || testimonialOrderError) && (
                          <div
                            className={clsx(
                              "mb-4 text-xs font-medium",
                              testimonialOrderError ? "text-red-500" : "text-ink/40"
                            )}
                          >
                            {testimonialOrderSaving ? "Saving order..." : testimonialOrderError}
                          </div>
                        )}
                        <div className="flex flex-col gap-4">
                          {testimonials.map((testimonial, index) => (
                            <div
                              key={testimonial.id}
                              className="bg-white rounded-3xl p-5 border border-ink/5 hover:border-ink/20 hover:shadow-xl transition-all group"
                            >
                              <div className="flex items-start gap-4">
                                <div className="flex flex-col gap-1 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => moveItemUp(index, testimonials, setTestimonials, setTestimonialsOrderDirty)}
                                    disabled={index === 0}
                                    className="text-ink/30 hover:text-ink disabled:opacity-30 disabled:hover:text-ink/30"
                                  >
                                    <ArrowUp size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveItemDown(index, testimonials, setTestimonials, setTestimonialsOrderDirty)}
                                    disabled={index === testimonials.length - 1}
                                    className="text-ink/30 hover:text-ink disabled:opacity-30 disabled:hover:text-ink/30"
                                  >
                                    <ArrowDown size={16} />
                                  </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-lg truncate">{testimonial.client_name}</h3>
                                  <p className="text-sm text-ink/50">{testimonial.quote}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setEditingTestimonial(testimonial);
                                      setUploadState("idle");
                                      setUploadMessage("");
                                      setShowCreateForm(true);
                                    }}
                                    className="w-9 h-9 rounded-full bg-ink/5 text-ink/60 hover:bg-ink/10 hover:text-ink transition-colors flex items-center justify-center"
                                    aria-label="Edit testimonial"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleTestimonialDelete(testimonial.id);
                                    }}
                                    disabled={deletingTestimonialId === testimonial.id}
                                    className="w-9 h-9 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center disabled:opacity-60"
                                    aria-label="Delete testimonial"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
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
                    ) : selectedTable === "copywriting" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {copywritingOrder.map((item, index) => {
                          const imageSrc = item.image_url ?? undefined;
                          const previewTitle = "Preview";

                          return (
                            <div
                              key={item.id}
                              className="bg-white rounded-3xl p-5 border border-ink/5 hover:border-ink/20 hover:shadow-xl transition-all group"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1" />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => moveItemUp(index, copywritingOrder, setCopywritingOrder, setCopywritingOrderDirty)}
                                    disabled={index === 0}
                                    className="w-8 h-8 rounded-full bg-sand text-ink/70 hover:text-ink hover:bg-ink/10 transition-colors flex items-center justify-center disabled:opacity-30 disabled:hover:bg-sand disabled:hover:text-ink/70"
                                  >
                                    <ArrowUp size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveItemDown(index, copywritingOrder, setCopywritingOrder, setCopywritingOrderDirty)}
                                    disabled={index === copywritingOrder.length - 1}
                                    className="w-8 h-8 rounded-full bg-sand text-ink/70 hover:text-ink hover:bg-ink/10 transition-colors flex items-center justify-center disabled:opacity-30 disabled:hover:bg-sand disabled:hover:text-ink/70"
                                  >
                                    <ArrowDown size={14} />
                                  </button>
                                  <div className="w-px h-6 bg-ink/10 mx-1" />
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleCopywritingDelete(item.id);
                                    }}
                                    disabled={copywritingDeletingId === item.id}
                                    className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center disabled:opacity-50"
                                    aria-label="Delete copywriting image"
                                  >
                                    {copywritingDeletingId === item.id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                                  </button>
                                </div>
                              </div>

                              {imageSrc && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setPreviewModal({
                                      type: "single",
                                      title: previewTitle,
                                      image: imageSrc,
                                    });
                                  }}
                                  className="aspect-video w-full bg-sand rounded-2xl mb-4 overflow-hidden relative group"
                                >
                                  <img
                                    src={imageSrc}
                                    alt="Copywriting preview"
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </button>
                              )}

                              <div className="flex items-center justify-between mt-auto pt-4 border-t border-ink/5">
                                <span className="text-xs text-ink/30 font-mono uppercase">
                                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      currentData.map((item) => {
                        const imageSrc = item.image_url ?? item.avatar_url ?? item.before_image_url ?? item.after_image_url ?? undefined;
                        const beforeImage = (item as AdminListItem).before_image_url ?? null;
                        const afterImage = (item as AdminListItem).after_image_url ?? null;
                        const canShowBeforeAfter = Boolean(beforeImage && afterImage);
                        const canvaEmbedUrl = getCanvaEmbedUrl(item.video_url);
                        const rawTitle = (item.title || item.client_name || item.name || item.client || "").trim();
                        const showTitle = rawTitle.length > 0 && rawTitle.toLowerCase() !== "untitled";
                        const previewTitle = showTitle ? rawTitle : "Preview";
                        const industryName = 'industry_id' in item ? getIndustryName((item as { industry_id?: string | null }).industry_id) : null;

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl p-5 border border-ink/5 hover:border-ink/20 hover:shadow-xl transition-all group"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 min-w-0 pr-4">
                                {showTitle && (
                                  <h3 className="font-bold text-lg truncate">{rawTitle}</h3>
                                )}
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
                                onClick={() => {
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
                            {(["reels", "stories"] as TableKey[]).includes(selectedTable) && item.video_url && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewModal({
                                    type: "video",
                                    title: previewTitle,
                                    video: item.video_url ?? null,
                                  })
                                }
                                className="aspect-video w-full bg-black rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden cursor-pointer hover:opacity-95 transition-opacity group"
                              >
                                {canvaEmbedUrl ? (
                                  <iframe
                                    src={canvaEmbedUrl}
                                    title="Canva video"
                                    className="absolute inset-0 w-full h-full pointer-events-none"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                    loading="lazy"
                                  />
                                ) : (
                                  <video
                                    src={item.video_url}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                  />
                                )}
                                {/* Click Overlay */}
                                <div className="absolute inset-0 z-10 bg-transparent" />

                                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                                    <Video size={24} />
                                  </div>
                                </div>
                              </button>
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
                ) : previewModal.type === "video" ? (
                  <div className="p-6 bg-sand/20">
                    <div className="rounded-2xl overflow-hidden bg-black border border-ink/10 aspect-video">
                      {previewModal.video ? (
                        (() => {
                          const canvaEmbedUrl = getCanvaEmbedUrl(previewModal.video);
                          return canvaEmbedUrl ? (
                            <iframe
                              src={canvaEmbedUrl}
                              title="Canva video"
                              className="w-full h-full"
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                              loading="lazy"
                            />
                          ) : (
                            <video
                              src={previewModal.video}
                              controls
                              playsInline
                              className="w-full h-full"
                            />
                          );
                        })()
                      ) : (
                        <div className="flex items-center justify-center h-64 text-sm text-ink/40">No video</div>
                      )}
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
                    : isEditingIndustry
                      ? "Edit Industry"
                      : isEditingPhotoEditing
                        ? "Edit Photo Edit"
                        : `New ${showClientForm ? "Client" : TABLE_CONFIG[formTable].singularLabel}`}
                </h3>
                <button onClick={closeCreateForm} className="p-2 hover:bg-ink/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form
                key={isEditingTestimonial
                  ? editingTestimonial?.id ?? "edit"
                  : isEditingIndustry
                    ? editingIndustry?.id ?? "edit"
                    : isEditingPhotoEditing
                      ? editingPhotoEditing?.id ?? "edit"
                      : "create"}
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
                        : isEditingIndustry && field.name === "name"
                          ? (editingIndustry?.name ?? "")
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
