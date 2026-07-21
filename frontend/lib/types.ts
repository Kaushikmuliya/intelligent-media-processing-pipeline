// ─── Media Status ──────────────────────────────────────────────────────────────

export type MediaStatus = "pending" | "processing" | "completed" | "failed";

// ─── Analysis Results ──────────────────────────────────────────────────────────

export interface BlurAnalysis {
  score: number;
  isBlurry: boolean;
}

export interface BrightnessAnalysis {
  average: number;
  quality: "good" | "too_dark" | "too_bright";
}

export interface OcrAnalysis {
  text: string;
  confidence: number;
}

export interface PlateValidation {
  detectedPlate: string | null;
  isValid: boolean;
}

export interface MetadataAnalysis {
  format: string;
  width: number;
  height: number;
  channels: number;
  density: number | null;
  hasAlpha: boolean;
  colorSpace: string;
  orientation: number | null;
}

export interface AnalysisResult {
  blur: BlurAnalysis | null;
  brightness: BrightnessAnalysis | null;
  ocr: OcrAnalysis | null;
  plateValidation: PlateValidation | null;
  metadata: MetadataAnalysis | null;
}

// ─── Timestamps ────────────────────────────────────────────────────────────────

export interface MediaTimestamps {
  uploadedAt: string;
  processingStartedAt: string | null;
  completedAt: string | null;
}

// ─── Media Record ──────────────────────────────────────────────────────────────

export interface MediaRecord {
  processingId: string;
  status: MediaStatus;
  analysis: AnalysisResult;
  failure?: {
    reason?: string;
    stack?: string;
  };
  timestamps: MediaTimestamps;
}

// ─── API Responses ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface UploadResponse {
  processingId: string;
  status: MediaStatus;
}

// ─── UI Helpers ────────────────────────────────────────────────────────────────

export interface UploadedFile {
  file: File;
  preview: string;
}
