"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Upload,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  BarChart3,
  Zap,
  Eye,
  FileText,
  Car,
  Sun,
  Layers,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { MediaStatus } from "@/lib/types";

// ─── Animation helpers ─────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const, delay: i * 0.06 },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// ─── Status helpers ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MediaStatus }) {
  const map: Record<
    MediaStatus,
    { label: string; variant: "success" | "warning" | "destructive" | "pending" }
  > = {
    completed: { label: "Completed", variant: "success" },
    processing: { label: "Processing", variant: "warning" },
    pending: { label: "Pending", variant: "pending" },
    failed: { label: "Failed", variant: "destructive" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function StatusIcon({ status }: { status: MediaStatus }) {
  if (status === "completed")
    return <CheckCircle2 className="size-4 text-emerald-500" />;
  if (status === "failed") return <XCircle className="size-4 text-destructive" />;
  if (status === "processing")
    return <Loader2 className="size-4 text-amber-500 animate-spin" />;
  return <Clock className="size-4 text-muted-foreground" />;
}

// ─── Mock recent jobs (shown when no real data is available) ──────────────────

const MOCK_JOBS = [
  {
    processingId: "media_k8v3xp4a91",
    status: "completed" as MediaStatus,
    filename: "vehicle_front.jpg",
    size: "2.4 MB",
    elapsed: "1.2s",
    plate: "MH12AB3456",
    ago: "2 min ago",
  },
  {
    processingId: "media_n2wq7mr3tz",
    status: "completed" as MediaStatus,
    filename: "receipt_scan.png",
    size: "890 KB",
    elapsed: "2.8s",
    plate: null,
    ago: "8 min ago",
  },
  {
    processingId: "media_p5xj1bc8fy",
    status: "processing" as MediaStatus,
    filename: "parking_lot.jpg",
    size: "4.1 MB",
    elapsed: "—",
    plate: null,
    ago: "just now",
  },
  {
    processingId: "media_r7dh4lq2sk",
    status: "failed" as MediaStatus,
    filename: "dark_image.jpg",
    size: "1.2 MB",
    elapsed: "0.3s",
    plate: null,
    ago: "15 min ago",
  },
  {
    processingId: "media_t9am6ow5vn",
    status: "pending" as MediaStatus,
    filename: "street_view.jpeg",
    size: "3.6 MB",
    elapsed: "—",
    plate: null,
    ago: "just now",
  },
];

// ─── Stat cards data ────────────────────────────────────────────────────────────

const STATS = [
  {
    label: "Total Processed",
    value: "1,284",
    delta: "+12% this week",
    positive: true,
    icon: Activity,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    label: "Completed",
    value: "1,201",
    delta: "93.5% success rate",
    positive: true,
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    label: "Failed",
    value: "83",
    delta: "6.5% failure rate",
    positive: false,
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    label: "Avg. Processing",
    value: "1.8s",
    delta: "Parallel pipeline",
    positive: true,
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
];

// ─── Analyzer breakdown ────────────────────────────────────────────────────────

const ANALYZER_STATS = [
  { name: "Blur Detection", icon: Eye, pct: 100, color: "bg-violet-500" },
  { name: "Brightness", icon: Sun, pct: 100, color: "bg-amber-500" },
  { name: "OCR", icon: FileText, pct: 97, color: "bg-sky-500" },
  { name: "Plate Recognition", icon: Car, pct: 23, color: "bg-emerald-500" },
  { name: "Metadata", icon: Layers, pct: 100, color: "bg-pink-500" },
];

// ─── Components ────────────────────────────────────────────────────────────────

function StatCards() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {STATS.map((s, i) => (
        <motion.div key={s.label} variants={fadeUp} custom={i}>
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                  <p
                    className={`text-xs mt-1 ${
                      s.positive ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {s.delta}
                  </p>
                </div>
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${s.bg}`}
                >
                  <s.icon className={`size-4 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

function AnalyzerBreakdown() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              Analyzer Coverage
            </CardTitle>
            <CardDescription className="mt-1">
              Detection rate across all processed images
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {ANALYZER_STATS.map((a, i) => (
          <motion.div
            key={a.name}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="flex items-center gap-3"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
              <a.icon className="size-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium">{a.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {a.pct}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${a.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${a.pct}%` }}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.06, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

function RecentJobs({
  onLookup,
}: {
  onLookup: (id: string) => void;
}) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Recent Jobs
            </CardTitle>
            <CardDescription className="mt-1">
              Sample job history — paste a processing ID below to check a real job
            </CardDescription>
          </div>
          <Link href="/upload">
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              <Upload className="size-3.5" />
              New
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {MOCK_JOBS.map((job, i) => (
            <motion.div
              key={job.processingId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 * i }}
              className="flex items-center gap-3 px-6 py-3.5 hover:bg-muted/40 transition-colors group"
            >
              <StatusIcon status={job.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">{job.filename}</p>
                  <StatusBadge status={job.status} />
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {job.processingId}
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-end shrink-0 gap-0.5">
                <span className="text-xs text-muted-foreground">{job.ago}</span>
                <span className="text-xs text-muted-foreground">{job.size}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                aria-label="View result"
                onClick={() => onLookup(job.processingId)}
              >
                <ArrowRight className="size-3.5" />
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function IdLookup() {
  const [id, setId] = useState("");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="size-4 text-primary" />
          Look up a job
        </CardTitle>
        <CardDescription>
          Paste a processing ID to check its status or view results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="media_k8v3xp4a91"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          onKeyDown={(e) => {
            if (e.key === "Enter" && id.trim()) {
              window.location.href = `/status/${id.trim()}`;
            }
          }}
        />
        <div className="flex gap-2">
          <Link
            href={id.trim() ? `/status/${id.trim()}` : "#"}
            className="flex-1"
            aria-disabled={!id.trim()}
          >
            <Button
              className="w-full gap-1.5"
              disabled={!id.trim()}
              size="sm"
            >
              Check Status
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
          <Link
            href={id.trim() ? `/results/${id.trim()}` : "#"}
            className="flex-1"
            aria-disabled={!id.trim()}
          >
            <Button
              variant="outline"
              className="w-full gap-1.5"
              disabled={!id.trim()}
              size="sm"
            >
              View Results
            </Button>
          </Link>
        </div>

        <Separator />

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Quick links</p>
          <div className="flex flex-wrap gap-1.5">
            {MOCK_JOBS.slice(0, 3).map((j) => (
              <button
                key={j.processingId}
                onClick={() => setId(j.processingId)}
                className="rounded-md border border-border bg-muted/50 px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {j.processingId}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    {
      href: "/upload",
      icon: Upload,
      label: "Upload image",
      desc: "Start a new analysis",
      color: "text-violet-500",
      bg: "bg-violet-500/10 hover:bg-violet-500/20",
    },
    {
      href: "/upload",
      icon: Zap,
      label: "Batch upload",
      desc: "Analyze multiple files",
      color: "text-amber-500",
      bg: "bg-amber-500/10 hover:bg-amber-500/20",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {actions.map((a) => (
          <Link key={a.href + a.label} href={a.href}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex flex-col items-center gap-2 rounded-xl p-4 transition-colors cursor-pointer ${a.bg}`}
            >
              <a.icon className={`size-5 ${a.color}`} />
              <div className="text-center">
                <p className="text-xs font-medium">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [lookupId, setLookupId] = useState("");

  return (
    <div className="min-h-screen">
      <div className="container max-w-screen-xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Overview of your media processing jobs and pipeline health.
            </p>
          </div>
          <Link href="/upload">
            <Button className="gap-2 shrink-0">
              <Upload className="size-4" />
              Upload Image
            </Button>
          </Link>
        </motion.div>

        {/* Stats row */}
        <StatCards />

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent jobs spans 2 cols */}
          <RecentJobs onLookup={(id) => setLookupId(id)} />

          {/* Right column */}
          <div className="flex flex-col gap-6">
            <IdLookup />
            <QuickActions />
          </div>
        </div>

        {/* Analyzer breakdown */}
        <div className="mt-6">
          <AnalyzerBreakdown />
        </div>

        {/* Subtle notice */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center text-xs text-muted-foreground"
        >
          Stats shown are illustrative. Connect to the backend to see live data.
        </motion.p>
      </div>

      {/* Hidden — keep lookupId state accessible */}
      {lookupId && (
        <div className="hidden">{lookupId}</div>
      )}
    </div>
  );
}
