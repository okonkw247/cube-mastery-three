import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyPasswordRequest {
  email: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password }: VerifyPasswordRequest = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to sign in to verify credentials, but we won't use the session
    // This is a verification-only operation
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (error) {
      console.log("Password verification failed:", error.message);
      return new Response(
        JSON.stringify({ valid: false, error: error.message }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Password is valid - immediately sign out to invalidate the session
    // The user should only get a valid session after OTP verification
    if (data?.session) {
      await supabase.auth.admin.signOut(data.session.access_token, "global");
    }

    // Log this activity
    await supabase.from("activity_log").insert({
      user_email: email.toLowerCase(),
      user_id: data.user?.id,
      action: "Password verified, awaiting OTP",
      action_type: "auth",
      details: { email: email.toLowerCase(), verified: true }
    });

    return new Response(
      JSON.stringify({ 
        valid: true, 
        userId: data.user?.id,
        message: "Password verified, OTP required" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
