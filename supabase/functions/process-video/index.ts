import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    const { lessonId, videoUrl, title, durationSeconds }: ProcessRequest = await req.json();

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

    // Step 2: Update metadata to "complete"
    // Note: AI thumbnail generation removed. Use client-side Canvas generator instead.
    const { error: finalError } = await supabase
      .from("video_metadata")
      .update({
        processing_status: "complete",
        processed_at: new Date().toISOString(),
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
        thumbnails: [],
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
