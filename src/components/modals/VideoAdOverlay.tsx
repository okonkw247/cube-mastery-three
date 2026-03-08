import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import cubeVideo from "@/assets/cube-platform-preview.mp4";

interface VideoAdOverlayProps {
  isPreviewModalOpen: boolean;
}

const AD_OPT_OUT_KEY = "cube-ad-opt-out";
const AD_SHOWN_KEY = "cube-ad-first-shown";

const VideoAdOverlay = React.forwardRef<HTMLDivElement, VideoAdOverlayProps>(({ isPreviewModalOpen }, _ref) => {
  const [visible, setVisible] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(false);
  const [fadeState, setFadeState] = useState<"in" | "out" | "visible">("in");
  const [progress, setProgress] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const hasOptedOut = () => localStorage.getItem(AD_OPT_OUT_KEY) === "true";
  const hasSeenFirstAd = () => localStorage.getItem(AD_SHOWN_KEY) === "true";

  const handleOptOut = () => {
    localStorage.setItem(AD_OPT_OUT_KEY, "true");
    closeAd();
  };

  const closeAd = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setFadeState("out");
    setTimeout(() => {
      setVisible(false);
      setIsFirstLoad(false);
      setProgress(0);
      setCanSkip(false);
    }, 500);
  };

  const startProgressTracking = () => {
    // Enable skip button after 2 seconds
    setTimeout(() => setCanSkip(true), 2000);
    
    progressIntervalRef.current = setInterval(() => {
      if (videoRef.current) {
        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        if (duration > 0) {
          const progressPercent = (currentTime / duration) * 100;
          setProgress(progressPercent);
          
          // Close when video ends
          if (currentTime >= duration - 0.1) {
            closeAd();
          }
        }
      }
    }, 100);
  };

  const handleVideoEnded = () => {
    closeAd();
  };

  const showPeriodicAd = () => {
    if (hasOptedOut() || isPreviewModalOpen) return;
    
    setIsFirstLoad(false);
    setFadeState("in");
    setVisible(true);
    setProgress(0);
    setCanSkip(false);
    
    setTimeout(() => setFadeState("visible"), 50);
    
    // Reset video to start
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
    
    startProgressTracking();
  };

  const scheduleNextAd = () => {
    if (hasOptedOut()) return;
    
    // Random interval between 20-60 seconds
    const delay = Math.floor(Math.random() * 40000) + 20000;
    intervalRef.current = setTimeout(() => {
      showPeriodicAd();
      scheduleNextAd();
    }, delay);
  };

  useEffect(() => {
    // First load ad
    if (!hasOptedOut() && !hasSeenFirstAd()) {
      setIsFirstLoad(true);
      setFadeState("in");
      setVisible(true);
      localStorage.setItem(AD_SHOWN_KEY, "true");
      
      setTimeout(() => setFadeState("visible"), 50);
      
      // Start progress tracking after video loads
      setTimeout(() => startProgressTracking(), 100);
    }

    // Schedule periodic ads
    scheduleNextAd();

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Hide ad if preview modal opens
  useEffect(() => {
    if (isPreviewModalOpen && visible) {
      closeAd();
    }
  }, [isPreviewModalOpen]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity duration-500 ${
        fadeState === "out" ? "opacity-0" : fadeState === "in" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative w-full max-w-4xl mx-4 aspect-video rounded-2xl overflow-hidden shadow-2xl border border-primary/20">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 rounded-2xl blur-xl" />
        
        <div className="relative bg-background rounded-2xl overflow-hidden">
          <video
            ref={videoRef}
            src={cubeVideo}
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnded}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
          
          {/* Top right controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {/* Skip button */}
            <button
              onClick={closeAd}
              disabled={!canSkip}
              className={`px-3 py-1.5 rounded-full backdrop-blur-sm border text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                canSkip 
                  ? "bg-background/80 border-border/50 text-foreground hover:bg-background hover:scale-105 cursor-pointer" 
                  : "bg-background/40 border-border/30 text-muted-foreground cursor-not-allowed"
              }`}
              aria-label="Skip ad"
            >
              {canSkip ? (
                <>
                  <X className="w-4 h-4" />
                  Skip
                </>
              ) : (
                "Skip in 2s"
              )}
            </button>
          </div>
          
          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0">
            {/* Progress bar */}
            <div className="w-full h-1 bg-muted/30">
              <div 
                className="h-full bg-primary transition-all duration-100 ease-linear shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">Master the Cube</h3>
                <p className="text-sm text-muted-foreground">Start your speedcubing journey today</p>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link to="/auth" className="flex-1 sm:flex-initial">
                  <Button 
                    size="sm" 
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
                    onClick={closeAd}
                  >
                    Watch Full Course
                  </Button>
                </Link>
                
                {isFirstLoad && (
                  <button
                    onClick={handleOptOut}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors whitespace-nowrap"
                  >
                    Don't show again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

VideoAdOverlay.displayName = "VideoAdOverlay";

export default VideoAdOverlay;
