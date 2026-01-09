import { Play } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string | null;
  title: string;
}

const isDirectVideoUrl = (url: string): boolean => {
  // Check if it's a direct video file (mp4, webm, etc.) or from our storage
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  const lowerUrl = url.toLowerCase();
  
  // Check for video file extensions
  if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
    return true;
  }
  
  // Check if it's from our Supabase storage
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
  if (!videoUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-secondary">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Play className="w-10 h-10 text-primary" />
          </div>
          <p className="text-muted-foreground">Video Coming Soon</p>
          <p className="text-sm text-muted-foreground mt-1">
            Check back later for this lesson
          </p>
        </div>
      </div>
    );
  }

  // Check if it's a direct video file
  if (isDirectVideoUrl(videoUrl)) {
    return (
      <video
        src={videoUrl}
        title={title}
        className="absolute inset-0 w-full h-full object-contain bg-black"
        controls
        controlsList="nodownload"
        playsInline
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  const embedUrl = getEmbedUrl(videoUrl);

  if (!embedUrl) {
    // Not a recognized video URL, show as link
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-secondary">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Play className="w-10 h-10 text-primary" />
          </div>
          <p className="text-muted-foreground mb-4">External Video</p>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Open video in new tab →
          </a>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={embedUrl}
      title={title}
      className="absolute inset-0 w-full h-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
};

export default VideoPlayer;