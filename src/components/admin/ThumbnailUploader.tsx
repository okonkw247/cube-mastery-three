import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Wand2, RefreshCw, Check, X, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ThumbnailUploaderProps {
  value: string;
  onChange: (url: string) => void;
  lessonTitle?: string;
  lessonDescription?: string;
  required?: boolean;
}

function generateThumbnailCanvas(title: string, description: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Canvas not supported"));

    // Dark gradient background
    const bg = ctx.createLinearGradient(0, 0, 1280, 720);
    bg.addColorStop(0, "#0a0a0a");
    bg.addColorStop(0.5, "#0d1117");
    bg.addColorStop(1, "#1a1a2e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1280, 720);

    // Teal glow circle in center
    const glow = ctx.createRadialGradient(640, 320, 50, 640, 320, 350);
    glow.addColorStop(0, "rgba(0, 212, 212, 0.25)");
    glow.addColorStop(0.5, "rgba(0, 212, 212, 0.08)");
    glow.addColorStop(1, "rgba(0, 212, 212, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1280, 720);

    // Cube emoji as hero element
    ctx.font = "180px serif";
    ctx.textAlign = "center";
    ctx.fillText("🧊", 640, 340);

    // Secondary glow behind text area
    const textGlow = ctx.createLinearGradient(0, 480, 0, 720);
    textGlow.addColorStop(0, "rgba(0, 0, 0, 0)");
    textGlow.addColorStop(0.3, "rgba(0, 0, 0, 0.7)");
    textGlow.addColorStop(1, "rgba(0, 0, 0, 0.95)");
    ctx.fillStyle = textGlow;
    ctx.fillRect(0, 480, 1280, 240);

    // Teal accent bar at bottom
    ctx.fillStyle = "#00d4d4";
    ctx.fillRect(0, 710, 1280, 10);

    // Title text - wrap if needed
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const maxWidth = 1100;
    const words = title.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    ctx.font = "bold 56px -apple-system, BlinkMacSystemFont, sans-serif";

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

    // Limit to 3 lines
    const displayLines = lines.slice(0, 3);
    const lineHeight = 68;
    const startY = 620 - (displayLines.length * lineHeight) / 2;

    displayLines.forEach((line, i) => {
      // Text shadow
      ctx.fillStyle = "rgba(0, 212, 212, 0.3)";
      ctx.fillText(line, 642, startY + i * lineHeight + 2);
      // Main text
      ctx.fillStyle = "#ffffff";
      ctx.fillText(line, 640, startY + i * lineHeight);
    });

    // Small description text if provided
    if (description) {
      ctx.font = "24px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      const shortDesc = description.length > 60 ? description.substring(0, 57) + "..." : description;
      ctx.fillText(shortDesc, 640, 450);
    }

    // "CUBE MASTERY" badge top-left
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#00d4d4";
    ctx.fillText("CUBE MASTERY", 40, 50);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      },
      "image/png",
      0.95
    );
  });
}

export function ThumbnailUploader({
  value,
  onChange,
  lessonTitle = "",
  lessonDescription = "",
  required = false,
}: ThumbnailUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const generatedBlobRef = useRef<Blob | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const { error } = await supabase.storage
      .from("thumbnails")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) {
      toast.error("Failed to upload thumbnail");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("thumbnails").getPublicUrl(fileName);
    onChange(urlData.publicUrl);
    setUploading(false);
    toast.success("Thumbnail uploaded!");
  };

  const generateWithCanvas = async () => {
    if (!lessonTitle) {
      toast.error("Please enter a lesson title first");
      return;
    }

    setGenerating(true);
    setGeneratedPreview(null);

    try {
      const blob = await generateThumbnailCanvas(lessonTitle, lessonDescription);
      generatedBlobRef.current = blob;
      const previewUrl = URL.createObjectURL(blob);
      setGeneratedPreview(previewUrl);
      toast.success("Thumbnail generated! Click Accept to use it.");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate thumbnail");
    } finally {
      setGenerating(false);
    }
  };

  const acceptGenerated = async () => {
    if (!generatedBlobRef.current) return;

    setUploading(true);
    try {
      const fileName = `ai-canvas-${Date.now()}.png`;

      const { error } = await supabase.storage
        .from("thumbnails")
        .upload(fileName, generatedBlobRef.current, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from("thumbnails").getPublicUrl(fileName);
      onChange(urlData.publicUrl);
      if (generatedPreview) URL.revokeObjectURL(generatedPreview);
      setGeneratedPreview(null);
      generatedBlobRef.current = null;
      toast.success("Thumbnail saved! ✅");
    } catch (error: any) {
      toast.error("Failed to save thumbnail");
    } finally {
      setUploading(false);
    }
  };

  const rejectGenerated = () => {
    if (generatedPreview) URL.revokeObjectURL(generatedPreview);
    setGeneratedPreview(null);
    generatedBlobRef.current = null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Thumbnail {required && <span className="text-destructive">*</span>}
        </Label>
      </div>

      {/* Live Preview */}
      <div className="relative aspect-video bg-secondary rounded-lg overflow-hidden border-2 border-dashed border-border">
        {value || generatedPreview ? (
          <img
            src={generatedPreview || value}
            alt="Thumbnail preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No thumbnail yet</p>
            </div>
          </div>
        )}

        {generatedPreview && (
          <div className="absolute bottom-2 right-2 flex gap-2">
            <Button size="sm" variant="secondary" onClick={rejectGenerated} className="bg-black/70 hover:bg-black/90">
              <X className="w-4 h-4 mr-1" /> Reject
            </Button>
            <Button size="sm" onClick={acceptGenerated} disabled={uploading} className="bg-primary hover:bg-primary/90">
              {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              Accept
            </Button>
          </div>
        )}
      </div>

      {/* Upload and Generate buttons */}
      <div className="flex gap-2">
        <Label
          htmlFor="thumbnail-upload"
          className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm transition-colors"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
          ) : (
            <><Upload className="w-4 h-4" /> Upload Image</>
          )}
        </Label>
        <Input
          id="thumbnail-upload"
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading || generating}
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          onClick={generateWithCanvas}
          disabled={generating || uploading || !lessonTitle}
          className="flex-1"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating... ⏳</>
          ) : generatedPreview ? (
            <><RefreshCw className="w-4 h-4 mr-2" /> Regenerate</>
          ) : (
            <><Wand2 className="w-4 h-4 mr-2" /> AI Generate</>
          )}
        </Button>
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
