import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TheaterModeButtonProps {
  isTheaterMode: boolean;
  onToggle: () => void;
}

export function TheaterModeButton({ isTheaterMode, onToggle }: TheaterModeButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 sm:h-9 sm:w-9 text-white hover:bg-white/20"
      onClick={onToggle}
      title={isTheaterMode ? "Exit theater mode" : "Theater mode"}
    >
      {isTheaterMode ? (
        <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
      ) : (
        <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
      )}
    </Button>
  );
}
