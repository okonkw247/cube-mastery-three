import { useState, useRef, useEffect } from "react";
import { Play, Loader2, Volume2, VolumeX, Maximize, Pause, Settings, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

interface VideoPlayerProps {
  videoUrl: string | null;
  title: string;
  lessonId?: string;
  onProgressUpdate?: (progress: number) => void;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const QUALITY_OPTIONS = ["Auto", "1080p", "720p", "480p", "360p"];

const isDirectVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  const lowerUrl = url.toLowerCase();
  
  if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
    return true;
  }
  
  if (url.includes('supabase.co/storage')) {
    return true;
  }
  
  return false;
};

const getEmbedUrl = (url: string): string | null => {
  // YouTube URLs
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`;
    }
  }

  // Vimeo URLs
  const vimeoPattern = /vimeo\.com\/(?:video\/)?(\d+)/;
  const vimeoMatch = url.match(vimeoPattern);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // Already an embed URL
  if (url.includes("youtube.com/embed") || url.includes("player.vimeo.com")) {
    return url;
  }

  return null;
};

const VideoPlayer = ({ videoUrl, title, lessonId, onProgressUpdate }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState("Auto");
  const [volume, setVolume] = useState(1);
  const [savedProgress, setSavedProgress] = useState<number | null>(null);
  const progressSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved progress from localStorage
  useEffect(() => {
    if (lessonId) {
      const saved = localStorage.getItem(`video_progress_${lessonId}`);
      if (saved) {
        const parsedProgress = parseFloat(saved);
        if (!isNaN(parsedProgress) && parsedProgress > 0) {
          setSavedProgress(parsedProgress);
        }
      }
    }
  }, [lessonId]);

  // Resume from saved progress when video is ready
  useEffect(() => {
    if (videoReady && savedProgress && videoRef.current && savedProgress < duration - 5) {
      videoRef.current.currentTime = savedProgress;
      setSavedProgress(null);
    }
  }, [videoReady, savedProgress, duration]);

  // Auto-save progress every 5 seconds
  useEffect(() => {
    if (lessonId && isPlaying) {
      progressSaveIntervalRef.current = setInterval(() => {
        if (videoRef.current) {
          const currentTime = videoRef.current.currentTime;
          localStorage.setItem(`video_progress_${lessonId}`, currentTime.toString());
          onProgressUpdate?.(currentTime);
        }
      }, 5000);
    }

    return () => {
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
      }
    };
  }, [lessonId, isPlaying, onProgressUpdate]);

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPlaying && showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  // Apply playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleVideoLoad = () => {
    setIsLoading(false);
    setVideoReady(true);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && duration > 0) {
      setProgress((videoRef.current.currentTime / duration) * 100);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * duration;
      setProgress(percent * 100);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  const handleQualityChange = (newQuality: string) => {
    setQuality(newQuality);
    // Note: Quality switching would require HLS/DASH adaptive streaming
    // For now, this is a UI placeholder that stores the preference
    localStorage.setItem("video_quality_preference", newQuality);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement?.tagName !== 'INPUT') {
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          skip(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [volume, duration]);

  if (!videoUrl) {
    return (
      <div className="relative w-full h-0 pb-[56.25%] bg-secondary rounded-xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">Video Coming Soon</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Check back later for this lesson
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if it's a direct video file
  if (isDirectVideoUrl(videoUrl)) {
    return (
      <div 
        ref={containerRef}
        className="relative w-full h-0 pb-[56.25%] bg-black rounded-xl overflow-hidden group"
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        tabIndex={0}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <div className="text-center">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading video...</p>
            </div>
          </div>
        )}

        {/* Resume from saved progress banner */}
        {savedProgress && savedProgress > 10 && (
          <div className="absolute top-4 left-4 right-4 bg-black/80 rounded-lg p-3 z-30 flex items-center justify-between">
            <span className="text-sm text-white">Resume from {formatTime(savedProgress)}?</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-white hover:bg-white/20"
                onClick={() => setSavedProgress(null)}
              >
                Start Over
              </Button>
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  if (videoRef.current && savedProgress) {
                    videoRef.current.currentTime = savedProgress;
                    setSavedProgress(null);
                    togglePlay();
                  }
                }}
              >
                Resume
              </Button>
            </div>
          </div>
        )}

        {/* Video Element - Proper 16:9 */}
        <video
          ref={videoRef}
          src={videoUrl}
          title={title}
          className="absolute inset-0 w-full h-full object-contain"
          controlsList="nodownload"
          playsInline
          preload="auto"
          onLoadedData={handleVideoLoad}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onEnded={() => {
            // Clear saved progress when video ends
            if (lessonId) {
              localStorage.removeItem(`video_progress_${lessonId}`);
            }
          }}
        />

        {/* Play Button Overlay - Only show when paused and ready */}
        {!isPlaying && videoReady && !savedProgress && (
          <div 
            className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
            onClick={togglePlay}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/90 flex items-center justify-center transition-transform hover:scale-110">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground ml-1" />
            </div>
          </div>
        )}

        {/* Custom Controls */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4 transition-opacity duration-300 z-20 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div 
            className="w-full h-1 sm:h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group/progress"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-primary rounded-full transition-all relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
              
              {/* Volume Control */}
              <div className="flex items-center gap-1 group/volume">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20"
                  onClick={toggleMute}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </Button>
                <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-200">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 h-1 accent-primary cursor-pointer"
                  />
                </div>
              </div>

              <span className="text-xs sm:text-sm text-white/80">
                {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Playback Speed Badge */}
              {playbackSpeed !== 1 && (
                <span className="text-xs bg-primary/80 text-white px-1.5 py-0.5 rounded">
                  {playbackSpeed}x
                </span>
              )}

              {/* Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20"
                  >
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-black/90 border-white/20 text-white">
                  <DropdownMenuLabel className="text-white/60 text-xs">Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  
                  {/* Playback Speed */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="hover:bg-white/10 focus:bg-white/10">
                      <span>Speed</span>
                      <span className="ml-auto text-white/60 text-xs">{playbackSpeed}x</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="bg-black/90 border-white/20 text-white">
                        {PLAYBACK_SPEEDS.map((speed) => (
                          <DropdownMenuItem 
                            key={speed}
                            onClick={() => handleSpeedChange(speed)}
                            className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                          >
                            {playbackSpeed === speed && <Check className="w-4 h-4 mr-2" />}
                            <span className={playbackSpeed !== speed ? "ml-6" : ""}>{speed}x</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  {/* Quality */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="hover:bg-white/10 focus:bg-white/10">
                      <span>Quality</span>
                      <span className="ml-auto text-white/60 text-xs">{quality}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="bg-black/90 border-white/20 text-white">
                        {QUALITY_OPTIONS.map((q) => (
                          <DropdownMenuItem 
                            key={q}
                            onClick={() => handleQualityChange(q)}
                            className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                          >
                            {quality === q && <Check className="w-4 h-4 mr-2" />}
                            <span className={quality !== q ? "ml-6" : ""}>{q}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator className="bg-white/10" />
                  
                  <DropdownMenuItem className="text-white/60 text-xs hover:bg-transparent focus:bg-transparent cursor-default">
                    Keyboard shortcuts: Space/K (play), F (fullscreen), M (mute)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(videoUrl);

  if (!embedUrl) {
    return (
      <div className="relative w-full h-0 pb-[56.25%] bg-secondary rounded-xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            </div>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">External Video</p>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm sm:text-base"
            >
              Open video in new tab →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // YouTube/Vimeo Embed with proper 16:9 aspect ratio
  return (
    <div className="relative w-full h-0 pb-[56.25%] bg-black rounded-xl overflow-hidden">
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default VideoPlayer;