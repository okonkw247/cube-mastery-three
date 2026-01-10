import { useState, useRef, useEffect } from "react";
import { Play, Loader2, Volume2, VolumeX, Maximize, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface VideoPlayerProps {
  videoUrl: string | null;
  title: string;
}

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

const VideoPlayer = ({ videoUrl, title }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPlaying && showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
        />

        {/* Play Button Overlay - Only show when paused and ready */}
        {!isPlaying && videoReady && (
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
            className="w-full h-1 sm:h-1.5 bg-white/20 rounded-full cursor-pointer mb-3"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
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
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>

              <span className="text-xs sm:text-sm text-white/80">
                {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
              </span>
            </div>

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
