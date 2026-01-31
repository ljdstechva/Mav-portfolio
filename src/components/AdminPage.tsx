"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabaseClient } from "@/lib/supabaseClient";

type ProjectItem = {
  id: string;
  title: string;
  category?: string | null;
  image_url?: string | null;
  link?: string | null;
  description?: string | null;
  created_at?: string | null;
};

type IndustryItem = {
  id: string;
  name: string;
  slug: string;
  display_order?: number | null;
};

type ClientItem = {
  id: string;
  industry_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  thumbnail_url?: string | null;
  website_url?: string | null;
};

type AssetItem = {
  id: string;
  client_id?: string | null;
  asset_url: string;
  caption?: string | null;
  format?: string | null;
  display_order?: number | null;
};

type TestimonialItem = {
  id: string;
  client_id?: string | null;
  client_name: string;
  quote: string;
  rating?: number | null;
};

type CredentialItem = {
  id: string;
  title: string;
  issuer?: string | null;
  date_issued?: string | null;
};

type ProfileItem = {
  id: string;
  username: string;
  full_name?: string | null;
};

type TableKey =
  | "industries"
  | "clients"
  | "projects"
  | "portfolio_assets"
  | "testimonials"
  | "credentials"
  | "profiles";

type FieldConfig = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "url" | "date" | "textarea";
  helper?: string;
  required?: boolean;
};

const TABLE_FIELDS: Record<TableKey, FieldConfig[]> = {
  industries: [
    { name: "name", label: "Industry name", required: true },
    { name: "slug", label: "Slug", helper: "e.g. beauty" },
    { name: "display_order", label: "Display order", type: "number" },
  ],
  clients: [
    { name: "industry_id", label: "Industry ID" },
    { name: "name", label: "Client name", required: true },
    { name: "slug", label: "Slug", helper: "e.g. glow-cosmetics" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "thumbnail_url", label: "Thumbnail URL", type: "url" },
    { name: "website_url", label: "Website URL", type: "url" },
  ],
  projects: [
    { name: "title", label: "Project title", required: true },
    { name: "description", label: "Description", type: "textarea" },
    { name: "category", label: "Category" },
    { name: "image_url", label: "Image URL", type: "url" },
    { name: "link", label: "Project link", type: "url" },
    { name: "time_saved", label: "Time saved" },
    { name: "cost_saved", label: "Cost saved" },
    {
      name: "tags",
      label: "Tags",
      helper: "Comma-separated",
    },
    { name: "video_url", label: "Video URL", type: "url" },
    { name: "preview_image", label: "Preview image", type: "url" },
    {
      name: "detailed_description",
      label: "Detailed description",
      helper: "Comma-separated",
      type: "textarea",
    },
  ],
  portfolio_assets: [
    { name: "client_id", label: "Client ID" },
    { name: "asset_url", label: "Asset URL", type: "url", required: true },
    { name: "caption", label: "Caption" },
    { name: "format", label: "Format" },
    { name: "display_order", label: "Display order", type: "number" },
  ],
  testimonials: [
    { name: "client_id", label: "Client ID" },
    { name: "client_name", label: "Client name", required: true },
    { name: "quote", label: "Quote", type: "textarea", required: true },
    { name: "rating", label: "Rating", type: "number" },
  ],
  credentials: [
    { name: "title", label: "Credential title", required: true },
    { name: "issuer", label: "Issuer" },
    { name: "date_issued", label: "Date issued", type: "date" },
    { name: "image_url", label: "Image URL", type: "url" },
    { name: "link", label: "Link", type: "url" },
    { name: "credential_id", label: "Credential ID" },
    {
      name: "categories",
      label: "Categories",
      helper: "Comma-separated",
    },
    {
      name: "skills",
      label: "Skills",
      helper: "Comma-separated",
    },
    { name: "external_url", label: "External URL", type: "url" },
    { name: "provider", label: "Provider" },
  ],
  profiles: [
    { name: "username", label: "Username", required: true },
    { name: "full_name", label: "Full name" },
    { name: "bio", label: "Bio", type: "textarea" },
    { name: "avatar_url", label: "Avatar URL", type: "url" },
    {
      name: "social_links",
      label: "Social links (JSON)",
      helper: "{" + '"instagram": "..."' + "}",
      type: "textarea",
    },
  ],
};

const IMAGE_FIELDS = new Set([
  "image_url",
  "thumbnail_url",
  "asset_url",
  "avatar_url",
  "preview_image",
]);

type LoginState = "idle" | "loading" | "error";
type UploadState = "idle" | "loading" | "error" | "success";

export function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const authed = useMemo(() => Boolean(session), [session]);
  const [loginState, setLoginState] = useState<LoginState>("idle");
  const [loginError, setLoginError] = useState("");
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [industries, setIndustries] = useState<IndustryItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [adminLoaded, setAdminLoaded] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableKey>("projects");
  const [fieldUpload, setFieldUpload] = useState<{ field: string; message: string } | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [dragOverField, setDragOverField] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadMessage, setUploadMessage] = useState("");

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects", {
        cache: "no-store",
        headers: session
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });
      if (!response.ok) {
        throw new Error("Failed to load projects");
      }
      const data = (await response.json()) as ProjectItem[];
      setProjects(data);
      setProjectsLoaded(true);
    } catch (error) {
      setProjectsLoaded(true);
    }
  }, [session]);

  const fetchAdminData = useCallback(async () => {
    try {
      const response = await fetch("/api/admin-data", {
        cache: "no-store",
        headers: session
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });
      if (!response.ok) {
        throw new Error("Failed to load admin data");
      }
      const data = (await response.json()) as {
        industries: IndustryItem[];
        clients: ClientItem[];
        projects: ProjectItem[];
        assets: AssetItem[];
        testimonials: TestimonialItem[];
        credentials: CredentialItem[];
        profiles: ProfileItem[];
      };
      setIndustries(data.industries);
      setClients(data.clients);
      setProjects(data.projects);
      setAssets(data.assets);
      setTestimonials(data.testimonials);
      setCredentials(data.credentials);
      setProfiles(data.profiles);
      setAdminLoaded(true);
    } catch (error) {
      setAdminLoaded(true);
    }
  }, [session]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabaseClient.auth.getSession();
      if (mounted) {
        setSession(data.session ?? null);
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authed && !projectsLoaded) {
      void fetchProjects();
    }
    if (authed && !adminLoaded) {
      void fetchAdminData();
    }
  }, [authed, adminLoaded, fetchAdminData, fetchProjects, projectsLoaded]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginState("loading");
    setLoginError("");

    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") ?? "").trim();
    const password = String(form.get("password") ?? "").trim();

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: username,
        password,
      });
      if (error) {
        throw error;
      }
      setLoginState("idle");
    } catch (error) {
      setLoginState("error");
      setLoginError(error instanceof Error ? error.message : "Login failed");
    }
  };

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    setProjects([]);
    setProjectsLoaded(false);
    setIndustries([]);
    setClients([]);
    setAssets([]);
    setTestimonials([]);
    setCredentials([]);
    setProfiles([]);
    setAdminLoaded(false);
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadState("loading");
    setUploadMessage("");

    const form = new FormData(event.currentTarget);
    try {
      const values: Record<string, string> = {};
      TABLE_FIELDS[selectedTable].forEach((field) => {
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
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message ?? "Upload failed");
      }

      setUploadState("success");
      setUploadMessage("Record saved.");
      event.currentTarget.reset();
      await fetchProjects();
      await fetchAdminData();
    } catch (error) {
      setUploadState("error");
      setUploadMessage(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const handleImagePick = (fieldName: string) => {
    fileInputRefs.current[fieldName]?.click();
  };

  const handleImageUpload = async (fieldName: string, file: File | null) => {
    if (!file) {
      return;
    }

    setUploadingField(fieldName);
    setFieldUpload(null);

    try {
      const extension = file.name.split(".").pop() || "png";
      const filePath = `${selectedTable}/${fieldName}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabaseClient.storage
        .from("portfolio")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/png",
        });

      if (error) {
        throw error;
      }

      const { data } = supabaseClient.storage
        .from("portfolio")
        .getPublicUrl(filePath);

      if (data.publicUrl) {
        const input = inputRefs.current[fieldName];
        if (input) {
          input.value = data.publicUrl;
        }
        setImagePreview((prev) => ({ ...prev, [fieldName]: data.publicUrl }));
        setFieldUpload({ field: fieldName, message: "Image uploaded." });
      }
    } catch (error) {
      setFieldUpload({
        field: fieldName,
        message: error instanceof Error ? error.message : "Upload failed",
      });
    } finally {
      setUploadingField(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, fieldName: string) => {
    event.preventDefault();
    setDragOverField(fieldName);
  };

  const handleDragLeave = (fieldName: string) => {
    if (dragOverField === fieldName) {
      setDragOverField(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, fieldName: string) => {
    event.preventDefault();
    setDragOverField(null);
    const file = event.dataTransfer.files?.[0] ?? null;
    void handleImageUpload(fieldName, file);
  };

  const handleImageUrlChange = (fieldName: string, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setImagePreview((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
      return;
    }
    setImagePreview((prev) => ({ ...prev, [fieldName]: trimmed }));
  };

  const clearImagePreview = (fieldName: string) => {
    setImagePreview((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
    const input = inputRefs.current[fieldName];
    if (input) {
      input.value = "";
    }
  };

  if (!authed) {
    return (
      <main className="min-h-screen bg-sand text-ink flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-ink/10 bg-white/80 p-8 shadow-xl">
          <h1 className="text-2xl font-semibold">Admin Login</h1>
          <p className="text-sm text-ink/60 mt-2">
            Sign in to manage your portfolio projects.
          </p>
          <form className="mt-6 grid gap-4" onSubmit={handleLogin}>
            <input
              type="email"
              name="username"
              placeholder="Email"
              className="rounded-2xl border border-ink/15 bg-sand px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/60"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="rounded-2xl border border-ink/15 bg-sand px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/60"
              required
            />
            <button
              type="submit"
              className="rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-sand transition hover:bg-ink/90"
              disabled={loginState === "loading"}
            >
              {loginState === "loading" ? "Signing in..." : "Sign in"}
            </button>
            {loginState === "error" && (
              <p className="text-sm text-red-600">{loginError}</p>
            )}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sand text-ink px-6 py-12">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-ink/60 mt-1">
              Upload projects and manage client showcases.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-full border border-ink/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink/70 hover:border-ink"
          >
            Log out
          </button>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-ink/10 bg-white/80 p-6">
            <h2 className="text-xl font-semibold">Upload a project</h2>
            <form className="mt-6 grid gap-4" onSubmit={handleUpload}>
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
                  Table
                </label>
                <select
                  value={selectedTable}
                  onChange={(event) => setSelectedTable(event.target.value as TableKey)}
                  className="rounded-2xl border border-ink/15 bg-sand px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/60"
                >
                  <option value="industries">Industries</option>
                  <option value="clients">Clients</option>
                  <option value="projects">Projects</option>
                  <option value="portfolio_assets">Portfolio Assets</option>
                  <option value="testimonials">Testimonials</option>
                  <option value="credentials">Credentials</option>
                  <option value="profiles">Profiles</option>
                </select>
              </div>

              {TABLE_FIELDS[selectedTable].map((field) => (
                <div key={field.name} className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/60">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      name={field.name}
                      placeholder={field.placeholder ?? field.label}
                      rows={3}
                      className="rounded-2xl border border-ink/15 bg-sand px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/60"
                      required={field.required}
                    />
                  ) : (
                    <div className="grid gap-2">
                      <input
                        ref={(node) => {
                          inputRefs.current[field.name] = node;
                        }}
                        type={field.type ?? "text"}
                        name={field.name}
                        placeholder={field.placeholder ?? field.label}
                        className="rounded-2xl border border-ink/15 bg-sand px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/60"
                        required={field.required}
                        onChange={(event) => {
                          if (IMAGE_FIELDS.has(field.name)) {
                            handleImageUrlChange(field.name, event.target.value);
                          }
                        }}
                      />
                      {IMAGE_FIELDS.has(field.name) && (
                        <div className="grid gap-3">
                          <input
                            ref={(node) => {
                              fileInputRefs.current[field.name] = node;
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) =>
                              handleImageUpload(field.name, event.target.files?.[0] ?? null)
                            }
                          />
                          <div
                            onDragOver={(event) => handleDragOver(event, field.name)}
                            onDragLeave={() => handleDragLeave(field.name)}
                            onDrop={(event) => handleDrop(event, field.name)}
                            className={`rounded-2xl border border-dashed px-4 py-4 text-xs uppercase tracking-[0.2em] text-ink/50 transition ${
                              dragOverField === field.name
                                ? "border-ink bg-terracotta/10 text-ink"
                                : "border-ink/20 bg-white/60"
                            }`}
                          >
                            Drag & drop an image here
                          </div>
                          {imagePreview[field.name] && (
                            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white/70">
                              <img
                                src={imagePreview[field.name]}
                                alt="Preview"
                                className="h-40 w-full object-cover"
                              />
                              <div className="flex justify-end border-t border-ink/10 bg-white/80 px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => clearImagePreview(field.name)}
                                  className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ink/60 hover:text-ink"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleImagePick(field.name)}
                              className="rounded-full border border-ink/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-ink/70 hover:border-ink"
                              disabled={uploadingField === field.name}
                            >
                              {uploadingField === field.name ? "Uploading..." : "Upload image"}
                            </button>
                            {fieldUpload?.field === field.name && (
                              <span className="text-xs text-ink/60">
                                {fieldUpload.message}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {field.helper && (
                    <span className="text-xs text-ink/50">{field.helper}</span>
                  )}
                </div>
              ))}
              <button
                type="submit"
                className="rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-sand transition hover:bg-ink/90"
                disabled={uploadState === "loading"}
              >
                {uploadState === "loading" ? "Saving..." : "Save record"}
              </button>
              <p className="text-xs text-ink/50">
                Images upload to Supabase Storage bucket <span className="text-ink">portfolio</span>.
                Ensure the bucket is public or allow authenticated uploads.
              </p>
              {uploadState !== "idle" && (
                <p className={uploadState === "error" ? "text-sm text-red-600" : "text-sm text-emerald-600"}>
                  {uploadMessage}
                </p>
              )}
            </form>
          </div>

          <div className="rounded-3xl border border-ink/10 bg-white/80 p-6">
            <h2 className="text-xl font-semibold">Dashboard data</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs uppercase tracking-[0.2em] text-ink/60">
              <div className="rounded-2xl border border-ink/10 bg-sand/70 p-3">
                Industries: <span className="text-ink">{industries.length}</span>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-sand/70 p-3">
                Clients: <span className="text-ink">{clients.length}</span>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-sand/70 p-3">
                Projects: <span className="text-ink">{projects.length}</span>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-sand/70 p-3">
                Assets: <span className="text-ink">{assets.length}</span>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-sand/70 p-3">
                Testimonials: <span className="text-ink">{testimonials.length}</span>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-sand/70 p-3">
                Credentials: <span className="text-ink">{credentials.length}</span>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-sand/70 p-3">
                Profiles: <span className="text-ink">{profiles.length}</span>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              {adminLoaded && projects.length === 0 && (
                <p className="text-sm text-ink/60">No records available.</p>
              )}
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-2xl border border-ink/10 bg-sand/70 p-4 text-sm"
                >
                  <p className="font-semibold text-ink">{project.title}</p>
                  <p className="text-ink/60">
                    {project.category ?? "Uncategorized"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
