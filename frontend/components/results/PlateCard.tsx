"use client";

import { Car, Copy, CheckCircle2, ShieldCheck, ShieldX } from "lucide-react";
import { motion } from "framer-motion";
import { AnalysisCard } from "./AnalysisCard";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/useClipboard";
import type { PlateValidation } from "@/lib/types";

interface PlateCardProps {
  data: PlateValidation;
  index?: number;
}

// Indian state prefix lookup
const STATE_CODES: Record<string, string> = {
  AP: "Andhra Pradesh", AR: "Arunachal Pradesh", AS: "Assam",
  BR: "Bihar", CG: "Chhattisgarh", CH: "Chandigarh",
  DD: "Daman & Diu", DL: "Delhi", DN: "Dadra & Nagar Haveli",
  GA: "Goa", GJ: "Gujarat", HP: "Himachal Pradesh",
  HR: "Haryana", JH: "Jharkhand", JK: "Jammu & Kashmir",
  KA: "Karnataka", KL: "Kerala", LA: "Ladakh",
  LD: "Lakshadweep", MH: "Maharashtra", ML: "Meghalaya",
  MN: "Manipur", MP: "Madhya Pradesh", MZ: "Mizoram",
  NL: "Nagaland", OD: "Odisha", PB: "Punjab",
  PY: "Puducherry", RJ: "Rajasthan", SK: "Sikkim",
  TN: "Tamil Nadu", TR: "Tripura", TS: "Telangana",
  UK: "Uttarakhand", UP: "Uttar Pradesh", WB: "West Bengal",
};

function parsePlate(plate: string) {
  const stateCode = plate.slice(0, 2);
  const state = STATE_CODES[stateCode] || null;
  const districtCode = plate.slice(2).match(/^\d{1,2}/)?.[0] || null;
  return { stateCode, state, districtCode };
}

export function PlateCard({ data, index }: PlateCardProps) {
  const { copied, copy } = useClipboard();
  const parsed = data.detectedPlate ? parsePlate(data.detectedPlate) : null;

  return (
    <AnalysisCard
      icon={Car}
      iconColor="text-emerald-500"
      iconBg="bg-emerald-500/10"
      title="Number Plate Recognition"
      description="Indian registration plate validation"
      badge={{
        label: data.isValid ? "Valid plate" : "No plate",
        variant: data.isValid ? "success" : "pending",
      }}
      index={index}
    >
      <div className="space-y-4">
        {data.isValid && data.detectedPlate ? (
          <>
            {/* Plate display */}
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                className="relative"
              >
                {/* Plate visual */}
                <div className="inline-flex items-center gap-3 rounded-lg border-2 border-foreground bg-amber-50 dark:bg-amber-950/40 px-5 py-3 shadow-sm">
                  {/* Blue IND strip */}
                  <div className="flex flex-col items-center justify-center rounded-sm bg-blue-700 px-1.5 py-0.5 text-white">
                    <span className="text-[8px] font-bold leading-none">IND</span>
                    <span className="text-[6px] leading-none mt-0.5">🇮🇳</span>
                  </div>
                  <span className="text-xl font-bold font-mono tracking-[0.15em] text-foreground">
                    {data.detectedPlate}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Copy button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => copy(data.detectedPlate!)}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    Copy plate
                  </>
                )}
              </Button>
            </div>

            {/* Plate metadata */}
            {parsed && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "State code", value: parsed.stateCode },
                  { label: "District", value: parsed.districtCode ?? "—" },
                  { label: "State/UT", value: parsed.state ?? "Unknown" },
                  { label: "Format", value: "Indian RTO" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xs font-medium mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2.5">
              <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Plate matches Indian RTO registration format.
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <ShieldX className="size-6 text-muted-foreground/60" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                No plate detected
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
                No valid Indian registration plate pattern was found in the OCR output.
                This is expected for images without vehicle plates.
              </p>
            </div>
          </div>
        )}
      </div>
    </AnalysisCard>
  );
}
