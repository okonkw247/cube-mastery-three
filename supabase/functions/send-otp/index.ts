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

interface OTPRequest {
  email: string;
  type: "login" | "password_reset";
}

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type }: OTPRequest = await req.json();

    if (!email || !type) {
      return new Response(
        JSON.stringify({ error: "Email and type are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate 6-digit OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: insertError } = await supabase
      .from("otp_codes")
      .insert({
        email: email.toLowerCase(),
        code,
        type,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Failed to store OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email via Resend
    const subject = type === "login" 
      ? "Your JSN Cubing Login Code" 
      : "Your JSN Cubing Password Reset Code";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #ffffff; padding: 40px; }
          .container { max-width: 500px; margin: 0 auto; background: #2d2d44; border-radius: 16px; padding: 40px; }
          .logo { text-align: center; margin-bottom: 24px; }
          .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center; background: #1a1a2e; padding: 20px; border-radius: 12px; margin: 24px 0; color: #8b5cf6; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 24px; }
          h1 { text-align: center; margin-bottom: 16px; }
          p { text-align: center; color: #ccc; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>🧊 JSN Cubing</h1>
          </div>
          <p>${type === "login" ? "Use this code to sign in to your account:" : "Use this code to reset your password:"}</p>
          <div class="code">${code}</div>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't request this code, you can safely ignore this email.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} JSN Cubing. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { error: emailError } = await resend.emails.send({
      from: "JSN Cubing <onboarding@resend.dev>",
      to: [email],
      subject,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Failed to send email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`OTP sent to ${email} for ${type}`);

    return new Response(
      JSON.stringify({ success: true, message: "Code sent to your email" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
