"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ConfidenceBarProps {
  value: number; // 0–100
  label?: string;
  colorClass?: string;
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceBar({
  value,
  label,
  colorClass = "bg-primary",
  showLabel = true,
  className,
}: ConfidenceBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  const autoColor =
    !colorClass || colorClass === "bg-primary"
      ? clamped >= 75
        ? "bg-emerald-500"
        : clamped >= 40
        ? "bg-amber-500"
        : "bg-red-500"
      : colorClass;

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showLabel) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          {showLabel && (
            <span className="text-xs font-medium tabular-nums ml-auto">
              {clamped.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${autoColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        />
      </div>
    </div>
  );
}
