import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface ThumbnailRequest {
  title: string;
  description?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description }: ThumbnailRequest = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please check your API key." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Generating thumbnail for:", title);

    const prompt = `Create a professional, eye-catching YouTube-style thumbnail for a Rubik's Cube speedcubing tutorial video.

Title: "${title}"
${description ? `Topic: ${description}` : ""}

REQUIREMENTS:
- Dark moody background with teal/cyan accent lighting and glow effects
- A photorealistic colorful 3D Rubik's Cube as the hero element, slightly angled
- High contrast, dramatic lighting with cinematic feel
- Bold white text overlay showing: "${title}" in large sans-serif font
- Teal/cyan colored accent elements (streaks, glows, particles)
- 16:9 aspect ratio (1280x720)
- YouTube thumbnail style: bold, clean, high contrast
- Make it look professional and premium
- Include subtle speed lines or motion blur to suggest speedcubing
- NO watermarks, NO logos except the cube itself`;

    console.log("Sending request to Lovable AI Gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      throw new Error(`AI Gateway returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("AI response received successfully");

    // Extract the base64 image from the response
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url 
      || data.choices?.[0]?.message?.content?.match(/data:image\/[^;]+;base64,[^\s"]+/)?.[0];

    if (!imageData) {
      console.error("No image in response:", JSON.stringify(data).substring(0, 500));
      throw new Error("No image was generated. Please try again.");
    }

    // Upload to Supabase storage
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        const fileName = `ai-generated-${Date.now()}.png`;
        
        const { error: uploadError } = await supabase.storage
          .from("thumbnails")
          .upload(fileName, imageBuffer, {
            contentType: "image/png",
            cacheControl: "3600",
            upsert: false,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("thumbnails")
            .getPublicUrl(fileName);

          console.log("Image uploaded to storage:", urlData.publicUrl);

          return new Response(
            JSON.stringify({ 
              success: true, 
              imageUrl: urlData.publicUrl,
              message: "Thumbnail generated and saved successfully" 
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        } else {
          console.error("Storage upload error:", uploadError);
        }
      } catch (storageError) {
        console.error("Storage error:", storageError);
      }
    }

    // Return base64 image if storage upload failed
    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: imageData,
        message: "Thumbnail generated successfully" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error generating thumbnail:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate thumbnail. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
