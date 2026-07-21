"use client";

import { Sun, Moon, Sunrise } from "lucide-react";
import { AnalysisCard } from "./AnalysisCard";
import { ConfidenceBar } from "./ConfidenceBar";
import type { BrightnessAnalysis } from "@/lib/types";

interface BrightnessCardProps {
  data: BrightnessAnalysis;
  index?: number;
}

const QUALITY_CONFIG = {
  good: {
    label: "Good",
    badgeVariant: "success" as const,
    icon: Sun,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    barColor: "bg-amber-500",
    desc: "Brightness is within the ideal range (70–200). This image should produce reliable analysis results.",
  },
  too_dark: {
    label: "Too Dark",
    badgeVariant: "destructive" as const,
    icon: Moon,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-400/10",
    barColor: "bg-blue-400",
    desc: "The average pixel luminance is below 70. Dark images may reduce OCR accuracy and blur detection reliability.",
  },
  too_bright: {
    label: "Too Bright",
    badgeVariant: "warning" as const,
    icon: Sunrise,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/10",
    barColor: "bg-orange-500",
    desc: "The average pixel luminance exceeds 200. Overexposed areas can wash out text and details.",
  },
};

export function BrightnessCard({ data, index }: BrightnessCardProps) {
  const cfg = QUALITY_CONFIG[data.quality];
  // 0–255 luminance scale
  const pct = (data.average / 255) * 100;

  return (
    <AnalysisCard
      icon={cfg.icon}
      iconColor={cfg.iconColor}
      iconBg={cfg.iconBg}
      title="Brightness Analysis"
      description="Average pixel luminance (0–255 scale)"
      badge={{ label: cfg.label, variant: cfg.badgeVariant }}
      index={index}
    >
      <div className="space-y-4">
        {/* Value + scale */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">Average luminance</p>
            <p className="text-2xl font-bold font-mono mt-0.5">{data.average}</p>
          </div>
          <div className="text-right space-y-0.5">
            <p className="text-xs font-mono text-emerald-500">70–200 = good</p>
            <p className="text-xs font-mono text-blue-400">{"< 70 = dark"}</p>
            <p className="text-xs font-mono text-orange-500">{"> 200 = bright"}</p>
          </div>
        </div>

        {/* Visual scale */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Luminance</span>
            <span className="text-xs font-medium tabular-nums">{pct.toFixed(1)}%</span>
          </div>
          {/* Gradient scale */}
          <div className="relative h-3 w-full rounded-full overflow-hidden bg-gradient-to-r from-slate-800 via-amber-400 to-white">
            {/* Ideal range markers */}
            <div
              className="absolute top-0 bottom-0 opacity-30 bg-emerald-500"
              style={{ left: `${(70 / 255) * 100}%`, width: `${((200 - 70) / 255) * 100}%` }}
            />
            {/* Current value marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-foreground shadow-sm"
              style={{ left: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span className="text-emerald-500 font-medium">70–200</span>
            <span>255</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{cfg.desc}</p>
      </div>
    </AnalysisCard>
  );
}
