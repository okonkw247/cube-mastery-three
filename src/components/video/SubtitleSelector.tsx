import { useState } from "react";
import { Check, Subtitles } from "lucide-react";
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Subtitle {
  id: string;
  language: string;
  label: string;
  url: string;
  is_default: boolean;
}

interface SubtitleSelectorProps {
  subtitles: Subtitle[];
  activeSubtitle: string | null;
  onSubtitleChange: (languageCode: string | null) => void;
  subtitlesEnabled: boolean;
  onToggleSubtitles: () => void;
}

const AVAILABLE_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
];

export function SubtitleSelector({
  subtitles,
  activeSubtitle,
  onSubtitleChange,
  subtitlesEnabled,
  onToggleSubtitles,
}: SubtitleSelectorProps) {
  const availableSubtitles = subtitles.length > 0 
    ? subtitles 
    : AVAILABLE_LANGUAGES.map(lang => ({
        id: lang.code,
        language: lang.code,
        label: lang.label,
        url: "",
        is_default: lang.code === "en",
      }));

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="hover:bg-white/10 focus:bg-white/10">
        <Subtitles className="w-4 h-4 mr-2" />
        <span>Subtitles</span>
        <span className="ml-auto text-white/60 text-xs">
          {subtitlesEnabled ? (activeSubtitle || "On") : "Off"}
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="bg-black/90 border-white/20 text-white min-w-[160px]">
          <DropdownMenuItem
            onClick={onToggleSubtitles}
            className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
          >
            {!subtitlesEnabled && <Check className="w-4 h-4 mr-2" />}
            <span className={subtitlesEnabled ? "ml-6" : ""}>Off</span>
          </DropdownMenuItem>
          
          {availableSubtitles.map((subtitle) => (
            <DropdownMenuItem
              key={subtitle.language}
              onClick={() => {
                if (!subtitlesEnabled) onToggleSubtitles();
                onSubtitleChange(subtitle.language);
              }}
              className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
            >
              {subtitlesEnabled && activeSubtitle === subtitle.language && (
                <Check className="w-4 h-4 mr-2" />
              )}
              <span className={!(subtitlesEnabled && activeSubtitle === subtitle.language) ? "ml-6" : ""}>
                {subtitle.label}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
