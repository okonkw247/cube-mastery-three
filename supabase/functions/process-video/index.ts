import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface ProcessRequest {
  lessonId: string;
  videoPath: string;
  videoUrl: string;
  title: string;
  description?: string;
  durationSeconds?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lessonId, videoPath, videoUrl, title, description, durationSeconds }: ProcessRequest = await req.json();

    if (!lessonId || !videoUrl) {
      return new Response(
        JSON.stringify({ error: "lessonId and videoUrl are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`Processing video for lesson ${lessonId}: ${title}`);

    // Step 1: Create or update video_metadata record as "processing"
    const { error: upsertError } = await supabase
      .from("video_metadata")
      .upsert({
        lesson_id: lessonId,
        duration_seconds: durationSeconds || null,
        processing_status: "processing",
        available_resolutions: ["Auto"],
        updated_at: new Date().toISOString(),
      }, { onConflict: "lesson_id" });

    if (upsertError) {
      console.error("Failed to upsert metadata:", upsertError);
    }

    // Step 2: Generate AI thumbnails (3 styles)
    const thumbnailResults: { style: string; url: string }[] = [];

    if (LOVABLE_API_KEY) {
      const styles = [
        {
          name: "educational",
          prompt: `Create a clean, professional educational thumbnail for a Rubik's Cube tutorial titled "${title}". ${description ? `Topic: ${description}.` : ""} Style: clean white/light background, a 3D Rubik's Cube in focus, soft lighting, educational and approachable feel. 16:9 aspect ratio. No text overlays.`,
        },
        {
          name: "youtube",
          prompt: `Create a high-contrast, eye-catching YouTube-style thumbnail for a Rubik's Cube video titled "${title}". ${description ? `Topic: ${description}.` : ""} Style: vibrant neon colors, dramatic lighting, dark background with color pops, dynamic angle on a Rubik's Cube, energetic and bold. 16:9 aspect ratio. No text overlays.`,
        },
        {
          name: "minimal",
          prompt: `Create a minimal, professional thumbnail for a Rubik's Cube lesson titled "${title}". ${description ? `Topic: ${description}.` : ""} Style: flat design, muted elegant colors, centered Rubik's Cube icon, clean geometric composition, modern and sophisticated. 16:9 aspect ratio. No text overlays.`,
        },
      ];

      for (const style of styles) {
        try {
          console.log(`Generating ${style.name} thumbnail...`);
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-pro-image-preview",
              messages: [{ role: "user", content: style.prompt }],
              modalities: ["image", "text"],
            }),
          });

          if (!aiResponse.ok) {
            console.error(`AI error for ${style.name}:`, aiResponse.status);
            continue;
          }

          const aiData = await aiResponse.json();
          const imageData =
            aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url ||
            aiData.choices?.[0]?.message?.content?.match(/data:image\/[^;]+;base64,[^\s"]+/)?.[0];

          if (imageData) {
            // Upload to storage
            const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
            const imageBuffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
            const fileName = `${lessonId}/${style.name}-${Date.now()}.png`;

            const { error: uploadErr } = await supabase.storage
              .from("thumbnails")
              .upload(fileName, imageBuffer, {
                contentType: "image/png",
                cacheControl: "31536000",
                upsert: true,
              });

            if (!uploadErr) {
              const { data: urlData } = supabase.storage.from("thumbnails").getPublicUrl(fileName);
              thumbnailResults.push({ style: style.name, url: urlData.publicUrl });
              console.log(`${style.name} thumbnail saved: ${urlData.publicUrl}`);
            } else {
              console.error(`Upload error for ${style.name}:`, uploadErr);
            }
          }
        } catch (err) {
          console.error(`Failed to generate ${style.name} thumbnail:`, err);
        }
      }

      // Set the first successful thumbnail as the lesson thumbnail if none exists
      if (thumbnailResults.length > 0) {
        const { data: lesson } = await supabase
          .from("lessons")
          .select("thumbnail_url")
          .eq("id", lessonId)
          .single();

        if (!lesson?.thumbnail_url) {
          await supabase
            .from("lessons")
            .update({ thumbnail_url: thumbnailResults[0].url })
            .eq("id", lessonId);
          console.log("Auto-set lesson thumbnail to:", thumbnailResults[0].url);
        }
      }
    }

    // Step 3: Update metadata to "complete"
    const { error: finalError } = await supabase
      .from("video_metadata")
      .update({
        processing_status: "complete",
        processed_at: new Date().toISOString(),
        // Note: Frame extraction and sprite sheets require client-side Canvas API
        // since FFmpeg is not available in Edge Functions
        updated_at: new Date().toISOString(),
      })
      .eq("lesson_id", lessonId);

    if (finalError) {
      console.error("Failed to finalize metadata:", finalError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        lessonId,
        thumbnails: thumbnailResults,
        metadata: {
          duration_seconds: durationSeconds,
          processing_status: "complete",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Process video error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process video" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
