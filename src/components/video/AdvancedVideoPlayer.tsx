import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Play, Pause, Volume2, VolumeX, Volume1, Maximize, Minimize, 
  Settings, SkipBack, SkipForward, Loader2, PictureInPicture2,
  Check, ChevronRight
} from "lucide-react";
import { useTimelineThumbnails } from "@/hooks/useTimelineThumbnails";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChapterMarker {
  time: number;
  title: string;
}

interface AdvancedVideoPlayerProps {
  videoUrl: string | null;
  title: string;
  lessonId?: string;
  chapters?: ChapterMarker[];
  onProgressUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const QUALITY_OPTIONS = ["Auto", "1080p", "720p", "480p", "360p", "240p"];

const AdvancedVideoPlayer = ({ 
  videoUrl, 
  title, 
  lessonId, 
  chapters = [],
  onProgressUpdate,
  onComplete
}: AdvancedVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState("Auto");
  const [savedProgress, setSavedProgress] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isPiP, setIsPiP] = useState(false);

  // Timeline thumbnail extraction
  const { 
    getThumbnailAtTime, 
    extractFrames, 
    isExtracting, 
    frames 
  } = useTimelineThumbnails(videoUrl, { interval: 5, width: 160, height: 90 });

  // Load saved preferences
  useEffect(() => {
    const savedQuality = localStorage.getItem("video_quality_preference");
    if (savedQuality) setQuality(savedQuality);

    const savedVolume = localStorage.getItem("video_volume_preference");
    if (savedVolume) {
      const vol = parseFloat(savedVolume);
      setVolume(vol);
      if (videoRef.current) videoRef.current.volume = vol;
    }
  }, []);

  // Load saved progress
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

  // Resume from saved progress
  useEffect(() => {
    if (savedProgress && videoRef.current && duration > 0 && savedProgress < duration - 5) {
      videoRef.current.currentTime = savedProgress;
      setSavedProgress(null);
    }
  }, [savedProgress, duration]);

  // Auto-save progress
  useEffect(() => {
    if (lessonId && isPlaying) {
      progressSaveIntervalRef.current = setInterval(() => {
        if (videoRef.current) {
          const time = videoRef.current.currentTime;
          localStorage.setItem(`video_progress_${lessonId}`, time.toString());
          onProgressUpdate?.(time);
        }
      }, 5000);
    }
    return () => {
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
      }
    };
  }, [lessonId, isPlaying, onProgressUpdate]);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, resetControlsTimeout]);

  // Apply playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // PiP change listener
  useEffect(() => {
    const handlePiPChange = () => {
      setIsPiP(document.pictureInPictureElement === videoRef.current);
    };
    videoRef.current?.addEventListener("enterpictureinpicture", handlePiPChange);
    videoRef.current?.addEventListener("leavepictureinpicture", handlePiPChange);
    return () => {
      videoRef.current?.removeEventListener("enterpictureinpicture", handlePiPChange);
      videoRef.current?.removeEventListener("leavepictureinpicture", handlePiPChange);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
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
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
        case 'arrowright':
        case 'l':
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
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          const percent = parseInt(e.key) / 10;
          if (videoRef.current && duration > 0) {
            videoRef.current.currentTime = duration * percent;
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [volume, duration]);

  // Video event handlers
  const handleVideoLoad = () => {
    setIsLoading(false);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && duration > 0) {
      setCurrentTime(videoRef.current.currentTime);
      setProgress((videoRef.current.currentTime / duration) * 100);
    }
  };

  const handleProgress = () => {
    if (videoRef.current && duration > 0) {
      const bufferedEnd = videoRef.current.buffered.length > 0 
        ? videoRef.current.buffered.end(videoRef.current.buffered.length - 1) 
        : 0;
      setBuffered((bufferedEnd / duration) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (lessonId) {
      localStorage.removeItem(`video_progress_${lessonId}`);
    }
    onComplete?.();
  };

  // Control functions
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
      localStorage.setItem("video_volume_preference", newVolume.toString());
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

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0 && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * duration;
      setProgress(percent * 100);
    }
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && duration > 0) {
      const rect = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      setHoverTime(percent * duration);
      setHoverPosition(e.clientX - rect.left);
    }
  };

  const handleProgressLeave = () => {
    setHoverTime(null);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return VolumeX;
    if (volume < 0.5) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  // No video URL
  if (!videoUrl) {
    return (
      <div className="relative w-full aspect-video bg-secondary rounded-xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">Video Coming Soon</p>
          </div>
        </div>
      </div>
    );
  }

  // Check for embed URLs
  const isEmbed = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('vimeo.com');
  
  if (isEmbed) {
    const getEmbedUrl = (url: string) => {
      const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`;
      
      const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      
      return url;
    };

    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
        <iframe
          src={getEmbedUrl(videoUrl)}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group select-none"
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'VIDEO') {
          togglePlay();
        }
      }}
      tabIndex={0}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      )}

      {/* Resume Banner */}
      {savedProgress && savedProgress > 10 && (
        <div className="absolute top-4 left-4 right-4 bg-black/90 rounded-lg p-3 z-30 flex items-center justify-between backdrop-blur-sm">
          <span className="text-sm text-white">Resume from {formatTime(savedProgress)}?</span>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white hover:bg-white/20 h-8"
              onClick={() => setSavedProgress(null)}
            >
              Start Over
            </Button>
            <Button 
              size="sm" 
              className="bg-primary hover:bg-primary/90 h-8"
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

      {/* Video Element */}
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
        onProgress={handleProgress}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onEnded={handleEnded}
      />

      {/* Center Play Button */}
      {!isPlaying && !isLoading && !savedProgress && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center transition-transform hover:scale-110 shadow-2xl">
            <Play className="w-10 h-10 text-primary-foreground ml-1" />
          </div>
        </div>
      )}

      {/* Skip Indicators */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
              onClick={() => skip(-10)}
            >
              <SkipBack className="w-6 h-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Rewind 10s (J)</TooltipContent>
        </Tooltip>
      </div>
      
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
              onClick={() => skip(10)}
            >
              <SkipForward className="w-6 h-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Forward 10s (L)</TooltipContent>
        </Tooltip>
      </div>

      {/* Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-3 px-3 transition-opacity duration-300 z-20 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar */}
        <div 
          ref={progressRef}
          className="w-full h-1 bg-white/20 rounded-full cursor-pointer mb-3 group/progress relative hover:h-1.5 transition-all"
          onClick={handleSeek}
          onMouseMove={handleProgressHover}
          onMouseLeave={handleProgressLeave}
        >
          {/* Buffered */}
          <div 
            className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
            style={{ width: `${buffered}%` }}
          />
          
          {/* Progress */}
          <div 
            className="absolute inset-y-0 left-0 bg-primary rounded-full"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg" />
          </div>

          {/* Chapter Markers */}
          {chapters.map((chapter, idx) => (
            <div
              key={idx}
              className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-white/80 rounded-full"
              style={{ left: `${(chapter.time / duration) * 100}%` }}
              title={chapter.title}
            />
          ))}

          {/* Hover Time Preview */}
          {hoverTime !== null && (
            <div 
              className="absolute bottom-full mb-2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded"
              style={{ left: hoverPosition }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Play/Pause */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 text-white hover:bg-white/20"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isPlaying ? 'Pause (K)' : 'Play (K)'}</TooltipContent>
            </Tooltip>

            {/* Skip Buttons (mobile) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 text-white hover:bg-white/20 sm:hidden"
                  onClick={() => skip(-10)}
                >
                  <SkipBack className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rewind 10s</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 text-white hover:bg-white/20 sm:hidden"
                  onClick={() => skip(10)}
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Forward 10s</TooltipContent>
            </Tooltip>

            {/* Volume */}
            <div 
              className="flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-white hover:bg-white/20"
                    onClick={toggleMute}
                  >
                    <VolumeIcon className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isMuted ? 'Unmute (M)' : 'Mute (M)'}</TooltipContent>
              </Tooltip>
              
              <div className={`overflow-hidden transition-all duration-200 ${showVolumeSlider ? 'w-20 ml-1' : 'w-0'}`}>
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={([val]) => handleVolumeChange(val / 100)}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {/* Time Display */}
            <span className="text-xs sm:text-sm text-white/80 ml-2 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Speed Badge */}
            {playbackSpeed !== 1 && (
              <span className="text-xs bg-primary/80 text-white px-1.5 py-0.5 rounded font-medium">
                {playbackSpeed}x
              </span>
            )}

            {/* Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 text-white hover:bg-white/20"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-black/95 border-white/10 text-white backdrop-blur-xl">
                <DropdownMenuLabel className="text-white/60 text-xs">Playback Settings</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                
                {/* Speed */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="hover:bg-white/10 focus:bg-white/10">
                    <span>Playback Speed</span>
                    <span className="ml-auto text-white/60 text-xs">{playbackSpeed}x</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="bg-black/95 border-white/10 text-white backdrop-blur-xl">
                      {PLAYBACK_SPEEDS.map((speed) => (
                        <DropdownMenuItem 
                          key={speed}
                          onClick={() => setPlaybackSpeed(speed)}
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
                    <DropdownMenuSubContent className="bg-black/95 border-white/10 text-white backdrop-blur-xl">
                      {QUALITY_OPTIONS.map((q) => (
                        <DropdownMenuItem 
                          key={q}
                          onClick={() => {
                            setQuality(q);
                            localStorage.setItem("video_quality_preference", q);
                          }}
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
                
                <div className="px-2 py-1.5 text-xs text-white/50">
                  <div>Space/K: Play/Pause</div>
                  <div>J/L: Skip ±10s</div>
                  <div>F: Fullscreen • M: Mute</div>
                  <div>0-9: Jump to %</div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* PiP */}
            {document.pictureInPictureEnabled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-white hover:bg-white/20 hidden sm:flex"
                    onClick={togglePiP}
                  >
                    <PictureInPicture2 className={`w-5 h-5 ${isPiP ? 'text-primary' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Picture in Picture</TooltipContent>
              </Tooltip>
            )}

            {/* Fullscreen */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 text-white hover:bg-white/20"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedVideoPlayer;
