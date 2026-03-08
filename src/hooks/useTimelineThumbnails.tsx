import { useState, useEffect, useRef, useCallback } from 'react';

interface ThumbnailFrame {
  time: number;
  dataUrl: string;
}

/**
 * Extracts frames from a video using Canvas API for timeline preview thumbnails.
 * This runs client-side since FFmpeg is not available in Edge Functions.
 */
export function useTimelineThumbnails(videoUrl: string | null, options?: {
  interval?: number; // seconds between frames (default 5)
  width?: number;    // thumbnail width (default 160)
  height?: number;   // thumbnail height (default 90)
  maxFrames?: number; // max frames to extract (default 60)
}) {
  const { interval = 5, width = 160, height = 90, maxFrames = 60 } = options || {};
  const [frames, setFrames] = useState<ThumbnailFrame[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [spriteUrl, setSpriteUrl] = useState<string | null>(null);
  const [spriteColumns, setSpriteColumns] = useState(10);
  const extractedRef = useRef(false);
  const abortRef = useRef(false);

  const extractFrames = useCallback(async () => {
    if (!videoUrl || extractedRef.current || isExtracting) return;
    
    // Only extract from direct video URLs, not YouTube/Vimeo
    if (videoUrl.includes('youtube') || videoUrl.includes('vimeo') || videoUrl.includes('youtu.be')) {
      return;
    }

    setIsExtracting(true);
    abortRef.current = false;
    extractedRef.current = true;

    try {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'auto';
      video.muted = true;
      video.src = videoUrl;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Failed to load video'));
        setTimeout(() => reject(new Error('Timeout loading video')), 15000);
      });

      const duration = video.duration;
      if (!duration || duration < interval) {
        setIsExtracting(false);
        return;
      }

      const frameCount = Math.min(Math.floor(duration / interval), maxFrames);
      const extractedFrames: ThumbnailFrame[] = [];
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      for (let i = 0; i < frameCount; i++) {
        if (abortRef.current) break;

        const time = i * interval;
        video.currentTime = time;

        await new Promise<void>((resolve) => {
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, width, height);
            extractedFrames.push({
              time,
              dataUrl: canvas.toDataURL('image/webp', 0.5),
            });
            resolve();
          };
          // Timeout per frame
          setTimeout(resolve, 3000);
        });
      }

      video.src = '';
      video.load();

      if (extractedFrames.length > 0) {
        setFrames(extractedFrames);

        // Generate sprite sheet
        const cols = Math.min(10, extractedFrames.length);
        const rows = Math.ceil(extractedFrames.length / cols);
        setSpriteColumns(cols);

        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = width * cols;
        spriteCanvas.height = height * rows;
        const spriteCtx = spriteCanvas.getContext('2d')!;

        for (let i = 0; i < extractedFrames.length; i++) {
          const img = new Image();
          img.src = extractedFrames[i].dataUrl;
          await new Promise<void>((resolve) => {
            img.onload = () => {
              const col = i % cols;
              const row = Math.floor(i / cols);
              spriteCtx.drawImage(img, col * width, row * height, width, height);
              resolve();
            };
            img.onerror = () => resolve();
          });
        }

        setSpriteUrl(spriteCanvas.toDataURL('image/webp', 0.6));
      }
    } catch (err) {
      console.warn('Frame extraction failed:', err);
      extractedRef.current = false;
    } finally {
      setIsExtracting(false);
    }
  }, [videoUrl, interval, width, height, maxFrames]);

  // Start extraction when video URL is available
  useEffect(() => {
    extractedRef.current = false;
    abortRef.current = true;
    setFrames([]);
    setSpriteUrl(null);
  }, [videoUrl]);

  /**
   * Get the thumbnail data URL for a given time in seconds.
   */
  const getThumbnailAtTime = useCallback((timeSeconds: number): ThumbnailFrame | null => {
    if (frames.length === 0) return null;
    
    // Find the closest frame
    let closest = frames[0];
    let minDiff = Math.abs(timeSeconds - closest.time);
    
    for (const frame of frames) {
      const diff = Math.abs(timeSeconds - frame.time);
      if (diff < minDiff) {
        minDiff = diff;
        closest = frame;
      }
    }
    
    return closest;
  }, [frames]);

  /**
   * Get sprite sheet position for a given time.
   */
  const getSpritePosition = useCallback((timeSeconds: number): { x: number; y: number } | null => {
    if (frames.length === 0) return null;
    
    let closestIdx = 0;
    let minDiff = Math.abs(timeSeconds - frames[0].time);
    
    for (let i = 1; i < frames.length; i++) {
      const diff = Math.abs(timeSeconds - frames[i].time);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    
    const col = closestIdx % spriteColumns;
    const row = Math.floor(closestIdx / spriteColumns);
    
    return { x: col * width, y: row * height };
  }, [frames, spriteColumns, width, height]);

  return {
    frames,
    spriteUrl,
    spriteColumns,
    isExtracting,
    extractFrames,
    getThumbnailAtTime,
    getSpritePosition,
    frameWidth: width,
    frameHeight: height,
  };
}
