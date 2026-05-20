"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  CalendarCheck2,
  MessageCircleReply,
  SearchCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import BorderGlow from "./BorderGlow";

type ProcessStep = {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

const processSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Find the audience signal",
    description:
      "Review the brand voice, platform data, competitor space, and the questions people already ask before creating the next post.",
    icon: SearchCheck,
    accent: "bg-[#F8E4D6] text-sienna",
  },
  {
    number: "02",
    title: "Shape the content direction",
    description:
      "Turn goals into clear content pillars, post ideas, hooks, formats, and a cadence that fits the channels where the audience is active.",
    icon: CalendarCheck2,
    accent: "bg-[#E7EFE0] text-[#667455]",
  },
  {
    number: "03",
    title: "Create scroll-ready assets",
    description:
      "Batch captions, graphics, carousels, Reels, and AI-assisted visuals with clean design, strong openings, and a reason to engage.",
    icon: Sparkles,
    accent: "bg-[#F7E8C6] text-[#A37022]",
  },
  {
    number: "04",
    title: "Publish, engage, improve",
    description:
      "Schedule with intent, reply to comments and messages, then read saves, shares, replies, clicks, and reach to improve the next cycle.",
    icon: MessageCircleReply,
    accent: "bg-[#E4EEF6] text-[#4F6F88]",
  },
];

export function Process() {
  return (
    <section
      id="process"
      className="relative overflow-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#FBF5EF_52%,#FFFDFB_100%)] px-4 py-24 md:px-8"
      aria-labelledby="process-heading"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink/10 to-transparent" />

      <div className="mx-auto max-w-7xl">
        <div className="mb-10 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <span className="mb-8 inline-flex rounded-full border border-ink/10 bg-white/80 px-5 py-2 text-sm font-semibold text-ink/70 shadow-sm backdrop-blur">
              Process
            </span>

            <h2
              id="process-heading"
              className="max-w-4xl text-5xl font-extrabold leading-[0.96] text-ink md:text-6xl"
            >
              A clear workflow from insight to engagement-ready posts.
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.65, delay: 0.12, ease: "easeOut" }}
            className="rounded-[2rem] border border-ink/10 bg-white/70 p-6 shadow-sm backdrop-blur"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-sand">
              <BarChart3 className="h-5 w-5" />
            </div>
            <p className="text-lg leading-relaxed text-ink/65">
              The process balances creativity with data: listen first, plan clearly, create with polish,
              then use engagement signals to make the next round sharper.
            </p>
          </motion.div>
        </div>

        <motion.ol
          className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.18 }}
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {processSteps.map((step) => (
            <ProcessCard key={step.number} step={step} />
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

function ProcessCard({ step }: { step: ProcessStep }) {
  const Icon = step.icon;

  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 28 },
        show: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      whileHover={{ y: -10 }}
      className="group relative min-h-[320px] rounded-[2rem]"
    >
      <BorderGlow
        className="min-h-[320px]"
        backgroundColor="#F6EFE7"
        borderRadius={32}
        edgeSensitivity={18}
        glowColor="328 100 62"
        glowRadius={38}
        glowIntensity={1}
        coneSpread={23}
        fillOpacity={0.5}
        colors={["#ff34a6", "#ff6bc1", "#ffb3dc"]}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-sienna/45 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative flex h-full min-h-[320px] flex-col rounded-[2rem] p-7">
          <div className="mb-10 flex items-center justify-between gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-ink/10 bg-white/65 text-sm font-extrabold text-ink shadow-sm">
              {step.number}
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${step.accent} transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-3`}
            >
              <Icon className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-auto">
            <h3 className="max-w-[13rem] text-2xl font-extrabold leading-[1.05] text-ink md:text-[1.55rem]">
              {step.title}
            </h3>
            <p className="mt-6 text-base leading-relaxed text-ink/62 md:text-[1.05rem]">
              {step.description}
            </p>
          </div>
        </div>
      </BorderGlow>
    </motion.li>
  );
}
