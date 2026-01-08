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

interface NotificationRequest {
  email: string;
  userAgent?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userAgent }: NotificationRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log this sign-in activity for admin dashboard
    await supabase.from("activity_log").insert({
      user_email: email.toLowerCase(),
      action: "User signed in",
      action_type: "auth",
      details: { 
        email: email.toLowerCase(),
        userAgent: userAgent || "Unknown device",
        timestamp: new Date().toISOString()
      }
    });

    const loginTime = new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #ffffff; padding: 40px; }
          .container { max-width: 500px; margin: 0 auto; background: #2d2d44; border-radius: 16px; padding: 40px; }
          .logo { text-align: center; margin-bottom: 24px; }
          .info-box { background: #1a1a2e; padding: 16px; border-radius: 12px; margin: 24px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #3d3d54; }
          .info-row:last-child { border-bottom: none; }
          .label { color: #888; }
          .value { color: #fff; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 24px; }
          h1 { text-align: center; margin-bottom: 16px; }
          p { text-align: center; color: #ccc; line-height: 1.6; }
          .warning { background: #4a1d1d; border: 1px solid #8b3a3a; border-radius: 8px; padding: 12px; margin-top: 20px; text-align: center; }
          .warning p { color: #ff9999; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>🧊 Cube Mastery</h1>
          </div>
          <h2 style="text-align: center; color: #8b5cf6;">New Sign-In Detected</h2>
          <p>We detected a new sign-in to your Cube Mastery account.</p>
          
          <div class="info-box">
            <div class="info-row">
              <span class="label">Time</span>
              <span class="value">${loginTime}</span>
            </div>
            <div class="info-row">
              <span class="label">Email</span>
              <span class="value">${email}</span>
            </div>
            ${userAgent ? `
            <div class="info-row">
              <span class="label">Device</span>
              <span class="value" style="font-size: 11px;">${userAgent.substring(0, 50)}...</span>
            </div>
            ` : ""}
          </div>
          
          <div class="warning">
            <p>If this wasn't you, please secure your account immediately.</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Cube Mastery. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using verified domain cube-mastery.site
    const { error: emailError } = await resend.emails.send({
      from: "Cube Mastery <noreply@cube-mastery.site>",
      to: [email],
      subject: "New Sign-In to Your Cube Mastery Account",
      html: emailHtml,
    });

    if (emailError) {
      console.error("Failed to send login notification:", emailError);
      // Don't return error - login notification is not critical
    }

    console.log(`Login notification sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-login-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
