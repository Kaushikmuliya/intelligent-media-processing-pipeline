"use client";

import { Layers, Image as ImageIcon } from "lucide-react";
import { AnalysisCard } from "./AnalysisCard";
import type { MetadataAnalysis } from "@/lib/types";

interface MetadataCardProps {
  data: MetadataAnalysis;
  index?: number;
}

function Row({ label, value }: { label: string; value: string | number | boolean | null }) {
  const display =
    value === null || value === undefined
      ? "—"
      : typeof value === "boolean"
      ? value ? "Yes" : "No"
      : String(value);

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium font-mono text-right">{display}</span>
    </div>
  );
}

export function MetadataCard({ data, index }: MetadataCardProps) {
  const megapixels = data.width && data.height
    ? ((data.width * data.height) / 1_000_000).toFixed(1)
    : null;

  const aspectRatio = data.width && data.height
    ? (() => {
        const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
        const d = gcd(data.width, data.height);
        return `${data.width / d}:${data.height / d}`;
      })()
    : null;

  return (
    <AnalysisCard
      icon={Layers}
      iconColor="text-pink-500"
      iconBg="bg-pink-500/10"
      title="Metadata Extraction"
      description="Image format and technical properties"
      badge={{ label: data.format?.toUpperCase() ?? "Unknown", variant: "info" }}
      index={index}
    >
      <div className="space-y-4">
        {/* Dimension visual */}
        {data.width && data.height && (
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
            <ImageIcon className="size-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-bold font-mono">
                {data.width} × {data.height}
              </p>
              <p className="text-xs text-muted-foreground">
                {megapixels} MP · {aspectRatio}
              </p>
            </div>
          </div>
        )}

        {/* Metadata rows */}
        <div>
          <Row label="Format" value={data.format?.toUpperCase() ?? null} />
          <Row label="Width" value={data.width ? `${data.width}px` : null} />
          <Row label="Height" value={data.height ? `${data.height}px` : null} />
          <Row label="Channels" value={data.channels} />
          <Row label="Color space" value={data.colorSpace} />
          <Row label="Density (DPI)" value={data.density} />
          <Row label="Has alpha" value={data.hasAlpha} />
          <Row label="Orientation" value={data.orientation} />
        </div>
      </div>
    </AnalysisCard>
  );
}
