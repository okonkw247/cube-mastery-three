import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompleteLoginRequest {
  email: string;
  code: string;
  isNewUser?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, isNewUser }: CompleteLoginRequest = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "Email and code are required" }),
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
      .eq("type", "login")
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

    // Check for user
    const { data: userData } = await supabase.auth.admin.listUsers();
    const existingUser = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!existingUser) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check for pending upgrade
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

    // Generate magic link for authenticated session
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

    // Log successful login
    await supabase.from("activity_log").insert({
      user_email: email.toLowerCase(),
      user_id: existingUser.id,
      action: "OTP verified, login completed",
      action_type: "auth",
      details: { email: email.toLowerCase(), isNewUser }
    });

    // Send login notification email
    const userAgent = "Web Browser";
    const loginTime = new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    });

    try {
      await resend.emails.send({
        from: "Cube Mastery <security@cube-mastery.site>",
        to: [email],
        subject: "New Sign-in to Your Cube Mastery Account",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #ffffff; padding: 40px; }
              .container { max-width: 500px; margin: 0 auto; background: #2d2d44; border-radius: 16px; padding: 40px; }
              .alert { background: #22c55e20; border: 1px solid #22c55e40; border-radius: 8px; padding: 16px; margin: 16px 0; }
              h1 { text-align: center; margin-bottom: 16px; }
              p { color: #ccc; line-height: 1.6; }
              .footer { text-align: center; color: #888; font-size: 12px; margin-top: 24px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🔐 New Sign-in Detected</h1>
              <div class="alert">
                <p><strong>Time:</strong> ${loginTime}</p>
                <p><strong>Device:</strong> ${userAgent}</p>
              </div>
              <p>If this was you, you can safely ignore this email.</p>
              <p>If you didn't sign in, please secure your account immediately by changing your password.</p>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Cube Mastery. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send login notification:", emailErr);
      // Don't fail the login if notification fails
    }

    // Extract token from link URL
    const url = new URL(linkData.properties.action_link);
    const token = url.searchParams.get('token');

    return new Response(
      JSON.stringify({ 
        success: true,
        actionLink: linkData.properties.action_link,
        token: token,
        userId: existingUser.id,
        isNewUser: isNewUser || false,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in complete-login function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
