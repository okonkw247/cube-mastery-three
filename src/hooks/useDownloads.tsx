import { useState, useEffect, useCallback, useRef } from "react";
import localforage from "localforage";
import CryptoJS from "crypto-js";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";
import { useDeviceFingerprint } from "./useDeviceFingerprint";
import { supabase } from "@/integrations/supabase/client";

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

// One-time payment: download ALL courses you have access to
const PLAN_DOWNLOAD_LIMITS: Record<string, number> = {
  free: 0,
  starter: 15,
  pro: 50,
  enterprise: Infinity,
};

const MAX_DEVICES = 2;
const VERIFICATION_KEY = "download_last_verified";
const VERIFICATION_INTERVAL_DAYS = 30;

function getEncryptionKey(userId: string): string {
  return CryptoJS.SHA256(`cube-mastery-${userId}-download-key`).toString();
}

export function useDownloads() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { fingerprint, deviceName } = useDeviceFingerprint();
  const [downloads, setDownloads] = useState<DownloadedVideo[]>([]);
  const [downloading, setDownloading] = useState<Record<string, number>>({});
  const [totalStorageUsed, setTotalStorageUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [verificationExpired, setVerificationExpired] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [deviceLimitReached, setDeviceLimitReached] = useState(false);
  const abortControllers = useRef<Record<string, AbortController>>({});

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
    if (navigator.onLine && user) {
      localStorage.setItem(`${VERIFICATION_KEY}_${user.id}`, Date.now().toString());
      setVerificationExpired(false);
    }
  }, [user, isOffline]);

  // Load devices & register current device
  useEffect(() => {
    if (!user || !fingerprint) return;
    const registerDevice = async () => {
      try {
        // Upsert current device
        await supabase.from("user_devices" as any).upsert(
          { user_id: user.id, device_fingerprint: fingerprint, device_name: deviceName, last_used_at: new Date().toISOString() },
          { onConflict: "user_id,device_fingerprint" }
        );
        // Fetch all devices
        const { data } = await supabase.from("user_devices" as any).select("*").eq("user_id", user.id).order("last_used_at", { ascending: false });
        const deviceList = (data as any[]) || [];
        setDevices(deviceList);
        setDeviceLimitReached(deviceList.length > MAX_DEVICES);
      } catch (err) {
        console.error("Device registration failed:", err);
      }
    };
    registerDevice();
  }, [user, fingerprint, deviceName]);

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

  useEffect(() => { loadDownloads(); }, [loadDownloads]);

  const isDownloaded = useCallback(
    (lessonId: string) => downloads.some((d) => d.lessonId === lessonId),
    [downloads]
  );

  const canDownload = maxDownloads > 0 && downloads.length < maxDownloads && !deviceLimitReached;
  const canPlayOffline = subscriptionActive && !verificationExpired;

  const downloadVideo = useCallback(
    async (lessonId: string, videoUrl: string, title: string, thumbnailUrl?: string, quality = "auto") => {
      if (!user) return;
      if (isDownloaded(lessonId)) return;
      if (!canDownload) return;

      const controller = new AbortController();
      abortControllers.current[lessonId] = controller;

      try {
        setDownloading((prev) => ({ ...prev, [lessonId]: 0 }));

        const response = await fetch(videoUrl, { signal: controller.signal });
        if (!response.ok) throw new Error("Failed to fetch video");

        const contentLength = Number(response.headers.get("content-length")) || 0;
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No readable stream");

        const chunks: Uint8Array[] = [];
        let receivedLength = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          receivedLength += value.length;
          const percent = contentLength > 0 ? Math.round((receivedLength / contentLength) * 100) : -1;
          setDownloading((prev) => ({ ...prev, [lessonId]: percent }));
        }

        // Combine chunks
        const fullArray = new Uint8Array(receivedLength);
        let offset = 0;
        for (const chunk of chunks) {
          fullArray.set(chunk, offset);
          offset += chunk.length;
        }

        // Encrypt the video data
        const key = getEncryptionKey(user.id);
        const wordArray = CryptoJS.lib.WordArray.create(fullArray as any);
        const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();

        // Store encrypted blob
        await downloadStore.setItem(`video_${user.id}_${lessonId}`, encrypted);

        const entry: DownloadedVideo = {
          lessonId,
          title,
          quality,
          sizeBytes: encrypted.length,
          downloadedAt: new Date().toISOString(),
          thumbnailUrl,
        };

        const currentList = (await metaStore.getItem<DownloadedVideo[]>(`downloads_${user.id}`)) || [];
        const updatedList = [...currentList.filter((d) => d.lessonId !== lessonId), entry];
        await metaStore.setItem(`downloads_${user.id}`, updatedList);

        setDownloads(updatedList);
        setTotalStorageUsed((prev) => prev + encrypted.length);

        localStorage.setItem(`${VERIFICATION_KEY}_${user.id}`, Date.now().toString());
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log("Download cancelled:", lessonId);
          return;
        }
        console.error("Download failed:", err);
        throw err;
      } finally {
        delete abortControllers.current[lessonId];
        setDownloading((prev) => {
          const next = { ...prev };
          delete next[lessonId];
          return next;
        });
      }
    },
    [user, isDownloaded, canDownload]
  );

  const cancelDownload = useCallback((lessonId: string) => {
    const controller = abortControllers.current[lessonId];
    if (controller) {
      controller.abort();
      delete abortControllers.current[lessonId];
      setDownloading((prev) => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      });
    }
  }, []);

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
      if (!canPlayOffline) return null;
      try {
        const encrypted = await downloadStore.getItem<string>(`video_${user.id}_${lessonId}`);
        if (!encrypted) return null;

        const key = getEncryptionKey(user.id);
        const decrypted = CryptoJS.AES.decrypt(encrypted, key);
        const typedArray = convertWordArrayToUint8Array(decrypted);
        const blob = new Blob([typedArray.buffer as ArrayBuffer], { type: "video/mp4" });
        return URL.createObjectURL(blob);
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

  const removeDevice = useCallback(async (deviceId: string) => {
    if (!user) return;
    await supabase.from("user_devices" as any).delete().eq("id", deviceId).eq("user_id", user.id);
    setDevices((prev) => prev.filter((d: any) => d.id !== deviceId));
  }, [user]);

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
    cancelDownload,
    removeDownload,
    getVideoBlob,
    clearAllDownloads,
    formatBytes,
    remainingDownloads: Math.max(0, maxDownloads - downloads.length),
    devices,
    deviceLimitReached,
    removeDevice,
    maxDevices: MAX_DEVICES,
  };
}

function convertWordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  const u8 = new Uint8Array(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return u8;
}
