import { useCallback } from "react";

/**
 * Detects video duration from a File or URL using HTML5 video element.
 * Returns duration formatted as HH:MM:SS or MM:SS.
 */
export function useVideoDuration() {
  const detectDuration = useCallback((source: File | string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        const totalSeconds = Math.floor(video.duration);
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        const formatted = hrs > 0
          ? `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
          : `${mins}:${secs.toString().padStart(2, "0")}`;

        // Clean up
        if (source instanceof File) {
          URL.revokeObjectURL(video.src);
        }
        resolve(formatted);
      };

      video.onerror = () => {
        if (source instanceof File) {
          URL.revokeObjectURL(video.src);
        }
        reject(new Error("Could not detect video duration"));
      };

      if (source instanceof File) {
        video.src = URL.createObjectURL(source);
      } else {
        video.src = source;
      }
    });
  }, []);

  return { detectDuration };
}
