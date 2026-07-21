"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AnalysisCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  description?: string;
  badge?: { label: string; variant: "success" | "warning" | "destructive" | "pending" | "info" | "outline" };
  children: React.ReactNode;
  index?: number;
}

export function AnalysisCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  badge,
  children,
  index = 0,
}: AnalysisCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98], delay: index * 0.07 }}
    >
      <Card className="h-full hover:shadow-md transition-shadow duration-200 hover:border-border/80">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                <Icon className={`size-4 ${iconColor}`} />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                {description && (
                  <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
                )}
              </div>
            </div>
            {badge && (
              <Badge variant={badge.variant} className="shrink-0 text-xs">
                {badge.label}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">{children}</CardContent>
      </Card>
    </motion.div>
  );
}
