import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useDownloads } from "@/hooks/useDownloads";
import { useLessons } from "@/hooks/useLessons";
import { LogoWithGlow } from "@/components/LogoWithGlow";
import { toast } from "sonner";
import {
  Download,
  Trash2,
  HardDrive,
  Lock,
  WifiOff,
  Wifi,
  ArrowLeft,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const MyDownloads = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const { lessons } = useLessons();
  const {
    downloads,
    downloading,
    totalStorageUsed,
    maxDownloads,
    canDownload,
    canPlayOffline,
    isOffline,
    verificationExpired,
    isDownloaded,
    downloadVideo,
    cancelDownload,
    removeDownload,
    clearAllDownloads,
    formatBytes,
    remainingDownloads,
    devices,
    deviceLimitReached,
    maxDevices,
  } = useDownloads();

  const [batchDownloading, setBatchDownloading] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const tier = profile?.subscription_tier || "free";

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

  const handleDownloadAll = async () => {
    if (!canDownload) return;
    setBatchDownloading(true);
    const toDownload = lessons.filter(
      (l) => l.video_url && !isDownloaded(l.id) && !l.video_url.includes("youtube.com") && !l.video_url.includes("vimeo.com")
    );
    for (const lesson of toDownload) {
      if (!canDownload) break;
      try {
        await downloadVideo(lesson.id, lesson.video_url!, lesson.title, lesson.thumbnail_url || undefined, "720p");
      } catch {
        // continue with next
      }
    }
    setBatchDownloading(false);
    toast.success("Batch download complete!");
  };

  // Estimate storage
  const estimateStorage = async () => {
    try {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const est = await navigator.storage.estimate();
        return {
          used: est.usage || 0,
          total: est.quota || 0,
          percent: est.quota ? Math.round(((est.usage || 0) / est.quota) * 100) : 0,
        };
      }
    } catch {}
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <LogoWithGlow size="md" />
            <span className="text-lg sm:text-xl font-bold text-foreground hidden sm:inline">Cube Mastery</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Download className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          <h1 className="text-2xl sm:text-4xl font-bold">My Downloads</h1>
        </div>

        {/* Free plan block */}
        {maxDownloads === 0 && (
          <div className="card-gradient rounded-2xl border border-border p-8 text-center">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Downloads Not Available</h2>
            <p className="text-lg font-bold text-primary mb-4">
              ⬆️ Upgrade your plan to download courses for offline viewing!
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Starter plan: Download all 15 courses • Pro plan: Download all 50+ courses
            </p>
            <Link to="/#pricing">
              <Button size="lg">View Plans</Button>
            </Link>
          </div>
        )}

        {maxDownloads > 0 && (
          <>
            {/* Status bar */}
            <div className="card-gradient rounded-2xl border border-border p-4 sm:p-6 mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <div className="flex items-center gap-1.5">
                    {isOffline ? (
                      <><WifiOff className="w-4 h-4 text-amber-500" /><span className="text-sm font-medium text-amber-500">Offline</span></>
                    ) : (
                      <><Wifi className="w-4 h-4 text-green-500" /><span className="text-sm font-medium text-green-500">Online</span></>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Storage Used</p>
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{formatBytes(totalStorageUsed)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Downloaded</p>
                  <p className="text-sm font-medium">{downloads.length}/{maxDownloads === Infinity ? "∞" : maxDownloads} videos</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Devices</p>
                  <div className="flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{devices.length}/{maxDevices}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {deviceLimitReached && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Maximum {maxDevices} devices. <Link to="/settings" className="underline font-medium">Remove a device</Link> to download on this one.</span>
              </div>
            )}

            {verificationExpired && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-500">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Go online to verify your account for continued offline playback.</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mb-6">
              {canDownload && (
                <Button onClick={handleDownloadAll} disabled={batchDownloading} className="gap-1.5">
                  {batchDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download All
                </Button>
              )}
              {downloads.length > 0 && (
                <Button variant="outline" onClick={handleClearAll} className="gap-1.5 text-destructive">
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Active Downloads */}
            {Object.keys(downloading).length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Downloading</h2>
                <div className="space-y-2">
                  {Object.entries(downloading).map(([lessonId, progress]) => (
                    <div key={lessonId} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border border-border">
                      <Download className="w-5 h-5 text-primary animate-pulse shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Downloading & encrypting...</p>
                        <Progress value={progress > 0 ? progress : undefined} className="h-1.5 mt-1" />
                      </div>
                      <span className="text-xs text-muted-foreground">{progress > 0 ? `${progress}%` : "..."}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => cancelDownload(lessonId)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Downloaded Videos */}
            {downloads.length > 0 ? (
              <div>
                <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Downloaded Courses</h2>
                <div className="space-y-2">
                  {downloads.map((video) => (
                    <div key={video.lessonId} className="flex items-center gap-3 p-3 sm:p-4 bg-secondary/30 rounded-xl border border-border">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt="" className="w-16 h-10 rounded object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <Lock className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{video.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatBytes(video.sizeBytes)}</span>
                          <span>•</span>
                          <span>{video.quality}</span>
                          <span>•</span>
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span className="text-green-500">Available Offline</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleRemove(video.lessonId)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Download className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No downloaded courses yet. Download videos to watch offline!</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MyDownloads;
