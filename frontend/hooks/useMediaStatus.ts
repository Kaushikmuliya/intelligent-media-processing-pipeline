"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMediaStatus } from "@/lib/api";
import type { MediaRecord } from "@/lib/types";

const POLL_INTERVAL = 2500; // ms

interface UseMediaStatusReturn {
  data: MediaRecord | null;
  error: string | null;
  isPolling: boolean;
  refetch: () => void;
}

export function useMediaStatus(
  processingId: string | null
): UseMediaStatusReturn {
  const [data, setData] = useState<MediaRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (!processingId) return;
    try {
      const result = await getMediaStatus(processingId);
      if (!mountedRef.current) return;
      setData(result);
      setError(null);
      // Stop polling when terminal state reached
      if (result.status === "completed" || result.status === "failed") {
        setIsPolling(false);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsPolling(false);
    }
  }, [processingId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!processingId) return;

    setIsPolling(true);
    setData(null);
    setError(null);

    // Immediate first fetch
    fetch();

    const schedule = () => {
      timerRef.current = setTimeout(async () => {
        if (!mountedRef.current) return;
        const current = await getMediaStatus(processingId).catch(() => null);
        if (!mountedRef.current) return;
        if (current) {
          setData(current);
          setError(null);
        }
        if (
          current &&
          (current.status === "completed" || current.status === "failed")
        ) {
          setIsPolling(false);
          return;
        }
        // continue polling
        if (mountedRef.current) schedule();
      }, POLL_INTERVAL);
    };

    schedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [processingId, fetch]);

  return { data, error, isPolling, refetch: fetch };
}
