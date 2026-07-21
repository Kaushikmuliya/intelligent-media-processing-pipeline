"use client";

import { Eye, EyeOff } from "lucide-react";
import { AnalysisCard } from "./AnalysisCard";
import { ConfidenceBar } from "./ConfidenceBar";
import type { BlurAnalysis } from "@/lib/types";

interface BlurCardProps {
  data: BlurAnalysis;
  index?: number;
}

export function BlurCard({ data, index }: BlurCardProps) {
  // Score: 0–100+ where lower = more blurry. Normalize to 0–100 for display.
  // Typical sharp images score 30+; blurry < 20
  const normalizedScore = Math.min(100, (data.score / 60) * 100);

  return (
    <AnalysisCard
      icon={data.isBlurry ? EyeOff : Eye}
      iconColor={data.isBlurry ? "text-red-500" : "text-violet-500"}
      iconBg={data.isBlurry ? "bg-red-500/10" : "bg-violet-500/10"}
      title="Blur Detection"
      description="Laplacian variance sharpness scoring"
      badge={{
        label: data.isBlurry ? "Blurry" : "Sharp",
        variant: data.isBlurry ? "destructive" : "success",
      }}
      index={index}
    >
      <div className="space-y-4">
        {/* Score highlight */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Blur score</p>
            <p className="text-2xl font-bold font-mono mt-0.5">
              {data.score.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Threshold</p>
            <p className="text-sm font-mono mt-0.5 text-muted-foreground">{"< 20 = blurry"}</p>
          </div>
        </div>

        {/* Sharpness bar */}
        <ConfidenceBar
          value={normalizedScore}
          label="Sharpness"
          colorClass={data.isBlurry ? "bg-red-500" : "bg-violet-500"}
        />

        <p className="text-xs text-muted-foreground leading-relaxed">
          {data.isBlurry
            ? "This image appears blurry or out-of-focus. Consider re-uploading a sharper version for better OCR and plate detection results."
            : "Image sharpness is acceptable. The analyzer detected enough edge variance to classify this as a clear image."}
        </p>
      </div>
    </AnalysisCard>
  );
}
