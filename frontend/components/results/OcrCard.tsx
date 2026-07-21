"use client";

import { useState } from "react";
import { FileText, Copy, CheckCircle2 } from "lucide-react";
import { AnalysisCard } from "./AnalysisCard";
import { ConfidenceBar } from "./ConfidenceBar";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/useClipboard";
import type { OcrAnalysis } from "@/lib/types";

interface OcrCardProps {
  data: OcrAnalysis;
  index?: number;
}

export function OcrCard({ data, index }: OcrCardProps) {
  const { copied, copy } = useClipboard();
  const [expanded, setExpanded] = useState(false);

  const hasText = data.text && data.text.trim().length > 0;
  const PREVIEW_LENGTH = 200;
  const isLong = data.text.length > PREVIEW_LENGTH;
  const displayText = !expanded && isLong
    ? data.text.slice(0, PREVIEW_LENGTH) + "…"
    : data.text;

  const confidenceLabel =
    data.confidence >= 75 ? "High" : data.confidence >= 40 ? "Medium" : "Low";

  const badgeVariant =
    !hasText
      ? ("pending" as const)
      : data.confidence >= 75
      ? ("success" as const)
      : data.confidence >= 40
      ? ("warning" as const)
      : ("destructive" as const);

  return (
    <AnalysisCard
      icon={FileText}
      iconColor="text-sky-500"
      iconBg="bg-sky-500/10"
      title="OCR Extraction"
      description="Tesseract text recognition"
      badge={{
        label: hasText ? `${confidenceLabel} confidence` : "No text",
        variant: badgeVariant,
      }}
      index={index}
    >
      <div className="space-y-4">
        {/* Confidence bar */}
        <ConfidenceBar value={data.confidence} label="OCR confidence" />

        {/* Text output */}
        {hasText ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Extracted text</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1"
                onClick={() => copy(data.text)}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="relative rounded-lg bg-muted/50 border border-border p-3">
              <p className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">
                {displayText}
              </p>
              {isLong && (
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="mt-2 text-xs text-primary hover:underline underline-offset-2 transition-colors"
                >
                  {expanded ? "Show less" : "Show all"}
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.text.trim().split(/\s+/).length} words ·{" "}
              {data.text.length} characters
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <FileText className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No text detected</p>
            <p className="text-xs text-muted-foreground/70">
              This image may not contain readable text, or the quality may be too low for recognition.
            </p>
          </div>
        )}
      </div>
    </AnalysisCard>
  );
}
