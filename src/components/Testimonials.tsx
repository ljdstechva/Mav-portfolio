"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Play, Quote, Star } from "lucide-react";
import { getSupabaseClient, getSupabaseConfigError } from "@/lib/supabaseClient";
import { formatTestimonialAttribution, getTestimonialMediaKind } from "@/lib/testimonialMedia";
import BookingModal from "./BookingModal";

type Testimonial = {
  id: string;
  client_name: string;
  role?: string | null;
  company?: string | null;
  quote: string;
  avatar_url?: string | null;
  sort_order?: number | null;
};

export function Testimonials() {
  const configError = getSupabaseConfigError();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(!configError);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    if (configError) {
      return;
    }

    const supabase = getSupabaseClient();
    let mounted = true;

    const fetchTestimonials = async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("id, client_name, role, company, quote, avatar_url, sort_order")
        .order("sort_order", { ascending: true, nullsFirst: false })
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
  }, [configError]);

  return (
    <section
      className="relative overflow-hidden bg-[linear-gradient(180deg,#FDF7F2_0%,#FFFDFB_46%,#F7EEE7_100%)] px-4 py-24 md:px-8"
      id="testimonials"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-16 h-48 w-48 rounded-full bg-terracotta/10 blur-3xl" />
        <div className="absolute right-[-5rem] top-1/3 h-56 w-56 rounded-full bg-[#DDB89E]/20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink/10 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-4 py-2 backdrop-blur">
              <span className="rounded-full bg-terracotta/10 p-2 text-terracotta">
                <HeartIcon />
              </span>
              <span className="text-sm font-bold uppercase tracking-[0.25em] text-ink/55">
                Client Stories
              </span>
            </div>

            <h2 className="text-4xl font-serif font-medium text-ink md:text-5xl lg:text-6xl">
              Proof In Words And Media
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink/60">
              A blend of written feedback, campaign snapshots, and video-backed reactions from client work.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {loading && Array.from({ length: 3 }).map((_, index) => <TestimonialSkeleton key={index} />)}

          {!loading &&
            testimonials.map((testimonial, index) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
            ))}

          {!loading && testimonials.length === 0 && (
            <div className="col-span-full rounded-[2rem] border border-ink/10 bg-white/80 p-10 text-center text-ink/55 shadow-sm backdrop-blur">
              Testimonials coming soon.
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-ink/10 bg-white/85 p-2 shadow-lg backdrop-blur">
            <span className="hidden rounded-full bg-[#FFF2E8] px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-ink/55 md:inline-flex">
              Ready for the next one
            </span>
            <button
              onClick={() => setIsBookingOpen(true)}
              className="flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-sand transition-colors hover:bg-ink/90 md:text-base"
            >
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>Join the Happy Clients</span>
            </button>
          </div>
        </motion.div>
      </div>

      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </section>
  );
}

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  const displayRole = useMemo(
    () => formatTestimonialAttribution(testimonial.role, testimonial.company),
    [testimonial.company, testimonial.role]
  );
  const mediaKind = getTestimonialMediaKind(testimonial.avatar_url);
  const initials = testimonial.client_name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const spanClass =
    mediaKind === "video" ? "lg:col-span-7" : mediaKind === "image" ? "lg:col-span-6" : "lg:col-span-5";
  const cardClass =
    mediaKind === "video"
      ? "border-transparent bg-[linear-gradient(145deg,#1D1713_0%,#34261E_100%)] text-white shadow-[0_24px_80px_rgba(47,29,19,0.22)]"
      : mediaKind === "image"
        ? "border-[#E8DCCF] bg-white text-ink shadow-[0_20px_60px_rgba(56,34,21,0.08)]"
        : "border-[#E8D5C8] bg-[#FFF3EA] text-ink shadow-[0_18px_50px_rgba(83,52,33,0.08)]";
  const quoteColor = mediaKind === "video" ? "text-white/90" : "text-ink/80";
  const subTextColor = mediaKind === "video" ? "text-white/60" : "text-ink/50";
  const chipClass =
    mediaKind === "video"
      ? "border-white/10 bg-white/10 text-white/70"
      : "border-ink/10 bg-white/70 text-ink/55";

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.08, 0.32) }}
      className={`${spanClass} min-h-[340px] rounded-[2rem] border p-6 md:p-7 ${cardClass}`}
    >
      <div className={`grid h-full gap-6 ${mediaKind ? "lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]" : ""}`}>
        <div className="flex h-full flex-col justify-between">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] ${chipClass}`}>
                {mediaKind === "video" ? "Video" : mediaKind === "image" ? "Image" : "Text"}
              </span>
              {displayRole && (
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${chipClass}`}>
                  {displayRole}
                </span>
              )}
            </div>

            <div className="mb-5 flex items-center justify-between">
              <div className="flex gap-1">
                {[...Array(5)].map((_, starIndex) => (
                  <Star
                    key={starIndex}
                    size={14}
                    className={mediaKind === "video" ? "fill-[#FFD27A] text-[#FFD27A]" : "fill-terracotta text-terracotta"}
                  />
                ))}
              </div>
              <Quote className={mediaKind === "video" ? "text-white/10" : "text-ink/10"} size={44} />
            </div>

            <p className={`text-lg leading-relaxed md:text-[1.15rem] ${quoteColor}`}>
              &ldquo;{testimonial.quote}&rdquo;
            </p>
          </div>

          <div className={`mt-8 flex items-center gap-4 border-t pt-5 ${mediaKind === "video" ? "border-white/10" : "border-ink/10"}`}>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${
                mediaKind === "video" ? "bg-white/10 text-white" : "bg-white text-ink"
              }`}
            >
              {initials || testimonial.client_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold">{testimonial.client_name}</h3>
              <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${subTextColor}`}>
                {displayRole || "Client feedback"}
              </p>
            </div>
          </div>
        </div>

        {mediaKind && testimonial.avatar_url && (
          <TestimonialMediaFrame
            mediaKind={mediaKind}
            mediaUrl={testimonial.avatar_url}
            clientName={testimonial.client_name}
          />
        )}
      </div>
    </motion.article>
  );
}

function TestimonialMediaFrame({
  mediaKind,
  mediaUrl,
  clientName,
}: {
  mediaKind: "image" | "video";
  mediaUrl: string;
  clientName: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-black/5 bg-[#1C1714] shadow-inner">
      <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-ink shadow-sm">
        {mediaKind === "video" && <Play className="h-3.5 w-3.5 fill-terracotta text-terracotta" />}
        <span>{mediaKind === "video" ? "Video proof" : "Visual proof"}</span>
      </div>

      {mediaKind === "video" ? (
        <div className="relative h-full min-h-[280px]">
          <video
            src={mediaUrl}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="relative h-full min-h-[280px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl}
            alt={`${clientName} testimonial media`}
            className="h-full w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}

function TestimonialSkeleton() {
  return (
    <div className="lg:col-span-4 overflow-hidden rounded-[2rem] border border-ink/10 bg-white/70 p-6 shadow-sm">
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-28 rounded-full bg-ink/10" />
        <div className="h-5 w-20 rounded-full bg-ink/10" />
        <div className="space-y-2 pt-2">
          <div className="h-4 w-full rounded-full bg-ink/10" />
          <div className="h-4 w-[92%] rounded-full bg-ink/10" />
          <div className="h-4 w-[76%] rounded-full bg-ink/10" />
        </div>
        <div className="h-52 rounded-[1.5rem] bg-ink/10" />
      </div>
    </div>
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
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
