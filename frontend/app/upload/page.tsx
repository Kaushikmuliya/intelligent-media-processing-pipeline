"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  ImageIcon,
  X,
  AlertCircle,
  CheckCircle2,
  FileImage,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useUpload } from "@/hooks/useUpload";
import { formatBytes } from "@/lib/utils";
import type { UploadedFile } from "@/lib/types";

// ─── Constants ─────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── Validation ────────────────────────────────────────────────────────────────

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `Unsupported type "${file.type}". Please upload a JPEG, PNG, WebP, GIF, or BMP.`;
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `File too large (${formatBytes(file.size)}). Maximum size is 10 MB.`;
  }
  return null;
}

// ─── Drop Zone ─────────────────────────────────────────────────────────────────

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

function DropZone({ onFile, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      setDragError(null);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (!file) return;

      const err = validateFile(file);
      if (err) {
        setDragError(err);
        return;
      }
      onFile(file);
    },
    [disabled, onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDragError(null);
    const err = validateFile(file);
    if (err) {
      setDragError(err);
      return;
    }
    onFile(file);
    // reset so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="w-full">
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        animate={{
          borderColor: isDragging ? "hsl(var(--primary))" : "hsl(var(--border))",
          backgroundColor: isDragging
            ? "hsl(var(--primary) / 0.04)"
            : "transparent",
          scale: isDragging ? 1.005 : 1,
        }}
        transition={{ duration: 0.15 }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload image — click or drag and drop"
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled)
            inputRef.current?.click();
        }}
        className="relative flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-border bg-muted/20 p-14 text-center cursor-pointer select-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {/* Animated icon */}
        <motion.div
          animate={isDragging ? { scale: 1.15, rotate: -6 } : { scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        >
          <Upload className="size-7" />
        </motion.div>

        <div className="space-y-1.5">
          <p className="text-base font-semibold">
            {isDragging ? "Drop your image here" : "Drag & drop an image"}
          </p>
          <p className="text-sm text-muted-foreground">
            or{" "}
            <span className="text-primary font-medium underline-offset-2 hover:underline">
              browse files
            </span>
          </p>
          <p className="text-xs text-muted-foreground pt-1">
            JPEG, PNG, WebP, GIF, BMP · up to 10 MB
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          onChange={handleChange}
          disabled={disabled}
          aria-hidden
        />
      </motion.div>

      <AnimatePresence>
        {dragError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            {dragError}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── File Preview Card ─────────────────────────────────────────────────────────

interface FilePreviewProps {
  uploaded: UploadedFile;
  onRemove: () => void;
  uploadState: ReturnType<typeof useUpload>["state"];
}

function FilePreview({ uploaded, onRemove, uploadState }: FilePreviewProps) {
  const { file, preview } = uploaded;
  const uploading = uploadState.status === "uploading";
  const progress = uploadState.status === "uploading" ? uploadState.progress : 0;
  const success = uploadState.status === "success";
  const error = uploadState.status === "error";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
    >
      {/* Image preview */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted/60">
        <Image
          src={preview}
          alt={file.name}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 600px"
        />

        {/* Status overlay */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-emerald-500/10 backdrop-blur-[1px]"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex size-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg"
              >
                <CheckCircle2 className="size-7 text-white" />
              </motion.div>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-destructive/10 backdrop-blur-[1px]"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex size-14 items-center justify-center rounded-full bg-destructive shadow-lg"
              >
                <AlertCircle className="size-7 text-white" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Remove button */}
        {!uploading && !success && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-background/80 text-foreground hover:bg-background backdrop-blur-sm transition-colors shadow-sm"
            aria-label="Remove image"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* File info */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileImage className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.size)} · {file.type.split("/")[1].toUpperCase()}
              </p>
            </div>
          </div>
          {success && <Badge variant="success">Uploaded</Badge>}
          {error && <Badge variant="destructive">Failed</Badge>}
          {uploading && (
            <Badge variant="warning" className="shrink-0">
              Uploading…
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        <AnimatePresence>
          {(uploading || success) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1.5"
            >
              <Progress value={success ? 100 : progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground text-right tabular-nums">
                {success ? "100%" : `${progress}%`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {error && uploadState.status === "error" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-destructive"
            >
              {uploadState.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const router = useRouter();
  const { state, upload, reset } = useUpload();
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const handleFile = useCallback((file: File) => {
    const preview = URL.createObjectURL(file);
    setUploadedFile({ file, preview });
    reset();
  }, [reset]);

  const handleRemove = useCallback(() => {
    if (uploadedFile) URL.revokeObjectURL(uploadedFile.preview);
    setUploadedFile(null);
    reset();
  }, [uploadedFile, reset]);

  const handleUpload = useCallback(async () => {
    if (!uploadedFile) return;
    try {
      await upload(uploadedFile.file);
    } catch {
      // error already captured in state
    }
  }, [upload, uploadedFile]);

  // Auto-redirect after successful upload
  useEffect(() => {
    if (state.status === "success") {
      const { processingId } = state.result;
      const timer = setTimeout(() => {
        router.push(`/status/${processingId}`);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (uploadedFile) URL.revokeObjectURL(uploadedFile.preview);
    };
  }, [uploadedFile]);

  const isUploading = state.status === "uploading";
  const isSuccess = state.status === "success";
  const canUpload = !!uploadedFile && !isUploading && !isSuccess;

  return (
    <div className="min-h-screen">
      <div className="container max-w-screen-md mx-auto px-4 py-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
            <ImageIcon className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Upload an Image</h1>
          <p className="mt-2 text-muted-foreground text-sm max-w-md mx-auto">
            Drop any image and the pipeline will run blur detection, OCR, plate
            recognition, brightness analysis, and metadata extraction in parallel.
          </p>
        </motion.div>

        {/* Upload area */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-5"
        >
          <AnimatePresence mode="wait">
            {!uploadedFile ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DropZone onFile={handleFile} disabled={isUploading} />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <FilePreview
                  uploaded={uploadedFile}
                  onRemove={handleRemove}
                  uploadState={state}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <AnimatePresence>
            {uploadedFile && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                {isSuccess ? (
                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className="flex items-center gap-2 text-sm text-emerald-500 font-medium">
                      <CheckCircle2 className="size-4" />
                      Upload successful — redirecting to status page…
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/status/${(state as { result: { processingId: string } }).result.processingId}`
                        )
                      }
                      className="gap-1.5"
                    >
                      Go now
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={handleUpload}
                      disabled={!canUpload}
                      className="flex-1 gap-2 h-11"
                    >
                      {isUploading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                          />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <Upload className="size-4" />
                          Analyze Image
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRemove}
                      disabled={isUploading}
                      className="sm:w-auto h-11"
                    >
                      <X className="size-4 mr-1.5" />
                      Remove
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Info strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-xl border border-border bg-muted/30 px-6 py-4"
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0 text-primary" />
            Images are processed securely and stored server-side.
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {["JPEG", "PNG", "WebP", "GIF", "BMP"].map((fmt) => (
              <span
                key={fmt}
                className="rounded-md border border-border bg-background px-2 py-0.5 text-xs font-mono text-muted-foreground"
              >
                {fmt}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
