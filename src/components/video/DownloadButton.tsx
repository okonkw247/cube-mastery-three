import { useState } from "react";
import { Download, Check, Loader2, Trash2, WifiOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

export function DownloadButton({ lessonId, videoUrl, title, thumbnailUrl, compact = false }: DownloadButtonProps) {
  const { isDownloaded, downloading, downloadVideo, removeDownload, canDownload, remainingDownloads, maxDownloads } = useDownloads();

  const isCurrentlyDownloading = lessonId in downloading;
  const downloadProgress = downloading[lessonId] ?? 0;
  const downloaded = isDownloaded(lessonId);

  const handleDownload = async (quality = "auto") => {
    if (!videoUrl) {
      toast.error("No video available for download");
      return;
    }

    if (maxDownloads === 0) {
      toast.error("Downloads are not available on the Free plan. Please upgrade.");
      return;
    }

    if (!canDownload) {
      toast.error(`Download limit reached (${maxDownloads} max). Remove a download or upgrade your plan.`);
      return;
    }

    try {
      await downloadVideo(lessonId, videoUrl, title, thumbnailUrl, quality);
      toast.success("Video downloaded for offline viewing!");
    } catch {
      toast.error("Download failed. Please try again.");
    }
  };

  const handleRemove = async () => {
    await removeDownload(lessonId);
    toast.success("Download removed");
  };

  if (!videoUrl) return null;

  // Don't show download for embed URLs
  if (videoUrl.includes("youtube.com") || videoUrl.includes("vimeo.com") || videoUrl.includes("youtu.be")) {
    return null;
  }

  // Free plan - show disabled state
  if (maxDownloads === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size={compact ? "icon" : "sm"} disabled className="gap-1.5 opacity-50">
            <Download className="w-4 h-4" />
            {!compact && <span className="text-xs">Upgrade</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Upgrade to download videos for offline viewing</TooltipContent>
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
        <TooltipContent>Available offline</TooltipContent>
      </Tooltip>
    );
  }

  if (isCurrentlyDownloading) {
    return (
      <Button variant="ghost" size={compact ? "icon" : "sm"} disabled className="gap-1.5">
        <Loader2 className="w-4 h-4 animate-spin" />
        {!compact && <span className="text-xs">{downloadProgress > 0 ? `${downloadProgress}%` : "Starting..."}</span>}
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size={compact ? "icon" : "sm"} onClick={() => handleDownload()} className="gap-1.5">
          <Download className="w-4 h-4" />
          {!compact && <span className="text-xs">Download</span>}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Download for offline viewing ({remainingDownloads} remaining)
      </TooltipContent>
    </Tooltip>
  );
}
