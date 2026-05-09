import { useEffect, useRef, useState } from "react";
import { Play, Pause, X, Music2, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const PLAYLIST_ID = "PLofht4PTcKYdHxNAHGQsHNuSMrBCzHLFt";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function FocusMusicPlayer({ open, onClose }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(60);

  // Send commands to YouTube iframe via postMessage
  const post = (func: string, args: any[] = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*"
    );
  };

  useEffect(() => {
    if (!open) return;
    post("setVolume", [volume]);
  }, [volume, open]);

  const togglePlay = () => {
    if (playing) post("pauseVideo");
    else post("playVideo");
    setPlaying(!playing);
  };

  if (!open) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[70] w-[min(420px,calc(100vw-24px))] rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl p-3"
      style={{
        bottom: `calc(80px + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      <iframe
        ref={iframeRef}
        title="Focus Music"
        src={`https://www.youtube.com/embed/videoseries?list=${PLAYLIST_ID}&autoplay=1&enablejsapi=1&controls=0&modestbranding=1`}
        allow="autoplay; encrypted-media"
        style={{ width: 0, height: 0, border: 0, position: "absolute" }}
      />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Music2 className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">Focus Music</p>
          <p className="text-xs text-muted-foreground truncate">Lo-fi practice playlist</p>
        </div>
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70"
          aria-label="Close player"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 mt-3 px-1">
        <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
        <Slider
          value={[volume]}
          onValueChange={(v) => setVolume(v[0])}
          max={100}
          step={1}
        />
        <span className="text-xs text-muted-foreground w-8 text-right">{volume}</span>
      </div>
    </div>
  );
}
