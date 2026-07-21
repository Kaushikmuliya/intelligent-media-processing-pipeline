"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Cpu,
  Upload,
  Zap,
  Eye,
  FileText,
  Car,
  Sun,
  Layers,
  ArrowRight,
  CheckCircle2,
  Shield,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Animation Variants ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const, delay: i * 0.08 },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ─── Feature Data ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Eye,
    title: "Blur Detection",
    description:
      "Laplacian-variance scoring instantly flags blurry or out-of-focus images with a confidence score.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Sun,
    title: "Brightness Analysis",
    description:
      "Per-pixel luminance averaging classifies images as optimal, too dark, or overexposed.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: FileText,
    title: "OCR Extraction",
    description:
      "Tesseract-powered text recognition pulls every word from your image with a confidence rating.",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  {
    icon: Car,
    title: "Number Plate Recognition",
    description:
      "Regex-based validation detects and formats Indian vehicle registration plates from OCR output.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Layers,
    title: "Metadata Extraction",
    description:
      "Format, dimensions, color-space, alpha channel, DPI — all extracted in a single pass.",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    icon: Zap,
    title: "Parallel Pipeline",
    description:
      "All analyzers run concurrently via BullMQ workers, so results arrive fast regardless of image size.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
];

const STEPS = [
  { step: "01", title: "Upload", desc: "Drag and drop any image up to 10 MB." },
  { step: "02", title: "Analyze", desc: "The pipeline runs all analyzers in parallel." },
  { step: "03", title: "Inspect", desc: "View rich results, download JSON, or copy the report." },
];

const TRUST_BADGES = [
  { icon: Shield, label: "Secure processing" },
  { icon: Activity, label: "Real-time status" },
  { icon: CheckCircle2, label: "Structured JSON output" },
  { icon: Zap, label: "Sub-second analysis" },
];

// ─── Section: Hero ─────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-24 pb-20 md:pt-36 md:pb-32">
      {/* Gradient blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-violet-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{ clipPath: "polygon(74.1% 44.1%,100% 61.6%,97.5% 26.9%,85.5% 0.1%,80.7% 2%,72.5% 32.5%,60.2% 62.4%,52.4% 68.1%,47.5% 58.3%,45.2% 34.5%,27.5% 76.7%,0.1% 64.9%,17.9% 100%,27.6% 76.8%,76.1% 97.7%,74.1% 44.1%)" }}
        />
      </div>

      <div className="container max-w-screen-xl mx-auto px-4">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-3xl text-center"
        >
          {/* Pill badge */}
          <motion.div variants={fadeUp} custom={0} className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Cpu className="size-3" />
              Intelligent Media Processing Pipeline
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl"
          >
            Understand every pixel{" "}
            <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              instantly.
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-6 text-lg leading-8 text-muted-foreground max-w-xl mx-auto"
          >
            Upload an image and get back blur scores, brightness readings, OCR
            text, number-plate detection, and rich metadata — all in one
            structured report.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/upload">
              <Button size="lg" className="gap-2 h-11 px-7 text-base font-semibold">
                <Upload className="size-4" />
                Upload an image
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 h-11 px-7 text-base"
              >
                View Dashboard
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Trust row */}
          <motion.div
            variants={fadeUp}
            custom={4}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
          >
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Icon className="size-3.5 text-primary" />
                {label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mt-16 mx-auto max-w-4xl"
        >
          <HeroMockup />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Hero Mockup: fake analysis result card ────────────────────────────────────

function HeroMockup() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5 overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3 bg-muted/50">
        <span className="size-3 rounded-full bg-red-400/70" />
        <span className="size-3 rounded-full bg-amber-400/70" />
        <span className="size-3 rounded-full bg-emerald-400/70" />
        <span className="ml-3 text-xs text-muted-foreground font-mono">
          media_k8v3xp4a91 · completed
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-500 font-medium">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {/* Content */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border">
        {[
          { label: "Blur Score", value: "34.21", sub: "Sharp", color: "text-emerald-500" },
          { label: "Brightness", value: "142.5", sub: "Good", color: "text-emerald-500" },
          { label: "OCR Confidence", value: "94.3%", sub: "High", color: "text-sky-500" },
          { label: "Plate Detected", value: "MH12AB3456", sub: "Valid", color: "text-emerald-500" },
          { label: "Resolution", value: "1920×1080", sub: "JPEG · RGB", color: "text-muted-foreground" },
          { label: "Processing", value: "1.2s", sub: "Parallel", color: "text-violet-500" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-card p-4 md:p-5">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-lg font-semibold font-mono ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Features ─────────────────────────────────────────────────────────

function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 border-t border-border/60">
      <div className="container max-w-screen-xl mx-auto px-4">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="mx-auto max-w-2xl text-center mb-16"
        >
          <motion.p variants={fadeUp} className="text-sm font-medium text-primary mb-3">
            Six analyzers, one pipeline
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Everything you need to know about an image
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-muted-foreground text-base leading-relaxed"
          >
            Each analyzer runs independently and in parallel so you always get
            complete results fast.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="group relative rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
            >
              <div className={`inline-flex size-10 items-center justify-center rounded-lg ${f.bg} mb-4`}>
                <f.icon className={`size-5 ${f.color}`} />
              </div>
              <h3 className="text-sm font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section: How it works ─────────────────────────────────────────────────────

function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 border-t border-border/60 bg-muted/30">
      <div className="container max-w-screen-xl mx-auto px-4">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="mx-auto max-w-2xl text-center mb-16"
        >
          <motion.p variants={fadeUp} className="text-sm font-medium text-primary mb-3">
            Simple workflow
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            From upload to insights in seconds
          </motion.h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="relative grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          {/* connector line */}
          <div
            aria-hidden
            className="hidden md:block absolute top-8 left-[calc(16.666%+1rem)] right-[calc(16.666%+1rem)] h-px bg-gradient-to-r from-transparent via-border to-transparent"
          />

          {STEPS.map(({ step, title, desc }) => (
            <motion.div
              key={step}
              variants={fadeUp}
              className="relative flex flex-col items-center text-center gap-4"
            >
              <div className="relative flex size-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                <span className="text-xl font-bold font-mono text-primary">{step}</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section: CTA ──────────────────────────────────────────────────────────────

function CtaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 border-t border-border/60">
      <div className="container max-w-screen-xl mx-auto px-4">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl font-bold tracking-tight sm:text-4xl mb-4"
          >
            Ready to analyze your images?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-muted-foreground text-base mb-10"
          >
            Drop in any image and get a full analysis report in seconds.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/upload">
              <Button size="lg" className="gap-2 h-11 px-8 text-base font-semibold">
                <Upload className="size-4" />
                Get started free
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="lg" className="h-11 px-8 text-base">
                View dashboard
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border/60 py-8">
      <div className="container max-w-screen-xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Cpu className="size-4 text-primary" />
          <span>MediaPipeline</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Built with Next.js · TypeScript · Tailwind CSS
        </p>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <Hero />
      <FeaturesSection />
      <HowItWorks />
      <CtaSection />
      <Footer />
    </>
  );
}
