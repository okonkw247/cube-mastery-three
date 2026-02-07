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
  free: 3,
  starter: 10,
  pro: 50,
  enterprise: Infinity,
};

export function useDownloads() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [downloads, setDownloads] = useState<DownloadedVideo[]>([]);
  const [downloading, setDownloading] = useState<Record<string, number>>({});
  const [totalStorageUsed, setTotalStorageUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const tier = profile?.subscription_tier || "free";
  const maxDownloads = PLAN_DOWNLOAD_LIMITS[tier] || 3;

  // Load downloaded videos metadata
  const loadDownloads = useCallback(async () => {
    if (!user) return;
    try {
      const meta = await metaStore.getItem<DownloadedVideo[]>(`downloads_${user.id}`);
      const list = meta || [];
      setDownloads(list);

      let total = 0;
      for (const d of list) {
        total += d.sizeBytes;
      }
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

  const isDownloaded = useCallback(
    (lessonId: string) => downloads.some((d) => d.lessonId === lessonId),
    [downloads]
  );

  const canDownload = downloads.length < maxDownloads;

  const downloadVideo = useCallback(
    async (lessonId: string, videoUrl: string, title: string, thumbnailUrl?: string) => {
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
          quality: "auto",
          sizeBytes: blob.size,
          downloadedAt: new Date().toISOString(),
          thumbnailUrl,
        };

        const currentList = (await metaStore.getItem<DownloadedVideo[]>(`downloads_${user.id}`)) || [];
        const updatedList = [...currentList.filter((d) => d.lessonId !== lessonId), entry];
        await metaStore.setItem(`downloads_${user.id}`, updatedList);

        setDownloads(updatedList);
        setTotalStorageUsed((prev) => prev + blob.size);
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
      try {
        const blob = await downloadStore.getItem<Blob>(`video_${user.id}_${lessonId}`);
        if (blob) {
          return URL.createObjectURL(blob);
        }
        return null;
      } catch {
        return null;
      }
    },
    [user]
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
    isDownloaded,
    downloadVideo,
    removeDownload,
    getVideoBlob,
    clearAllDownloads,
    formatBytes,
    remainingDownloads: maxDownloads - downloads.length,
  };
}
