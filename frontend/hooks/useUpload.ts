"use client";

import { useState, useCallback } from "react";
import { uploadMedia } from "@/lib/api";
import type { UploadResponse } from "@/lib/types";

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "success"; result: UploadResponse }
  | { status: "error"; message: string };

export function useUpload() {
  const [state, setState] = useState<UploadState>({ status: "idle" });

  const upload = useCallback(async (file: File) => {
    setState({ status: "uploading", progress: 0 });

    try {
      const result = await uploadMedia(file, (pct) => {
        setState({ status: "uploading", progress: pct });
      });
      setState({ status: "success", result });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setState({ status: "error", message });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  return { state, upload, reset };
}
