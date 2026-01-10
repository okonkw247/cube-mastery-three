import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const displayName = name || email.split('@')[0];

    const { error: emailError } = await resend.emails.send({
      from: "Cube Mastery <welcome@cube-mastery.site>",
      to: [email],
      subject: "Welcome to Cube Mastery! 🧊 Your Journey Begins Now",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a2e; color: #ffffff; padding: 40px; margin: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #2d2d44; border-radius: 16px; padding: 40px; }
            .header { text-align: center; margin-bottom: 32px; }
            .header h1 { font-size: 28px; margin: 0; }
            .section { background: #1a1a2e; border-radius: 12px; padding: 24px; margin: 24px 0; }
            .section h2 { color: #8b5cf6; margin-top: 0; font-size: 18px; }
            .step { display: flex; align-items: flex-start; margin: 16px 0; }
            .step-number { background: #8b5cf6; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; font-weight: bold; }
            .step-content { flex: 1; }
            .step-content h3 { margin: 0 0 4px 0; font-size: 16px; }
            .step-content p { margin: 0; color: #ccc; font-size: 14px; }
            .cta { text-align: center; margin: 32px 0; }
            .cta a { background: #8b5cf6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; }
            .plans { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 16px; }
            .plan { background: #2d2d44; border: 1px solid #3d3d54; border-radius: 8px; padding: 16px; text-align: center; }
            .plan h4 { margin: 0 0 8px 0; color: #8b5cf6; }
            .plan .price { font-size: 24px; font-weight: bold; }
            .plan .note { font-size: 12px; color: #888; }
            .footer { text-align: center; color: #888; font-size: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #3d3d54; }
            p { line-height: 1.6; color: #ccc; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧊 Welcome to Cube Mastery!</h1>
              <p style="color: #ccc; margin-top: 8px;">Hi ${displayName}, we're excited to have you!</p>
            </div>
            
            <div class="section">
              <h2>🚀 Getting Started</h2>
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h3>Explore Free Lessons</h3>
                  <p>Start with our free beginner lessons to get a feel for the platform.</p>
                </div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h3>Track Your Progress</h3>
                  <p>Your dashboard shows completed lessons, practice attempts, and streaks.</p>
                </div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h3>Practice Regularly</h3>
                  <p>Use our Practice Coach to time your solves and improve your speed.</p>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>💎 Upgrade Your Learning</h2>
              <p style="margin: 0 0 16px 0;">Unlock all lessons and advanced content with our plans:</p>
              <div class="plans">
                <div class="plan">
                  <h4>Starter Plan</h4>
                  <div class="price">$15</div>
                  <div class="note">One-time payment</div>
                </div>
                <div class="plan">
                  <h4>Pro Plan</h4>
                  <div class="price">$40</div>
                  <div class="note">One-time payment</div>
                </div>
              </div>
            </div>

            <div class="cta">
              <a href="https://cube-mastery.site/dashboard">Go to Your Dashboard →</a>
            </div>

            <div class="section">
              <h2>📖 Need Help?</h2>
              <p style="margin: 0;">Check our lessons for step-by-step guides, or reach out through the Settings page if you need support. We're here to help you master the cube!</p>
            </div>

            <div class="footer">
              <p>© ${new Date().getFullYear()} Cube Mastery. All rights reserved.</p>
              <p>You're receiving this because you signed up for Cube Mastery.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Failed to send welcome email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send welcome email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Welcome email sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
