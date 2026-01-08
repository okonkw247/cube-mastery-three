import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  email: string;
  code: string;
  type: "login" | "password_reset";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, type }: VerifyRequest = await req.json();

    if (!email || !code || !type) {
      return new Response(
        JSON.stringify({ error: "Email, code, and type are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find valid OTP
    const { data: otpData, error: otpError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("code", code)
      .eq("type", type)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired code" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark OTP as used
    await supabase
      .from("otp_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", otpData.id);

    // For login type, check if user exists and sign them in
    if (type === "login") {
      const { data: userData } = await supabase.auth.admin.listUsers();
      const existingUser = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (!existingUser) {
        // Create new user with verified email
        const tempPassword = crypto.randomUUID();
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email.toLowerCase(),
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: "" }
        });

        if (createError) {
          console.error("Failed to create user:", createError);
          return new Response(
            JSON.stringify({ error: "Failed to create account" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Check if there's a pending upgrade for this email
        const { data: pendingUpgrade } = await supabase
          .from("pending_upgrades")
          .select("*")
          .eq("email", email.toLowerCase())
          .is("applied_at", null)
          .single();

        if (pendingUpgrade && newUser?.user) {
          // Apply the pending upgrade
          await supabase
            .from("profiles")
            .update({ subscription_tier: pendingUpgrade.plan })
            .eq("user_id", newUser.user.id);

          await supabase
            .from("pending_upgrades")
            .update({ applied_at: new Date().toISOString() })
            .eq("id", pendingUpgrade.id);

          console.log(`Applied pending upgrade to ${pendingUpgrade.plan} for ${email}`);
        }

        // Generate magic link for new user
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: email.toLowerCase(),
        });

        if (linkError || !linkData) {
          console.error("Failed to generate link:", linkError);
          return new Response(
            JSON.stringify({ error: "Failed to complete sign in" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Extract token from link URL
        const url = new URL(linkData.properties.action_link);
        const token = url.searchParams.get('token');

        return new Response(
          JSON.stringify({ 
            success: true, 
            isNewUser: true,
            actionLink: linkData.properties.action_link,
            token: token,
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check for pending upgrade for existing user
      const { data: pendingUpgrade } = await supabase
        .from("pending_upgrades")
        .select("*")
        .eq("email", email.toLowerCase())
        .is("applied_at", null)
        .single();

      if (pendingUpgrade) {
        await supabase
          .from("profiles")
          .update({ subscription_tier: pendingUpgrade.plan })
          .eq("user_id", existingUser.id);

        await supabase
          .from("pending_upgrades")
          .update({ applied_at: new Date().toISOString() })
          .eq("id", pendingUpgrade.id);

        console.log(`Applied pending upgrade to ${pendingUpgrade.plan} for ${email}`);
      }

      // Generate magic link for existing user
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: email.toLowerCase(),
      });

      if (linkError || !linkData) {
        console.error("Failed to generate link:", linkError);
        return new Response(
          JSON.stringify({ error: "Failed to complete sign in" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Extract token from link URL
      const url = new URL(linkData.properties.action_link);
      const token = url.searchParams.get('token');

      return new Response(
        JSON.stringify({ 
          success: true, 
          isNewUser: false,
          actionLink: linkData.properties.action_link,
          token: token,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // For password_reset, just validate the code
    return new Response(
      JSON.stringify({ success: true, verified: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
