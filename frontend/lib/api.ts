import type { ApiResponse, MediaRecord, UploadResponse } from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

// ─── Generic Fetcher ──────────────────────────────────────────────────────────

async function fetcher<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(input, init);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || `Request failed: ${res.status}`);
  }

  return json as ApiResponse<T>;
}

// ─── Upload Media ─────────────────────────────────────────────────────────────

export async function uploadMedia(
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("image", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/api/v1/media/upload`);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && json.success) {
          resolve(json.data as UploadResponse);
        } else {
          reject(new Error(json.message || "Upload failed"));
        }
      } catch {
        reject(new Error("Invalid server response"));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.send(formData);
  });
}

// ─── Get Processing Status ────────────────────────────────────────────────────

export async function getMediaStatus(processingId: string): Promise<MediaRecord> {
  const res = await fetcher<MediaRecord>(
    `${BASE_URL}/api/v1/media/${processingId}`
  );

  if (!res.data) {
    throw new Error("No data returned from server");
  }

  return res.data;
}
