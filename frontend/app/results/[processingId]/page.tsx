"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Copy,
  CheckCircle2,
  Upload,
  ArrowLeft,
  Code2,
  LayoutGrid,
  AlertTriangle,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { BlurCard } from "@/components/results/BlurCard";
import { BrightnessCard } from "@/components/results/BrightnessCard";
import { OcrCard } from "@/components/results/OcrCard";
import { PlateCard } from "@/components/results/PlateCard";
import { MetadataCard } from "@/components/results/MetadataCard";
import { JsonViewer } from "@/components/results/JsonViewer";
import { useMediaStatus } from "@/hooks/useMediaStatus";
import { useClipboard } from "@/hooks/useClipboard";
import { downloadJson, formatDate, formatDuration } from "@/lib/utils";

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Not-completed state ────────────────────────────────────────────────────────

function NotCompleted({ processingId, status }: { processingId: string; status: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/10">
          <Clock className="size-7 text-amber-500" />
        </div>
        <div>
          <p className="font-semibold">Results not available yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            This job has status{" "}
            <Badge variant="warning" className="mx-1">
              {status}
            </Badge>
            . Come back once processing completes.
          </p>
        </div>
        <Link href={`/status/${processingId}`}>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="size-4" />
            Check Status
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ─── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({
  processingId,
  timestamps,
}: {
  processingId: string;
  timestamps: { uploadedAt: string; processingStartedAt: string | null; completedAt: string | null };
}) {
  const duration = formatDuration(timestamps.processingStartedAt, timestamps.completedAt);
  const completedAt = formatDate(timestamps.completedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3"
    >
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="size-4 text-emerald-500" />
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Analysis complete
        </span>
      </div>
      <span className="text-xs text-muted-foreground font-mono">{processingId}</span>
      <span className="text-xs text-muted-foreground">
        Completed {completedAt}
      </span>
      {duration !== "—" && (
        <span className="text-xs text-muted-foreground">
          Processed in {duration}
        </span>
      )}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultsPage({
  params,
}: {
  params: Promise<{ processingId: string }>;
}) {
  const { processingId } = use(params);
  const { data, error, refetch } = useMediaStatus(processingId);
  const { copied, copy } = useClipboard();
  const [activeTab, setActiveTab] = useState<"cards" | "json">("cards");

  const isCompleted = data?.status === "completed";
  const analysis = data?.analysis;

  const handleCopyJson = () => {
    if (analysis) copy(JSON.stringify(analysis, null, 2));
  };

  const handleDownload = () => {
    if (!data) return;
    downloadJson(
      {
        processingId,
        status: data.status,
        timestamps: data.timestamps,
        analysis: data.analysis,
      },
      `mediapipeline-${processingId}.json`
    );
  };

  return (
    <div className="min-h-screen">
      <div className="container max-w-screen-xl mx-auto px-4 py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="size-8 shrink-0">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Analysis Results</h1>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {processingId}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {isCompleted && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleCopyJson}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copy JSON
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleDownload}
                >
                  <Download className="size-3.5" />
                  Download
                </Button>
              </>
            )}
            <Link href="/upload">
              <Button size="sm" className="gap-1.5">
                <Upload className="size-3.5" />
                New Upload
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-4"
            >
              <AlertTriangle className="size-4 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Failed to load results</p>
                <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={refetch}
              >
                Retry
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <AnimatePresence mode="wait">
          {!data && !error ? (
            <motion.div key="skeleton" exit={{ opacity: 0 }}>
              <ResultsSkeleton />
            </motion.div>
          ) : data ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Summary strip */}
              {isCompleted && (
                <SummaryStrip
                  processingId={processingId}
                  timestamps={data.timestamps}
                />
              )}

              {/* Not completed */}
              {!isCompleted && (
                <NotCompleted processingId={processingId} status={data.status} />
              )}

              {/* Analysis */}
              {isCompleted && analysis && (
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as "cards" | "json")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <TabsList className="h-8">
                      <TabsTrigger value="cards" className="gap-1.5 text-xs px-3">
                        <LayoutGrid className="size-3.5" />
                        Cards
                      </TabsTrigger>
                      <TabsTrigger value="json" className="gap-1.5 text-xs px-3">
                        <Code2 className="size-3.5" />
                        Raw JSON
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* ── Cards view ── */}
                  <TabsContent value="cards">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.blur && (
                        <BlurCard data={analysis.blur} index={0} />
                      )}
                      {analysis.brightness && (
                        <BrightnessCard data={analysis.brightness} index={1} />
                      )}
                      {analysis.ocr && (
                        <OcrCard data={analysis.ocr} index={2} />
                      )}
                      {analysis.plateValidation && (
                        <PlateCard data={analysis.plateValidation} index={3} />
                      )}
                      {analysis.metadata && (
                        <MetadataCard data={analysis.metadata} index={4} />
                      )}
                    </div>
                  </TabsContent>

                  {/* ── JSON view ── */}
                  <TabsContent value="json">
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Toolbar */}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Full analysis payload
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs h-7"
                            onClick={handleCopyJson}
                          >
                            {copied ? (
                              <CheckCircle2 className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                            {copied ? "Copied" : "Copy"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs h-7"
                            onClick={handleDownload}
                          >
                            <Download className="size-3" />
                            Download
                          </Button>
                        </div>
                      </div>

                      {/* Per-section JSON panels */}
                      <div className="space-y-3">
                        {[
                          { key: "blur", label: "Blur" },
                          { key: "brightness", label: "Brightness" },
                          { key: "ocr", label: "OCR" },
                          { key: "plateValidation", label: "Plate Validation" },
                          { key: "metadata", label: "Metadata" },
                        ].map(({ key, label }, i) => {
                          const value = analysis[key as keyof typeof analysis];
                          if (!value) return null;
                          return (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                            >
                              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                                {label}
                              </p>
                              <JsonViewer data={value} />
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </TabsContent>
                </Tabs>
              )}

              <Separator />

              {/* Footer */}
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <Link href={`/status/${processingId}`}>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                    <RefreshCw className="size-3.5" />
                    View Status
                  </Button>
                </Link>
                <Link href="/upload">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Upload className="size-3.5" />
                    Analyze Another
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
