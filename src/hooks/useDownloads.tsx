import { useState, useEffect, useCallback } from "react";
import localforage from "localforage";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";

// Configure localforage
const downloadStore = localforage.createInstance({
  name: "cube-mastery-downloads",
  storeName: "videos",
});

const metaStore = localforage.createInstance({
  name: "cube-mastery-downloads",
  storeName: "metadata",
});

export interface DownloadedVideo {
  lessonId: string;
  title: string;
  quality: string;
  sizeBytes: number;
  downloadedAt: string;
  thumbnailUrl?: string;
}

const PLAN_DOWNLOAD_LIMITS: Record<string, number> = {
  free: 0,
  starter: 5,
  pro: 20,
  enterprise: Infinity,
};

const VERIFICATION_KEY = "download_last_verified";
const VERIFICATION_INTERVAL_DAYS = 30;

export function useDownloads() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [downloads, setDownloads] = useState<DownloadedVideo[]>([]);
  const [downloading, setDownloading] = useState<Record<string, number>>({});
  const [totalStorageUsed, setTotalStorageUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [verificationExpired, setVerificationExpired] = useState(false);

  const tier = profile?.subscription_tier || "free";
  const subscriptionActive = profile?.subscription_status === "active";
  const maxDownloads = PLAN_DOWNLOAD_LIMITS[tier] || 0;

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 30-day verification check
  useEffect(() => {
    if (!user) return;
    const lastVerified = localStorage.getItem(`${VERIFICATION_KEY}_${user.id}`);
    if (lastVerified) {
      const daysSince = (Date.now() - parseInt(lastVerified)) / (1000 * 60 * 60 * 24);
      if (daysSince > VERIFICATION_INTERVAL_DAYS) {
        setVerificationExpired(true);
      }
    }
    // Mark as verified when online
    if (navigator.onLine && user) {
      localStorage.setItem(`${VERIFICATION_KEY}_${user.id}`, Date.now().toString());
      setVerificationExpired(false);
    }
  }, [user, isOffline]);

  // Load downloaded videos metadata
  const loadDownloads = useCallback(async () => {
    if (!user) return;
    try {
      const meta = await metaStore.getItem<DownloadedVideo[]>(`downloads_${user.id}`);
      const list = meta || [];
      setDownloads(list);
      let total = 0;
      for (const d of list) total += d.sizeBytes;
      setTotalStorageUsed(total);
    } catch (err) {
      console.error("Failed to load downloads:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  // Auto-clear downloads if subscription expired
  useEffect(() => {
    if (user && profile && !subscriptionActive && tier !== "free" && downloads.length > 0) {
      // Subscription expired - block playback (don't auto-delete, just block)
      console.log("Subscription inactive - downloads blocked");
    }
  }, [user, profile, subscriptionActive, tier, downloads]);

  const isDownloaded = useCallback(
    (lessonId: string) => downloads.some((d) => d.lessonId === lessonId),
    [downloads]
  );

  const canDownload = maxDownloads > 0 && downloads.length < maxDownloads;
  const canPlayOffline = subscriptionActive && !verificationExpired;

  const downloadVideo = useCallback(
    async (lessonId: string, videoUrl: string, title: string, thumbnailUrl?: string, quality = "auto") => {
      if (!user) return;
      if (isDownloaded(lessonId)) return;
      if (!canDownload) return;

      try {
        setDownloading((prev) => ({ ...prev, [lessonId]: 0 }));

        const response = await fetch(videoUrl);
        if (!response.ok) throw new Error("Failed to fetch video");

        const contentLength = Number(response.headers.get("content-length")) || 0;
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No readable stream");

        const chunks: ArrayBuffer[] = [];
        let receivedLength = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value.buffer as ArrayBuffer);
          receivedLength += value.length;
          const percent = contentLength > 0 ? Math.round((receivedLength / contentLength) * 100) : -1;
          setDownloading((prev) => ({ ...prev, [lessonId]: percent }));
        }

        const blob = new Blob(chunks, { type: "video/mp4" });

        // Store video blob
        await downloadStore.setItem(`video_${user.id}_${lessonId}`, blob);

        // Update metadata
        const entry: DownloadedVideo = {
          lessonId,
          title,
          quality,
          sizeBytes: blob.size,
          downloadedAt: new Date().toISOString(),
          thumbnailUrl,
        };

        const currentList = (await metaStore.getItem<DownloadedVideo[]>(`downloads_${user.id}`)) || [];
        const updatedList = [...currentList.filter((d) => d.lessonId !== lessonId), entry];
        await metaStore.setItem(`downloads_${user.id}`, updatedList);

        setDownloads(updatedList);
        setTotalStorageUsed((prev) => prev + blob.size);

        // Update last verified timestamp
        localStorage.setItem(`${VERIFICATION_KEY}_${user.id}`, Date.now().toString());
      } catch (err) {
        console.error("Download failed:", err);
        throw err;
      } finally {
        setDownloading((prev) => {
          const next = { ...prev };
          delete next[lessonId];
          return next;
        });
      }
    },
    [user, isDownloaded, canDownload]
  );

  const removeDownload = useCallback(
    async (lessonId: string) => {
      if (!user) return;
      try {
        await downloadStore.removeItem(`video_${user.id}_${lessonId}`);
        const currentList = (await metaStore.getItem<DownloadedVideo[]>(`downloads_${user.id}`)) || [];
        const removed = currentList.find((d) => d.lessonId === lessonId);
        const updatedList = currentList.filter((d) => d.lessonId !== lessonId);
        await metaStore.setItem(`downloads_${user.id}`, updatedList);
        setDownloads(updatedList);
        if (removed) {
          setTotalStorageUsed((prev) => Math.max(0, prev - removed.sizeBytes));
        }
      } catch (err) {
        console.error("Failed to remove download:", err);
      }
    },
    [user]
  );

  const getVideoBlob = useCallback(
    async (lessonId: string): Promise<string | null> => {
      if (!user) return null;
      // Block playback if subscription expired or verification expired
      if (!canPlayOffline) return null;
      try {
        const blob = await downloadStore.getItem<Blob>(`video_${user.id}_${lessonId}`);
        if (blob) return URL.createObjectURL(blob);
        return null;
      } catch {
        return null;
      }
    },
    [user, canPlayOffline]
  );

  const clearAllDownloads = useCallback(async () => {
    if (!user) return;
    for (const d of downloads) {
      await downloadStore.removeItem(`video_${user.id}_${d.lessonId}`);
    }
    await metaStore.setItem(`downloads_${user.id}`, []);
    setDownloads([]);
    setTotalStorageUsed(0);
  }, [user, downloads]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return {
    downloads,
    downloading,
    totalStorageUsed,
    loading,
    maxDownloads,
    canDownload,
    canPlayOffline,
    isDownloaded,
    isOffline,
    verificationExpired,
    downloadVideo,
    removeDownload,
    getVideoBlob,
    clearAllDownloads,
    formatBytes,
    remainingDownloads: Math.max(0, maxDownloads - downloads.length),
  };
}
