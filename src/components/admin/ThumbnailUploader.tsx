import { useState } from "react";
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const { error } = await supabase.storage
      .from("thumbnails")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Thumbnail upload error:", error);
      toast.error("Failed to upload thumbnail");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("thumbnails")
      .getPublicUrl(fileName);

    onChange(urlData.publicUrl);
    setUploading(false);
    toast.success("Thumbnail uploaded!");
  };

  const generateWithAI = async () => {
    if (!lessonTitle) {
      toast.error("Please enter a lesson title first");
      return;
    }

    setGenerating(true);
    setGeneratedPreview(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-thumbnail", {
        body: {
          title: lessonTitle,
          description: lessonDescription,
        },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedPreview(data.imageUrl);
        toast.success("Thumbnail generated! Click Accept to use it.");
      } else {
        throw new Error("No image generated");
      }
    } catch (error: any) {
      console.error("AI generation error:", error);
      toast.error(error.message || "Failed to generate thumbnail");
    } finally {
      setGenerating(false);
    }
  };

  const acceptGenerated = async () => {
    if (!generatedPreview) return;

    setUploading(true);
    try {
      // Download the generated image and upload to storage
      const response = await fetch(generatedPreview);
      const blob = await response.blob();
      const fileName = `ai-${Date.now()}.png`;

      const { error } = await supabase.storage
        .from("thumbnails")
        .upload(fileName, blob, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("thumbnails")
        .getPublicUrl(fileName);

      onChange(urlData.publicUrl);
      setGeneratedPreview(null);
      toast.success("AI thumbnail saved!");
    } catch (error: any) {
      toast.error("Failed to save generated thumbnail");
    } finally {
      setUploading(false);
    }
  };

  const rejectGenerated = () => {
    setGeneratedPreview(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Thumbnail {required && <span className="text-destructive">*</span>}
        </Label>
        {required && !value && !generatedPreview && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Skip for now
          </button>
        )}
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

        {/* Generated preview actions */}
        {generatedPreview && (
          <div className="absolute bottom-2 right-2 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={rejectGenerated}
              className="bg-black/70 hover:bg-black/90"
            >
              <X className="w-4 h-4 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={acceptGenerated}
              disabled={uploading}
              className="bg-primary hover:bg-primary/90"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-1" />
              )}
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
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Image
            </>
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
          onClick={generateWithAI}
          disabled={generating || uploading || !lessonTitle}
          className="flex-1"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : generatedPreview ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              AI Generate
            </>
          )}
        </Button>
      </div>

      {/* URL input for pasting external thumbnails */}
      <div>
        <Input
          placeholder="Or paste thumbnail URL..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm"
        />
      </div>
    </div>
  );
}
