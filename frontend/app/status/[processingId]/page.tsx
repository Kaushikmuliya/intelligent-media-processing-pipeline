"use client";

import { use, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  Upload,
  RefreshCw,
  AlertTriangle,
  Eye,
  FileText,
  Car,
  Sun,
  Layers,
  Zap,
  Copy,
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
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaStatus } from "@/hooks/useMediaStatus";
import { useClipboard } from "@/hooks/useClipboard";
import { formatDate, formatDuration } from "@/lib/utils";
import type { MediaStatus } from "@/lib/types";

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  MediaStatus,
  {
    label: string;
    description: string;
    badgeVariant: "success" | "warning" | "destructive" | "pending";
    color: string;
    ringColor: string;
    bgColor: string;
  }
> = {
  pending: {
    label: "Pending",
    description: "Your image is queued and waiting to be picked up by the worker.",
    badgeVariant: "pending",
    color: "text-zinc-500",
    ringColor: "ring-zinc-400/40",
    bgColor: "bg-zinc-500/10",
  },
  processing: {
    label: "Processing",
    description: "The pipeline is running all analyzers in parallel right now.",
    badgeVariant: "warning",
    color: "text-amber-500",
    ringColor: "ring-amber-400/40",
    bgColor: "bg-amber-500/10",
  },
  completed: {
    label: "Completed",
    description: "All analyzers finished successfully. Your results are ready.",
    badgeVariant: "success",
    color: "text-emerald-500",
    ringColor: "ring-emerald-400/40",
    bgColor: "bg-emerald-500/10",
  },
  failed: {
    label: "Failed",
    description: "The pipeline encountered an error during processing.",
    badgeVariant: "destructive",
    color: "text-red-500",
    ringColor: "ring-red-400/40",
    bgColor: "bg-red-500/10",
  },
};

// ─── Pipeline step definitions ─────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { key: "metadata", label: "Metadata Extraction", icon: Layers },
  { key: "blur", label: "Blur Detection", icon: Eye },
  { key: "brightness", label: "Brightness Analysis", icon: Sun },
  { key: "ocr", label: "OCR Extraction", icon: FileText },
  { key: "plateValidation", label: "Plate Recognition", icon: Car },
] as const;

// ─── Animated status orb ───────────────────────────────────────────────────────

function StatusOrb({ status }: { status: MediaStatus }) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse rings — only for active states */}
      {(status === "pending" || status === "processing") && (
        <>
          <motion.span
            animate={{ scale: [1, 1.8], opacity: [0.35, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className={`absolute size-20 rounded-full ${cfg.bgColor}`}
          />
          <motion.span
            animate={{ scale: [1, 1.5], opacity: [0.25, 0] }}
            transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: "easeOut" }}
            className={`absolute size-20 rounded-full ${cfg.bgColor}`}
          />
        </>
      )}

      {/* Core circle */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={`relative flex size-20 items-center justify-center rounded-full ${cfg.bgColor} ring-4 ${cfg.ringColor}`}
      >
        {status === "pending" && (
          <Clock className={`size-8 ${cfg.color}`} />
        )}
        {status === "processing" && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className={`size-8 ${cfg.color}`} />
          </motion.div>
        )}
        {status === "completed" && (
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
          >
            <CheckCircle2 className={`size-8 ${cfg.color}`} />
          </motion.div>
        )}
        {status === "failed" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
          >
            <XCircle className={`size-8 ${cfg.color}`} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Pipeline steps tracker ────────────────────────────────────────────────────

function PipelineTracker({
  status,
  analysis,
}: {
  status: MediaStatus;
  analysis: Record<string, unknown> | null;
}) {
  return (
    <div className="space-y-2">
      {PIPELINE_STEPS.map(({ key, label, icon: Icon }, idx) => {
        const isDone =
          status === "completed" ||
          (analysis && analysis[key] !== null && analysis[key] !== undefined);
        const isActive = status === "processing";
        const isFailed = status === "failed";

        let stepState: "done" | "active" | "failed" | "waiting";
        if (isFailed) stepState = "failed";
        else if (isDone) stepState = "done";
        else if (isActive) stepState = "active";
        else stepState = "waiting";

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * idx }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            {/* Step icon */}
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
                stepState === "done"
                  ? "bg-emerald-500/15 text-emerald-500"
                  : stepState === "active"
                  ? "bg-amber-500/15 text-amber-500"
                  : stepState === "failed"
                  ? "bg-red-500/15 text-red-500"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="size-4" />
            </div>

            {/* Label */}
            <span className="flex-1 text-sm font-medium">{label}</span>

            {/* State indicator */}
            <AnimatePresence mode="wait">
              {stepState === "done" && (
                <motion.div
                  key="done"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <CheckCircle2 className="size-4 text-emerald-500" />
                </motion.div>
              )}
              {stepState === "active" && (
                <motion.div
                  key="active"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="size-4 text-amber-500" />
                  </motion.div>
                </motion.div>
              )}
              {stepState === "failed" && (
                <motion.div
                  key="failed"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <XCircle className="size-4 text-red-500" />
                </motion.div>
              )}
              {stepState === "waiting" && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="size-1.5 rounded-full bg-muted-foreground/40 inline-block" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Timing card ───────────────────────────────────────────────────────────────

function TimingCard({
  uploadedAt,
  processingStartedAt,
  completedAt,
}: {
  uploadedAt: string;
  processingStartedAt: string | null;
  completedAt: string | null;
}) {
  const rows = [
    { label: "Uploaded at", value: formatDate(uploadedAt) },
    { label: "Processing started", value: formatDate(processingStartedAt) },
    { label: "Completed at", value: formatDate(completedAt) },
    {
      label: "Total duration",
      value: formatDuration(processingStartedAt, completedAt),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="size-4 text-primary" />
          Timing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-xs font-medium font-mono text-right">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Skeleton loader ───────────────────────────────────────────────────────────

function StatusSkeleton() {
  return (
    <div className="space-y-8">
      {/* Orb */}
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="h-5 w-32 rounded-md" />
        <Skeleton className="h-4 w-64 rounded-md" />
      </div>
      {/* Steps */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatusPage({
  params,
}: {
  params: Promise<{ processingId: string }>;
}) {
  const { processingId } = use(params);
  const router = useRouter();
  const { data, error, isPolling, refetch } = useMediaStatus(processingId);
  const { copied, copy } = useClipboard();

  // Auto-navigate to results when completed
  const navigatedRef = useRef(false);
  useEffect(() => {
    if (data?.status === "completed" && !navigatedRef.current) {
      navigatedRef.current = true;
      const t = setTimeout(() => router.push(`/results/${processingId}`), 1800);
      return () => clearTimeout(t);
    }
  }, [data?.status, processingId, router]);

  const status = data?.status ?? null;
  const cfg = status ? STATUS_CONFIG[status] : null;

  return (
    <div className="min-h-screen">
      <div className="container max-w-screen-md mx-auto px-4 py-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-xl font-bold tracking-tight">Processing Status</h1>
            <button
              onClick={() => copy(processingId)}
              className="inline-flex items-center gap-1.5 mt-1 text-xs text-muted-foreground font-mono hover:text-foreground transition-colors group"
              aria-label="Copy processing ID"
            >
              <span>{processingId}</span>
              {copied ? (
                <CheckCircle2 className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isPolling && (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-500 font-medium">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="size-1.5 rounded-full bg-amber-500 inline-block"
                />
                Live
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={refetch}
              disabled={isPolling}
            >
              <RefreshCw className={`size-3.5 ${isPolling ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Error state */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-4"
            >
              <AlertTriangle className="size-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Failed to fetch status
                </p>
                <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto shrink-0 text-destructive hover:text-destructive"
                onClick={refetch}
              >
                Retry
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <AnimatePresence mode="wait">
          {!data && !error ? (
            <motion.div key="skeleton" exit={{ opacity: 0 }}>
              <StatusSkeleton />
            </motion.div>
          ) : data ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Status hero */}
              <Card>
                <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-5">
                  <StatusOrb status={data.status} />

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-center gap-2">
                      <h2 className="text-lg font-bold">{cfg!.label}</h2>
                      <Badge variant={cfg!.badgeVariant}>{cfg!.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      {cfg!.description}
                    </p>
                  </div>

                  {/* CTA buttons */}
                  <AnimatePresence>
                    {data.status === "completed" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <p className="text-xs text-muted-foreground">
                          Redirecting to results…
                        </p>
                        <Link href={`/results/${processingId}`}>
                          <Button className="gap-2">
                            View Full Results
                            <ArrowRight className="size-4" />
                          </Button>
                        </Link>
                      </motion.div>
                    )}
                    {data.status === "failed" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex gap-2"
                      >
                        <Link href="/upload">
                          <Button variant="outline" className="gap-2">
                            <Upload className="size-4" />
                            Try Again
                          </Button>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Pipeline steps */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Pipeline Steps</h3>
                <PipelineTracker
                  status={data.status}
                  analysis={
                    data.analysis as unknown as Record<string, unknown> | null
                  }
                />
              </div>

              {/* Failure details */}
              <AnimatePresence>
                {data.status === "failed" && data.failure?.reason && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Card className="border-destructive/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm text-destructive">
                          <AlertTriangle className="size-4" />
                          Error Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {data.failure.reason}
                        </p>
                        {data.failure.stack && (
                          <pre className="text-xs text-muted-foreground bg-muted rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap">
                            {data.failure.stack}
                          </pre>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Timing */}
              <TimingCard
                uploadedAt={data.timestamps.uploadedAt}
                processingStartedAt={data.timestamps.processingStartedAt}
                completedAt={data.timestamps.completedAt}
              />

              <Separator />

              {/* Footer actions */}
              <div className="flex flex-wrap gap-3 justify-between items-center">
                <Link href="/upload">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Upload className="size-3.5" />
                    New Upload
                  </Button>
                </Link>
                {data.status === "completed" && (
                  <Link href={`/results/${processingId}`}>
                    <Button size="sm" className="gap-1.5">
                      View Results
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
