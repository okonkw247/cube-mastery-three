import { useDownloads } from "@/hooks/useDownloads";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Trash2, HardDrive, WifiOff, Wifi, AlertTriangle, ShieldAlert, X, Smartphone, Monitor, Lock } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export function DownloadManager() {
  const {
    downloads,
    downloading,
    totalStorageUsed,
    maxDownloads,
    canPlayOffline,
    isOffline,
    verificationExpired,
    clearAllDownloads,
    removeDownload,
    cancelDownload,
    formatBytes,
    remainingDownloads,
    devices,
    deviceLimitReached,
    maxDevices,
  } = useDownloads();

  const handleRemove = async (lessonId: string) => {
    await removeDownload(lessonId);
    toast.success("Download removed");
  };

  const handleClearAll = async () => {
    if (confirm("Remove all downloaded videos? This cannot be undone.")) {
      await clearAllDownloads();
      toast.success("All downloads cleared");
    }
  };

  if (downloads.length === 0 && Object.keys(downloading).length === 0 && maxDownloads === 0) {
    return null;
  }

  return (
    <div className="card-gradient rounded-2xl p-4 sm:p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          Offline Downloads
        </h3>
        <div className="flex items-center gap-2">
          {isOffline ? (
            <span className="text-xs flex items-center gap-1 text-amber-500">
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          ) : (
            <span className="text-xs flex items-center gap-1 text-green-500">
              <Wifi className="w-3 h-3" /> Online
            </span>
          )}
          {downloads.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs text-destructive">
              <Trash2 className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Device limit warning */}
      {deviceLimitReached && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>Maximum {maxDevices} devices reached. <Link to="/settings" className="underline font-medium">Remove a device</Link> to download here.</span>
        </div>
      )}

      {/* Verification Warning */}
      {verificationExpired && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-500">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Connect to the internet to verify your account and continue offline playback.</span>
        </div>
      )}

      {/* Subscription blocked warning */}
      {!canPlayOffline && !verificationExpired && downloads.length > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Subscription inactive. Offline playback is blocked until you renew.</span>
        </div>
      )}

      {/* No downloads allowed - BOLD */}
      {maxDownloads === 0 && downloads.length === 0 && (
        <div className="text-center py-4">
          <Download className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-bold text-foreground mb-1">
            ⬆️ Upgrade to Download Courses
          </p>
          <p className="text-xs text-muted-foreground">
            Download courses for offline viewing with a paid plan.
          </p>
        </div>
      )}

      {/* Device info */}
      {devices.length > 0 && maxDownloads > 0 && (
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <Monitor className="w-3 h-3" />
          <span>Active devices: {devices.length}/{maxDevices}</span>
        </div>
      )}

      {/* Storage Info */}
      {(downloads.length > 0 || Object.keys(downloading).length > 0) && (
        <>
          <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
            <HardDrive className="w-3 h-3" />
            <span>{formatBytes(totalStorageUsed)} used</span>
            <span>•</span>
            <span>{downloads.length}/{maxDownloads === Infinity ? "∞" : maxDownloads} videos</span>
            <span>•</span>
            <span>{remainingDownloads === Infinity ? "∞" : remainingDownloads} remaining</span>
          </div>

          {/* Active Downloads */}
          {Object.entries(downloading).map(([lessonId, progress]) => (
            <div key={lessonId} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg mb-2">
              <Download className="w-4 h-4 text-primary animate-pulse" />
              <div className="flex-1">
                <p className="text-xs font-medium">Downloading & encrypting...</p>
                <Progress value={progress > 0 ? progress : undefined} className="h-1.5 mt-1" />
              </div>
              <span className="text-xs text-muted-foreground">{progress > 0 ? `${progress}%` : "..."}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => cancelDownload(lessonId)}>
                <X className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ))}

          {/* Downloaded Videos */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {downloads.map((video) => (
              <div key={video.lessonId} className="flex items-center gap-3 p-2 sm:p-3 bg-secondary/30 rounded-lg">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">{video.title}</p>
                  <p className="text-[10px] text-muted-foreground">{formatBytes(video.sizeBytes)} • {video.quality}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleRemove(video.lessonId)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          {/* Link to full My Downloads page */}
          <div className="mt-3 text-center">
            <Link to="/downloads" className="text-xs text-primary hover:underline">
              View all downloads →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
