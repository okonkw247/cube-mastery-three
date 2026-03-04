import { useState } from "react";
import { Download, Check, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDownloads } from "@/hooks/useDownloads";
import { toast } from "sonner";

interface DownloadButtonProps {
  lessonId: string;
  videoUrl: string | null;
  title: string;
  thumbnailUrl?: string;
  compact?: boolean;
}

const QUALITY_OPTIONS = [
  { label: "1080p (HD)", value: "1080p" },
  { label: "720p", value: "720p" },
  { label: "480p", value: "480p" },
  { label: "360p", value: "360p" },
];

export function DownloadButton({ lessonId, videoUrl, title, thumbnailUrl, compact = false }: DownloadButtonProps) {
  const { isDownloaded, downloading, downloadVideo, removeDownload, cancelDownload, canDownload, remainingDownloads, maxDownloads, deviceLimitReached } = useDownloads();

  const isCurrentlyDownloading = lessonId in downloading;
  const downloadProgress = downloading[lessonId] ?? 0;
  const downloaded = isDownloaded(lessonId);

  const handleDownload = async (quality: string) => {
    if (!videoUrl) {
      toast.error("No video available for download");
      return;
    }

    if (maxDownloads === 0) {
      toast.error("Downloads are not available on the Free plan. Please upgrade.");
      return;
    }

    if (deviceLimitReached) {
      toast.error("Maximum 2 devices. Remove a device in Settings to add this one.");
      return;
    }

    if (!canDownload) {
      toast.error(`Download limit reached (${maxDownloads} max). Remove a download or upgrade your plan.`);
      return;
    }

    try {
      await downloadVideo(lessonId, videoUrl, title, thumbnailUrl, quality);
      toast.success("Video downloaded & encrypted for offline viewing!");
    } catch {
      toast.error("Download failed. Please try again.");
    }
  };

  const handleRemove = async () => {
    await removeDownload(lessonId);
    toast.success("Download removed");
  };

  const handleCancel = () => {
    cancelDownload(lessonId);
    toast.info("Download cancelled");
  };

  if (!videoUrl) return null;

  if (videoUrl.includes("youtube.com") || videoUrl.includes("vimeo.com") || videoUrl.includes("youtu.be")) {
    return null;
  }

  // Free plan - show bold disabled state
  if (maxDownloads === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size={compact ? "icon" : "sm"} disabled className="gap-1.5 border-primary/30">
            <Download className="w-4 h-4" />
            {!compact && <span className="text-xs font-bold text-primary">Upgrade to Download</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="font-bold text-sm">
          ⬆️ Upgrade your plan to download videos for offline viewing
        </TooltipContent>
      </Tooltip>
    );
  }

  if (downloaded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size={compact ? "icon" : "sm"} className="text-primary gap-1.5">
                <Check className="w-4 h-4" />
                {!compact && <span className="text-xs">Downloaded</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleRemove} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Download
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>Available offline (encrypted)</TooltipContent>
      </Tooltip>
    );
  }

  if (isCurrentlyDownloading) {
    return (
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size={compact ? "icon" : "sm"} disabled className="gap-1.5">
          <Loader2 className="w-4 h-4 animate-spin" />
          {!compact && <span className="text-xs">{downloadProgress > 0 ? `${downloadProgress}%` : "Starting..."}</span>}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancel}>
          <X className="w-3 h-3 text-destructive" />
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? "icon" : "sm"} className="gap-1.5">
          <Download className="w-4 h-4" />
          {!compact && <span className="text-xs">Download</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Select Quality ({remainingDownloads} remaining)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {QUALITY_OPTIONS.map((q) => (
          <DropdownMenuItem key={q.value} onClick={() => handleDownload(q.value)}>
            {q.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
