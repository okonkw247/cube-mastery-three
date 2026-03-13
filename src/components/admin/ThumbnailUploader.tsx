import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Upload, Check, X, ImageIcon, Paintbrush } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ThumbnailUploaderProps {
  value: string;
  onChange: (url: string) => void;
  lessonTitle?: string;
  lessonDescription?: string;
  required?: boolean;
}

const GRADIENT_PRESETS = [
  { id: "dark-cube", label: "Dark Cube", from: "#0a0a0a", to: "#1a1a2e", glow: "rgba(0, 212, 212, 0.25)" },
  { id: "fire-speed", label: "Fire Speed", from: "#1a0000", to: "#3d0000", glow: "rgba(255, 140, 0, 0.25)" },
  { id: "electric", label: "Electric", from: "#001a1a", to: "#003333", glow: "rgba(0, 230, 255, 0.25)" },
  { id: "midnight", label: "Midnight", from: "#000000", to: "#0d0d0d", glow: "rgba(160, 80, 255, 0.25)" },
];

function drawThumbnail(
  canvas: HTMLCanvasElement,
  title: string,
  description: string,
  preset: typeof GRADIENT_PRESETS[0]
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = 1280;
  canvas.height = 720;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 1280, 720);
  bg.addColorStop(0, preset.from);
  bg.addColorStop(1, preset.to);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1280, 720);

  // Glow circle
  const glow = ctx.createRadialGradient(640, 300, 50, 640, 300, 350);
  glow.addColorStop(0, preset.glow);
  glow.addColorStop(0.6, preset.glow.replace(/[\d.]+\)$/, "0.06)"));
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1280, 720);

  // Cube emoji
  ctx.font = "180px serif";
  ctx.textAlign = "center";
  ctx.fillText("🧊", 640, 330);

  // Dark overlay for text area
  const textBg = ctx.createLinearGradient(0, 460, 0, 720);
  textBg.addColorStop(0, "rgba(0,0,0,0)");
  textBg.addColorStop(0.3, "rgba(0,0,0,0.7)");
  textBg.addColorStop(1, "rgba(0,0,0,0.95)");
  ctx.fillStyle = textBg;
  ctx.fillRect(0, 460, 1280, 260);

  // Accent bar bottom
  const accentColor = preset.id === "fire-speed" ? "#ff8c00" :
    preset.id === "electric" ? "#00e6ff" :
    preset.id === "midnight" ? "#a050ff" : "#00d4d4";
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 710, 1280, 10);

  // Title text wrapping
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 56px -apple-system, BlinkMacSystemFont, sans-serif";

  const maxWidth = 1100;
  const words = (title || "Untitled Lesson").split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const displayLines = lines.slice(0, 3);
  const lineHeight = 68;
  const startY = 620 - (displayLines.length * lineHeight) / 2;

  displayLines.forEach((line, i) => {
    ctx.fillStyle = accentColor + "4D"; // shadow
    ctx.fillText(line, 642, startY + i * lineHeight + 2);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(line, 640, startY + i * lineHeight);
  });

  // Description
  if (description) {
    ctx.font = "24px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    const short = description.length > 60 ? description.substring(0, 57) + "..." : description;
    ctx.fillText(short, 640, 440);
  }

  // Badge
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = accentColor;
  ctx.fillText("CUBE MASTERY", 40, 50);
}

export function ThumbnailUploader({
  value,
  onChange,
  lessonTitle = "",
  lessonDescription = "",
  required = false,
}: ThumbnailUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(GRADIENT_PRESETS[0]);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const generatedBlobRef = useRef<Blob | null>(null);

  // Draw live preview whenever title, description, or preset changes
  const updatePreview = useCallback(() => {
    if (!previewCanvasRef.current) return;
    drawThumbnail(previewCanvasRef.current, lessonTitle, lessonDescription, selectedPreset);
  }, [lessonTitle, lessonDescription, selectedPreset]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }

    setUploading(true);
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { error } = await supabase.storage.from("thumbnails").upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (error) { toast.error("Failed to upload thumbnail"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("thumbnails").getPublicUrl(fileName);
    onChange(urlData.publicUrl);
    setUploading(false);
    toast.success("Thumbnail uploaded!");
  };

  const generateAndUpload = async () => {
    if (!lessonTitle) { toast.error("Please enter a lesson title first"); return; }
    if (!previewCanvasRef.current) return;

    setUploading(true);
    try {
      // Re-draw at full resolution
      drawThumbnail(previewCanvasRef.current, lessonTitle, lessonDescription, selectedPreset);

      const blob = await new Promise<Blob>((resolve, reject) => {
        previewCanvasRef.current!.toBlob(
          b => b ? resolve(b) : reject(new Error("Failed to create blob")),
          "image/png", 0.95
        );
      });

      const fileName = `thumb-${Date.now()}.png`;
      const { error } = await supabase.storage.from("thumbnails").upload(fileName, blob, {
        contentType: "image/png", cacheControl: "3600", upsert: false,
      });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from("thumbnails").getPublicUrl(fileName);
      onChange(urlData.publicUrl);
      toast.success("Thumbnail saved! ✅");
    } catch (err: any) {
      toast.error("Failed to save thumbnail");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        Thumbnail {required && <span className="text-destructive">*</span>}
      </Label>

      {/* Live Canvas Preview */}
      <div className="relative aspect-video bg-secondary rounded-lg overflow-hidden border-2 border-dashed border-border">
        {value ? (
          <img src={value} alt="Thumbnail" className="w-full h-full object-cover" />
        ) : (
          <canvas
            ref={previewCanvasRef}
            className="w-full h-full object-contain"
            style={{ imageRendering: "auto" }}
          />
        )}
      </div>

      {/* Gradient Presets */}
      {!value && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Select gradient preset:</Label>
          <RadioGroup
            value={selectedPreset.id}
            onValueChange={(id) => {
              const preset = GRADIENT_PRESETS.find(p => p.id === id);
              if (preset) setSelectedPreset(preset);
            }}
            className="grid grid-cols-2 gap-2"
          >
            {GRADIENT_PRESETS.map(preset => (
              <div key={preset.id} className="flex items-center gap-2">
                <RadioGroupItem value={preset.id} id={preset.id} />
                <Label htmlFor={preset.id} className="text-sm cursor-pointer flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
                  />
                  {preset.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Label
          htmlFor="thumbnail-upload"
          className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm transition-colors"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
          ) : (
            <><Upload className="w-4 h-4" /> Upload custom image</>
          )}
        </Label>
        <Input
          id="thumbnail-upload"
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />

        {!value && (
          <Button
            type="button"
            onClick={generateAndUpload}
            disabled={uploading || !lessonTitle}
            className="flex-1"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Paintbrush className="w-4 h-4 mr-2" /> Generate Thumbnail</>
            )}
          </Button>
        )}

        {value && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange("")}
            className="shrink-0"
          >
            <X className="w-4 h-4 mr-1" /> Remove
          </Button>
        )}
      </div>

      {/* URL input */}
      <Input
        placeholder="Or paste thumbnail URL..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm"
      />
    </div>
  );
}
