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

    const prompt = `Create a professional, eye-catching YouTube-style thumbnail for a Rubik's Cube tutorial video titled "${title}". ${description ? `The lesson covers: ${description}.` : ""} 
    
    Style requirements:
    - Modern, clean design with vibrant colors
    - Include a colorful 3D Rubik's Cube as the main visual element
    - Dark or gradient background for contrast
    - Professional and educational feel
    - 16:9 aspect ratio composition
    - High quality, photorealistic style
    - Dynamic lighting with subtle glow effects
    - No text overlays`;

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

    // Extract the base64 image from the response - handle multiple response formats
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url 
      || data.choices?.[0]?.message?.content?.match(/data:image\/[^;]+;base64,[^\s"]+/)?.[0];

    if (!imageData) {
      console.error("No image in response:", JSON.stringify(data).substring(0, 500));
      throw new Error("No image was generated. Please try again.");
    }

    // If we have Supabase credentials, upload the image to storage
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Convert base64 to blob
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

    // Return base64 image if storage upload failed or not configured
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
